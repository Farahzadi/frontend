import { EventEmitter } from "events";

/** @typedef {(string|[event: string, checker: function(...*):boolean])} StageEvent */
/** @typedef {{events: [StageEvent], route: string, onHappen?: function, waitForAllEvents?: boolean}} SideRoute */

class AdvancedEventEmitter extends EventEmitter {

  handlers = {};
  allHandlers = {};

  /** @param {StageEvent} event */
  static parseEvent(event) {
    return event instanceof Array ? event : [event, () => true];
  }

  /** @param {[StageEvent]} events */
  static parseEvents(events) {
    if (!events) return [];
    return events.map(event => this.parseEvent(event));
  }

  _random() {
    return new Date().getTime().toString(36) + Math.random().toString(36).slice(2);
  }

  _generateId() {
    while (true) {
      const id = this._random();
      if (!(id in this.handlers) && !(id in this.allHandlers)) return id;
    }
  }

  on(event, handler, passId = false) {
    const id = this._generateId();
    const [name, checker] = this.constructor.parseEvent(event);
    const finalHandler = (...args) => checker(...args) && handler(...(passId ? [id, ...args] : args));
    super.on(name, finalHandler);
    this.handlers[id] = [name, finalHandler];
    return id;
  }

  off(id) {
    if (!id || !(id in this.handlers)) return;
    const [name, handler] = this.handlers[id];
    super.off(name, handler);
    delete this.handlers[id];
  }

  _triggerAllBatch(id, waitForAllEvents, eventName, ...args) {
    const allHandler = this.allHandlers[id];
    if (!allHandler || allHandler.done) return;
    const done = !waitForAllEvents ? true : !allHandler.ids.some(childId => !allHandler.finished[childId]);
    if (done) {
      allHandler.done = true;
      const handler = allHandler.handler;
      this.offAll(id);
      handler?.(eventName, ...args);
    }
  }

  onAll(events, handler, waitForAllEvents = true) {
    events = this.constructor.parseEvents(events);
    const id = this._generateId();
    const childrenIds = events.map(event =>
      this.on(
        event,
        (_childId, ...args) => {
          const allHandler = this.allHandlers[id];
          allHandler.finished[_childId] = true;
          this._triggerAllBatch(id, waitForAllEvents, event[0], ...args);
        },
        true,
      ),
    );
    this.allHandlers[id] = {
      ids: childrenIds,
      finished: {},
      handler,
      done: false,
    };
  }

  offAll(id) {
    if (!id || !(id in this.allHandlers)) return;
    this.allHandlers[id].ids.forEach(childId => this.off(childId));
    delete this.allHandlers[id];
  }

}

export class Stage {

  /** @type {string} */
  name = "";

  /** @type {[string]} */
  parents = [];

  /** @enum {string} status "READY" | "RUNNING" | "FINISHED" */
  status = "READY";

  /** @type {[string]} */
  children = [];

  _onReady;
  _onStart;
  _onFinish;

  startPromise;
  finishPromise;

  _startPromiseResolve;
  _finishPromiseResolve;
  _startPromiseReject;
  _finishPromiseReject;

  /** @type {AdvancedEventEmitter} */
  _eventSource;
  /** @type {EventEmitter} */
  _eventSink;

  _eventsToStart = [];
  _eventsToFinish = [];

  /** @type {[SideRoute]} */
  _sideRoutes = [];

  _startEventHandlerId = null;
  _finishEventHandlerId = null;
  _sideRouteEventHandlerIds = [];

  /**
   * @param {string} route
   * The main route of a stage to go after finishing.
   * @param {[StageEvent]} eventsToStart
   * Single string for triggering start when the event happenes.
   * Or list of string and a checker function to run the checker whenever the event happenes
   * and trigger start if the returned value was true.
   * @param {[StageEvent]} eventsToFinish
   * Single string for triggering finish when the event happenes.
   * Or list of string and a checker function to run the checker whenever the event happenes
   * and trigger finish if the returned value was true.
   * @param {function(function)} onReady
   * Runs when the stage becomes current stage.
   * Has a function argument that if you want to skip this stage you can call.
   * @param {function()} onStart
   * Runs when the stage has started running.
   * @param {function(boolean)} onFinish
   * Runs when the stage finished running and is ready to pass the current place to the next stage.
   * Has a boolean argument that shows if the stage was finished by skipping or not.
   * @param {[SideRoute]} sideRoutes
   * Other possible routes to go as exceptions when given events happen.
   * @param {[string]} parents
   * list of parents to override routes
   * @param {boolean} waitForAllStartEvents
   * Whether to wait for all start event to happen or not.
   * @param {boolean} waitForAllFinishEvents
   * Whether to wait for all finish event to happen or not.
   * @param {string} name
   * The name of the stage (optional: can be handled by the StageManager)
   */
  constructor(
    route = null,
    eventsToStart = [],
    eventsToFinish = [],
    onReady = (skip, start) => {},
    onStart = finish => {},
    onFinish = skipped => {},
    sideRoutes = [],
    parents = [],
    waitForAllStartEvents = false,
    waitForAllFinishEvents = false,
    name = null,
  ) {
    this.name = name;
    this.parents = parents || [];
    this.route = route || null;
    this._onReady = onReady || (skip => {});
    this._onStart = onStart || (() => {});
    this._onFinish = onFinish || (skipped => {});
    this._eventsToStart = AdvancedEventEmitter.parseEvents(eventsToStart);
    this._eventsToFinish = AdvancedEventEmitter.parseEvents(eventsToFinish);
    this._waitForAllStartEvents = waitForAllStartEvents ?? false;
    this._waitForAllFinishEvents = waitForAllFinishEvents ?? false;
    this._sideRoutes = (sideRoutes ?? []).map(sideRoute => ({
      ...sideRoute,
      waitForAllEvents: sideRoute.waitForAllEvents ?? false,
      events: AdvancedEventEmitter.parseEvents(sideRoute.events),
    }));
    this.reset();
  }

  reset() {
    this.status = "READY";
    this._startPromiseResolve?.(false);
    this._finishPromiseResolve?.(false);
    this.startPromise = new Promise((res, rej) => {
      this._startPromiseResolve = res;
      this._startPromiseReject = rej;
    });
    this.finishPromise = new Promise((res, rej) => {
      this._finishPromiseResolve = res;
      this._finishPromiseReject = rej;
    });
    this._removeStartEventHandlers();
    this._startEventHandlerId = null;
    this._removeFinishEventHandlers();
    this._finishEventHandlerId = null;
    this._removeSideRouteEventHandlers();
    this._sideRouteEventHandlerIds = [];
  }

  /**
   * Triggers the ready state of the stage.
   * Also resets the stage to be able to behave normally if it's being reached again.
   */
  trigger() {
    this.reset();
    this._ready();
  }

  _ready() {
    this._addSideRouteEventHandlers();
    this._addStartEventHandlers();
    this.status = "READY";
    this._onReady?.(
      () => {
        if (this.status !== "FINISHED") this._finish(true);
      },
      () => {
        if (this.status === "READY") this._start();
      },
    );
    this._eventSink?.emit("STAGE_READY", this.name);
    if (this._eventsToStart.length === 0) this._start();
  }

  _start() {
    this._removeStartEventHandlers();
    this._addFinishEventHandlers();
    this.status = "RUNNING";
    this._startPromiseResolve(true);
    this._onStart?.(() => {
      if (this.status === "RUNNING") this._finish();
    });
    this._eventSink?.emit("STAGE_STARTED", this.name);
    if (this._eventsToFinish.length === 0) this._finish();
  }

  _finish(skipped = false) {
    this._removeSideRouteEventHandlers();
    this._removeFinishEventHandlers();
    this.status = "FINISHED";
    this._finishPromiseResolve(true);
    this._onFinish?.(skipped);
    this._eventSink?.emit("STAGE_FINISHED", this.name);
  }

  _addStartEventHandlers() {
    this._startEventHandlerId = this._eventSource.onAll(
      this._eventsToStart.map(([event, checker]) => [event, (...args) => this.status === "READY" && checker(...args)]),
      () => this._start(),
      this._waitForAllStartEvents,
    );
  }

  _removeStartEventHandlers() {
    this._eventSource?.offAll(this._startEventHandlerId);
  }

  _addFinishEventHandlers() {
    this._finishEventHandlerId = this._eventSource.onAll(
      this._eventsToFinish.map(([event, checker]) => [
        event,
        (...args) => this.status === "RUNNING" && checker(...args),
      ]),
      () => this._finish(),
      this._waitForAllFinishEvents,
    );
  }

  _removeFinishEventHandlers() {
    this._eventSource?.offAll(this._finishEventHandlerId);
  }

  _addSideRouteEventHandlers() {
    const handlerIds = this._sideRoutes.map(sideRoute =>
      this._eventSource.onAll(
        sideRoute.events,
        (event, ...args) => {
          sideRoute.onHappen?.(sideRoute.route, event, ...args);
          this._eventSink?.emit("STAGE_EXCEPTION", this.name, sideRoute.route || this.route);
        },
        sideRoute.waitForAllEvents,
      ),
    );
    this._sideRouteEventHandlerIds = handlerIds;
  }

  _removeSideRouteEventHandlers() {
    this._sideRouteEventHandlerIds?.forEach(id => this._eventSource?.offAll(id));
  }

  _removeEventHandlers() {
    this._removeFinishEventHandlers();
    this._removeStartEventHandlers();
    this._removeSideRouteEventHandlers();
  }

  setEventSource(eventSource) {
    this._eventSource = eventSource;
  }

  setEventSink(eventSink) {
    this._eventSink = eventSink;
  }

  setName(name) {
    this.name = name;
  }

  /**
   * @param {Stage|string} stage
   */
  setRoute(stage) {
    this.route = stage instanceof Stage ? stage.name : stage;
  }

  /** @param {string?} name */
  copy(name = null) {
    return new Stage(
      this.route,
      [...this._eventsToStart],
      [...this._eventsToFinish],
      this._onReady,
      this._onStart,
      this._onFinish,
      [...this._sideRoutes],
      [...this.parents],
      this._waitForAllStartEvents,
      this._waitForAllFinishEvents,
      name ?? this.name,
    );
  }

}

export class StageManager {

  stages;
  entry;

  current;

  /** @type {AdvancedEventEmitter} */
  _emitter;
  /** @type {EventEmitter} */
  _stageEventListener;
  /** @type {EventEmitter} */
  _eventSink;

  /**
   * @param {{name:Stage}} stages
   * @param {string} entry Starting stage node
   * @param {[string | [event: string, checker: function(object):boolean]]} eventsToReset
   * @param {function} onStart
   * @param {EventEmitter} eventSink output event emitter for getting stage changes
   */
  constructor(stages, entry = null, eventsToReset = [], onStart = () => {}, eventSink = null) {
    this.stages = Object.fromEntries(Object.entries(stages).map(([name, stage]) => [name, stage.copy(name)]));
    this.entry = this.stages[entry] && entry;
    Object.values(this.stages).forEach(stage => {
      stage.parents.forEach(parent => {
        this.stages[parent].setRoute(stage);
      });
    });
    this._eventsToRestart = eventsToReset.map(item => (item instanceof Array ? item : [item, () => true]));
    this._onStart = onStart;
    this._eventSink = eventSink instanceof EventEmitter ? eventSink : null;
    this.reset();
  }

  reset() {
    Object.values(this.stages).forEach(stage => stage.reset());
    this._emitter = new AdvancedEventEmitter();
    this._stageEventListener = new EventEmitter();
    Object.values(this.stages).forEach(stage => {
      stage.setEventSource(this._emitter);
      stage.setEventSink(this._stageEventListener);
    });
    this._stageEventListener.on("STAGE_STARTED", stage => {
      this._eventSink?.emit("STAGE_STATUS_CHANGED", stage, this.stages[stage].status);
    });
    this._stageEventListener.on("STAGE_FINISHED", stage => {
      this._move(this.stages[stage].route);
    });
    this._stageEventListener.on("STAGE_EXCEPTION", (stage, route) => {
      this._move(route);
    });
    this._eventsToRestart.forEach(event => this._emitter.on(event, () => this.restart()));
  }

  /**
   * @param {string?} entry Starting stage node
   * @throws Will throw an error when no source of an entry point was found.
   */
  start(entry = null) {
    entry = (this.stages[entry] && entry) || this.entry;
    if (!entry) throw new Error("No entry point found to start the staging process");
    this.entry = entry;
    this._onStart?.();
    this._move(entry);
  }

  restart() {
    this.reset();
    this.start();
  }

  /** @param {string} stage */
  _move(stage) {
    this.current = stage;
    this._eventSink?.emit("STAGE_CHANGED", stage, "READY");
    this.stages[stage].trigger();
  }

  emit(event, ...args) {
    this._emitter.emit(event, ...args);
  }

}
