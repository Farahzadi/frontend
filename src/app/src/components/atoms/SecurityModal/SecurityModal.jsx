import React from "react";
import { Modal,Button } from "react-bootstrap";
import "./SecurityModal.css"

const SecurityModal = (props) => {
  return (
    <Modal
      {...props}
      size="md"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      backdropClassName="modal-content-transefer"
    >
      {/* <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Modal heading
        </Modal.Title>
      </Modal.Header> */}
      <Modal.Body className="security-modal" >
        <h5 className="text-center">Do you agree with all the changes?</h5>
      </Modal.Body>
      <Modal.Footer>
      <div className="d-flex w-100 text-center justify-content-around">
        <Button size="lg" variant="outline-success " onClick={()=>{props.onHide();props.acceptNonce()} }>Yes</Button>
        <Button size="lg" variant="outline-danger " onClick={props.onHide}>No</Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
// #5E35B1

export default SecurityModal;
