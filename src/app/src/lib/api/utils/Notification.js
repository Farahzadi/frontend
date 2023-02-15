import { notificationsSelector } from "lib/store/features/api/apiSlice";
import Core from "../Core";

const { toast } = require("react-toastify");

/**
 * @typedef {{
 *  save?: boolean,
 *  quiet?: boolean,
 *  theme?: string,
 *  closeOnToastClose?: boolean,
 *  hideOnFinish?: boolean
 * }} NotifyOptions
 *
 * save: shoud it be saved and shown in the list of notifications or it is only a toast popup (default: false)
 *
 * quiet: should it be quiet and not show a toast popup (default: false)
 *
 * theme: toast theme (default: undefined, should be either "light", "dark" or "colored")
 *
 * closeOnToastClose: should the notification object on the list be closed when its corresponding toast closes
 * (default: true for loadings otherwise false)
 *
 * hideOnFinish: should notification message be hidden on the list when loading toast finished loading (default: true)
 *
 **/

class NotificationSystem {

  static info(msg, options) {
    return this.add("info", msg, options);
  }

  static warning(msg, options) {
    return this.add("warning", msg, options);
  }

  static warn(...args) {
    return this.warning(...args);
  }

  static error(msg, options) {
    return this.add("error", msg, options);
  }

  static success(msg, options) {
    return this.add("success", msg, options);
  }

  static loading(msg, options) {
    return this.add("loading", msg, options);
  }

  /**
   * @param {string} method
   * @param {string} msg
   * @param {NotifyOptions?} options
   */
  static add(method, msg, options) {
    options = this._parseOptions(method, options);
    const id = this._random();
    const notifToast = options.quiet
      ? null
      : toast[method](msg, {
        pauseOnFocusLoss: false,
        theme: options.theme,
        onClose: () => {
          if (!options.save || options.closeOnToastClose) this.remove(id);
        },
      });
    Core.run("emit", "notifications", "add", {
      id,
      type: method,
      message: msg,
      toast: notifToast,
      show: Boolean(options.save),
      options,
    });
    return id;
  }

  static remove(id) {
    const notif = this._getNotification(id);
    if (notif?.toast) toast.dismiss(notif.toast);
    Core.run("emit", "notifications", "remove", { id });
  }

  static finish(id, method, msg) {
    const notif = this._getNotification(id);
    if (!notif?.toast) return;
    toast.update(notif.toast, {
      type: method,
      isLoading: false,
      theme: "colored",
      autoClose: true,
      pauseOnFocusLoss: false,
      render: msg,
    });
    if (notif.options.hideOnFinish) Core.run("emit", "notifications", "update", { id, show: false });
  }

  static clear() {
    Core.run("emit", "notifications", "clear");
  }

  static _random() {
    return new Date().getTime().toString(36) + Math.random().toString(36).slice(2);
  }

  static _getNotification(id) {
    return this._getNotifications().find(item => item.id === id) ?? null;
  }

  static _getNotifications() {
    const state = Core.getInstance().store.getState();
    return notificationsSelector(state);
  }

  /** @param {NotifyOptions} options */
  /** @returns {NotifyOptions} */
  static _parseOptions(method, options) {
    return {
      save: options?.save ?? false,
      quiet: options?.quiet ?? false,
      theme: options?.theme ?? undefined,
      closeOnToastClose: options?.closeOnToastClose ?? method === "loading",
      hideOnFinish: options?.hideOnFinish ?? true,
    };
  }

}

export const Notify = NotificationSystem;
