import Core from "../Core";

const { toast } = require("react-toastify");

class NotificationSystem {

  static info(msg) {
    return this.add("info", msg);
  }

  static warning(msg) {
    return this.add("warning", msg);
  }

  static warn(...args) {
    return this.warning(...args);
  }

  static error(msg) {
    return this.add("error", msg);
  }

  static success(msg) {
    return this.add("success", msg);
  }

  static add(method, msg) {
    const id = this._random();
    Core.run("emit", "notifications", "add", id, method, msg);
    toast[method](msg);
  }

  static remove(id) {
    Core.run("emit", "notifications", "remove", id);
  }

  static _random() {
    return new Date().getTime().toString(36) + Math.random().toString(36).slice(2);
  }

}

export const Notify = NotificationSystem;
