import Emitter from "tiny-emitter";

class Stage {

  /** @type {string} */
  name = "";

  /** @type {[string]} */
  parents = [];

  /** @enum {string} status "INITIAL" | "RUNNING" | "FINISHED" */
  status = "INITIAL";

  /** @type {[string]} */
  children = [];

  _onStart = () => {};
  _onFinish = () => {};

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
   * @param {string} name
   * @param {[string]} parents
   * @param {[[event: string, checker: function(object):boolean]]} eventsToFinish
   * @param {function} onStart
   * @param {function} onFinish
   * @param {[string]} children
   */
  constructor(name, parents = [], eventsToFinish = [], onStart = () => {}, onFinish = () => {}, children = []) {
    this.name = name;
    this.parents = parents || [];
    this.children = children || [];
    console.log(typeof []);
    this._onFinish = onStart || (() => {});
    this._onFinish = onFinish || (() => {});
    this._eventsToFinish = eventsToFinish;
    this.reset();
  }

  reset() {
    this.status = "INITIAL";
    this._startPromiseReject?.();
    this._finishPromiseReject?.();
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

  triggerStart(parent) {
    if (parent && this.parents.includes(parent)) this.finishedParents.add(parent);
    if (this.status === "INITIAL" && this.finishedParents.size() === this.parents.length) this._start();
  }

  // triggerFinish(eventName, data = undefined) {
  //   if (this.status === "RUNNING" && this._eventsToFinish?.[eventName]?.(data)) this._finish();
  // }

  _addFinishEventHandlers() {
    this._finishEventHandlers = this._eventsToFinish.map(([event, checker]) => [
      event,
      data => {
        if (this.status === "RUNNING" && checker(data)) this._finish();
      },
    ]);
    this._finishEventHandlers.forEach(([event, handler]) => this.eventSource?.on(event, handler));
  }

  _removeFinishEventHandlers() {
    this._finishEventHandlers.forEach(([event, handler]) => this.eventSource?.off(event, handler));
  }

  _start() {
    this._addFinishEventHandlers();
    this.status = "RUNNING";
    this._startPromiseResolve();
    this._onStart?.();
  }

  _finish() {
    this._removeFinishEventHandlers();
    this.status = "FINISHED";
    this._finishPromiseResolve();
    this._onFinish?.();
    this.eventSource?.emit("STAGE_FINISHED", this.name);
  }

  setEventSource(eventSource) {
    this.eventSource = eventSource;
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

}

class StageManager {

  stages;
  emitter;

  /**
   * @param {[Stage]} stages
   */
  constructor(stages) {
    this.stages = {};
    stages.forEach(stage => (this.stages[stage.name] = stage));
    stages.forEach(stage => {
      stage.children.forEach(child => {
        this.stages[child].addParent(stage);
      });
    });
    stages.forEach(stage => {
      stage.parents.forEach(parent => {
        this.stages[parent].addChild(parent);
      });
    });
    this.reset();
  }

  reset() {
    Object.values(this.stages).forEach(stage => stage._reset());
    this.emitter = new Emitter();
    Object.values(this.stages).forEach(stage => stage.setEventSource(this.emitter));
    this.emitter.on("STAGE_FINISHED", stage => this.stages[stage].triggerStart(stage));
  }

  emit(event, ...args) {
    this.emitter.emit(event, ...args);
  }

}
