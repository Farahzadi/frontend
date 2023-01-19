import { EventEmitter } from "events";

export class Stage {

  /** @type {string} */
  name = "";

  /** @type {[string]} */
  parents = [];

  /** @enum {string} status "INITIAL" | "RUNNING" | "FINISHED" */
  status = "INITIAL";

  /** @type {[string]} */
  children = [];

  _onStart;
  _onFinish;

  startPromise;
  finishPromise;

  _startPromiseResolve;
  _finishPromiseResolve;
  _startPromiseReject;
  _finishPromiseReject;

  _finishedParents;

  eventSource;

  _eventsToFinish = [];

  /**
   * @param {[string]} parents
   * @param {[string | [event: string, checker: function(object):boolean]]} eventsToFinish
   * Single string for triggering finish when the event happenes.
   * Or list of string and a checker function to run the checker whenever the event happenes
   * and trigger finish if the returned value was true.
   * @param {function(function)} onStart
   * Has a function argument that if you want to skip this stage you can call.
   * @param {function(boolean)} onFinish
   * Has a boolean argument that shows if the stage was finished by skipping or not.
   * @param {[string]} children
   * @param {string} name
   */
  constructor(
    parents = [],
    eventsToFinish = [],
    onStart = skip => {},
    onFinish = skipped => {},
    children = [],
    name = null,
  ) {
    this.name = name;
    this.parents = parents || [];
    this.children = children || [];
    this._onStart = onStart || (() => {});
    this._onFinish = onFinish || (() => {});
    this._eventsToFinish = eventsToFinish.map(item => (item instanceof Array ? item : [item, () => true]));
    this.reset();
  }

  reset() {
    this.status = "INITIAL";
    // this._startPromiseReject?.();
    // this._finishPromiseReject?.();
    this.startPromise = new Promise((res, rej) => {
      this._startPromiseResolve = res;
      this._startPromiseReject = rej;
    });
    this.finishPromise = new Promise((res, rej) => {
      this._finishPromiseResolve = res;
      this._finishPromiseReject = rej;
    });
    this.finishedParents = new Set();
    this._removeFinishEventHandlers();
    this._finishEventHandlers = [];
  }

  /**
   * @param {string?} parent
   * Parent name to trigger this node as its child.
   * Empty for triggering when this node doesn't have any paretns
   */
  triggerStart(parent = null) {
    if (parent && this.parents.includes(parent)) this.finishedParents.add(parent);
    if (this.status === "INITIAL" && this.finishedParents.size === this.parents.length) this._start();
  }

  // triggerFinish(eventName, data = undefined) {
  //   if (this.status === "RUNNING" && this._eventsToFinish?.[eventName]?.(data)) this._finish();
  // }

  _addFinishEventHandlers() {
    this._finishEventHandlers = this._eventsToFinish.map(([event, checker]) => [
      event,
      (...data) => this.status === "RUNNING" && checker(...data) && this._finish(),
    ]);
    this._finishEventHandlers.forEach(([event, handler]) => this.eventSource?.on(event, handler));
  }

  _removeFinishEventHandlers() {
    this._finishEventHandlers?.forEach(([event, handler]) => this.eventSource?.off(event, handler));
  }

  _start() {
    this._addFinishEventHandlers();
    this.status = "RUNNING";
    this._startPromiseResolve();
    this._onStart?.(() => {
      this._finish(true);
    });
  }

  _finish(skipped = false) {
    this._removeFinishEventHandlers();
    this.status = "FINISHED";
    this._finishPromiseResolve();
    this._onFinish?.(skipped);
    this.eventSource?.emit("STAGE_FINISHED", this.name);
  }

  setEventSource(eventSource) {
    this.eventSource = eventSource;
  }

  setName(name) {
    this.name = name;
  }

  /**
   * @param {Stage|string} parent
   */
  addParent(parent) {
    parent = parent instanceof Stage ? parent.name : parent;
    if (!this.parents.includes(parent) && parent !== this.name) this.parents.push(parent);
  }

  /**
   * @param {Stage|string} child
   */
  addChild(child) {
    child = child instanceof Stage ? child.name : child;
    if (!this.children.includes(child) && child !== this.name) this.children.push(child);
  }

  /** @param {string?} name */
  copy(name = null) {
    return new Stage(
      [...this.parents],
      [...this._eventsToFinish],
      this._onStart,
      this._onFinish,
      [...this.children],
      name ?? this.name,
    );
  }

}

export class StageManager {

  stages;
  entry;

  /** @type {EventEmitter} */
  emitter;

  /**
   * @param {{name:Stage}} stages
   * @param {string} entry Starting stage node
   * @param {[string | [event: string, checker: function(object):boolean]]} eventsToReset
   */
  constructor(stages, entry = null, eventsToReset = []) {
    this.stages = Object.fromEntries(Object.entries(stages).map(([name, stage]) => [name, stage.copy(name)]));
    this.entry = this.stages[entry] && entry;
    Object.values(this.stages).forEach(stage => {
      stage.children.forEach(child => {
        this.stages[child].addParent(stage);
      });
    });
    Object.values(this.stages).forEach(stage => {
      stage.parents.forEach(parent => {
        this.stages[parent].addChild(stage);
      });
    });
    this._eventsToRestart = eventsToReset.map(item => (item instanceof Array ? item : [item, () => true]));
    this.reset();
  }

  reset() {
    Object.values(this.stages).forEach(stage => stage.reset());
    this.emitter = new EventEmitter();
    Object.values(this.stages).forEach(stage => stage.setEventSource(this.emitter));
    this.emitter.on("STAGE_FINISHED", stage =>
      this.stages[stage].children.forEach(child => this.stages[child]?.triggerStart(stage)),
    );
    this._eventsToRestart.forEach(([event, checker]) =>
      this.emitter.on(event, (...data) => checker(...data) && this.restart()),
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
    this.stages[entry].triggerStart();
  }

  restart() {
    this.reset();
    this.start();
  }

  emit(event, ...args) {
    this.emitter.emit(event, ...args);
  }

}
