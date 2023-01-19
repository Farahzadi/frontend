import { EventEmitter } from "events";

/** @typedef {(string|[event: string, checker: function(...*):boolean])} StageEvent */

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

  /** @type {EventEmitter} */
  _eventSource;
  /** @type {EventEmitter} */
  _eventSink;

  _eventsToStart = [];
  _eventsToFinish = [];

  _startEventHandlers = [];
  _finishEventHandlers = [];
  _sideRouteEventHandlers = [];

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
   * @param {[{events: [StageEvent], route: string, onHappen?: function}]} sideRoutes
   * Other possible routes to go as exceptions when given events happen.
   * @param {[string]} parents
   * @param {string} name
   * The name of the stage (optional: can be handled by the StageManager)
   */
  constructor(
    route = null,
    eventsToStart = [],
    eventsToFinish = [],
    onReady = skip => {},
    onStart = () => {},
    onFinish = skipped => {},
    sideRoutes = [],
    parents = [],
    name = null,
  ) {
    this.name = name;
    this.parents = parents || [];
    this.route = route || null;
    this._onReady = onReady || (skip => {});
    this._onStart = onStart || (() => {});
    this._onFinish = onFinish || (skipped => {});
    this._eventsToStart = Stage.formatEvents(eventsToStart);
    this._eventsToFinish = Stage.formatEvents(eventsToFinish);
    this._sideRoutes = sideRoutes.map(sideRoute => ({ ...sideRoute, events: Stage.formatEvents(sideRoute.events) }));
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
    this._startEventHandlers = [];
    this._removeFinishEventHandlers();
    this._finishEventHandlers = [];
    this._removeSideRouteEventHandlers();
    this._sideRouteEventHandlers = [];
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
    this._onReady?.(() => {
      this._finish(true);
    });
    this._eventSink?.emit("STAGE_READY", this.name);
    if (this._eventsToStart.length === 0) this._start();
  }

  _start() {
    this._removeStartEventHandlers();
    this._addFinishEventHandlers();
    this.status = "RUNNING";
    this._startPromiseResolve(true);
    this._onStart?.();
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
    this._startEventHandlers = this._eventsToStart.map(([event, checker]) => [
      event,
      (...data) => this.status === "READY" && checker(...data) && this._start(),
    ]);
    this._startEventHandlers.forEach(([event, handler]) => this._eventSource?.on(event, handler));
  }

  _removeStartEventHandlers() {
    this._finishEventHandlers?.forEach(([event, handler]) => this._eventSource?.off(event, handler));
  }

  _addFinishEventHandlers() {
    this._finishEventHandlers = this._eventsToFinish.map(([event, checker]) => [
      event,
      (...data) => this.status === "RUNNING" && checker(...data) && this._finish(),
    ]);
    this._finishEventHandlers.forEach(([event, handler]) => this._eventSource?.on(event, handler));
  }

  _removeFinishEventHandlers() {
    this._finishEventHandlers?.forEach(([event, handler]) => this._eventSource?.off(event, handler));
  }

  _addSideRouteEventHandlers() {
    const handlers = [];
    this._sideRoutes.forEach(sideRoute =>
      sideRoute.events.forEach(([event, checker]) =>
        handlers.push([
          event,
          (...data) => {
            if (checker(...data)) {
              sideRoute.onHappen?.(sideRoute.route, event, ...data);
              this._eventSink?.emit("STAGE_EXCEPTION", this.name, sideRoute.route || this.route);
            }
          },
        ]),
      ),
    );
    handlers.forEach(([event, handler]) => this._eventSource?.on(event, handler));
    this._sideRouteEventHandlers = handlers;
  }

  _removeSideRouteEventHandlers() {
    this._sideRouteEventHandlers?.forEach(([event, handler]) => this._eventSource?.off(event, handler));
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
      [...this.parents],
      [...this._eventsToStart],
      [...this._eventsToFinish],
      this._onReady,
      this._onStart,
      this._onFinish,
      this.route,
      [...this._sideRoutes],
      name ?? this.name,
    );
  }

  /** @param {[StageEvent]} events */
  static formatEvents(events) {
    if (!events) return [];
    return events.map(item => (item instanceof Array ? item : [item, () => true]));
  }

}

export class StageManager {

  stages;
  entry;

  current;

  /** @type {EventEmitter} */
  _emitter;
  /** @type {EventEmitter} */
  _stageEventListener;
  /** @type {EventEmitter} */
  _eventSink;

  /**
   * @param {{name:Stage}} stages
   * @param {string} entry Starting stage node
   * @param {[string | [event: string, checker: function(object):boolean]]} eventsToReset
   */
  constructor(stages, entry = null, eventsToReset = [], eventSink = null) {
    this.stages = Object.fromEntries(Object.entries(stages).map(([name, stage]) => [name, stage.copy(name)]));
    this.entry = this.stages[entry] && entry;
    Object.values(this.stages).forEach(stage => {
      stage.parents.forEach(parent => {
        this.stages[parent].setRoute(stage);
      });
    });
    this._eventsToRestart = eventsToReset.map(item => (item instanceof Array ? item : [item, () => true]));
    this._eventSink = eventSink instanceof EventEmitter ? eventSink : null;
    this.reset();
  }

  reset() {
    Object.values(this.stages).forEach(stage => stage.reset());
    this._emitter = new EventEmitter();
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
    this._eventsToRestart.forEach(([event, checker]) =>
      this._emitter.on(event, (...data) => checker(...data) && this.restart()),
    );
  }

  /**
   * @param {string?} entry Starting stage node
   * @throws Will throw an error when no source of an entry point was found.
   */
  start(entry = null) {
    entry = (this.stages[entry] && entry) || this.entry;
    if (!entry) throw new Error("No entry point found to start the staging process");
    this.entry = entry;
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
