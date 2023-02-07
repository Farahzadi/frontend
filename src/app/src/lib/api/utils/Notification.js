import { notificationsSelector } from "lib/store/features/api/apiSlice";
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
    const notifToast = toast[method](msg);
    console.log("notifToast", notifToast);
    Core.run("emit", "notifications", "add", id, method, msg, notifToast);
    return id;
  }

  static remove(id) {
    const notif = this._getNotifications().find(item => item.id === id);
    console.log("notif", id, notif);
    if (notif) {
      if (notif.toast)
        toast.dismiss(notif.toast);
    }
    Core.run("emit", "notifications", "remove", id);
  }

  static clear() {
    Core.run("emit", "notifications", "clear");
  }

  static _random() {
    return new Date().getTime().toString(36) + Math.random().toString(36).slice(2);
  }

  static _getNotifications() {
    const state = Core.getInstance().store.getState();
    console.log("state", state);
    return notificationsSelector(state);
  }

}

export const Notify = NotificationSystem;
