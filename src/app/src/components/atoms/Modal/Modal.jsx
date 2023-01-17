import React from "react";
import ReactDOM from "react-dom";
import { CSSTransition } from "react-transition-group";
import { Button } from "../Button";
import "./Modal.css";

export class ModalComponent extends React.Component {

  initialState = {
    show: false,
    title: undefined,
    children: undefined,
    alert: undefined,
    cancelText: "Cancel",
    proceed: undefined,
    proceedText: "OK",
    cancel: undefined,
  };

  constructor() {
    super();
    this.state = { ...this.initialState };
  }

  resetState = () => {
    this.setState({ ...this.initialState });
  };

  onEscapeKeyDown = e => {
    if ((e.charCode || e.keyCode) === 27) this.cancel();
  };

  componentDidMount() {
    document.body.addEventListener("keydown", this.onEscapeKeyDown);
  }

  componentWillUnmount() {
    document.body.removeEventListener("keydown", this.onEscapeKeyDown);
  }

  updateState = data => {
    this.setState({ ...this.initialState, ...data });
  };

  proceed = () => {
    const { proceed } = this.state;
    this.resetState();
    proceed?.();
  };

  cancel = () => {
    const { cancel } = this.state;
    this.resetState();
    cancel?.();
  };

  render() {
    if (!this.state) return <></>;

    const { show, title, children, alert, cancelText, proceed, proceedText, cancel } = this.state;

    return ReactDOM.createPortal(
      <CSSTransition in={show} unmountOnExit timeout={{ enter: 0, exit: 300 }}>
        <div className="dex_modal" onClick={this.cancel}>
          <div className="dex_modal_content" onClick={e => e.stopPropagation()}>
            {title && (
              <div className="dex_modal_header">
                <h4 className="dex_modal_title">{title}</h4>
              </div>
            )}
            {}
            <div className="dex_modal_body">
              {alert && <p className="dex_alert">{alert}</p>}
              {children}
            </div>
            {proceed && (
              <div className="dex_modal_action_footer">
                <Button className={"btn_danger normal_btn"} text={cancelText} onClick={this.cancel}></Button>
                <Button className={"btn_success normal_btn"} text={proceedText} onClick={this.proceed}></Button>
              </div>
            )}
          </div>
        </div>
      </CSSTransition>,
      document.getElementById("root"),
    );
  }

}
