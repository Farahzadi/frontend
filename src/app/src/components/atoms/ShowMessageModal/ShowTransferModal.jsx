import React from "react";
import { Modal } from "react-bootstrap";
import "./ShowTransferModal.css"

const ShowTransferModal = (props) => {
  return (
    <Modal ClassName="modal-content-transefer"
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
      <Modal.Body >{props.children
        }
      </Modal.Body>
      {/* <Modal.Footer>
      <div className="d-grid w-100 text-center">
        <Button size="lg" variant="outline-secondary " onClick={props.onHide}>Close</Button>
        </div>
      </Modal.Footer> */}
    </Modal>
  );
};
// #5E35B1

export default ShowTransferModal;
