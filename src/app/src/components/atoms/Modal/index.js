import { ModalComponent } from "./Modal";

class Modal {
  static ref = null;
  static component;

  static async open({ children }) {
    if(!this.ref) return;
    this.ref.updateState({
      children: children,
      show: true,
    });
  }

  static async accept(data) {
    if(!this.ref) return false;
    const promise = new Promise((resolve, reject) => {
      this.ref.updateState({
        ...data,
        show: true,
        proceed: resolve,
        cancel: reject
      });
    });
    return promise.then(
      () => true,
      () => false
    );
  }

  static async close() {
    this.ref?.cancel();
  }

  static Component = () => {
    if (!this.component) this.component = <ModalComponent ref={(ref) => (this.ref = ref)} />;
    return this.component;
  };
}

export { Modal };
