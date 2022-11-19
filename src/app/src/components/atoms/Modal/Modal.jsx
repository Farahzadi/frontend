import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CSSTransition } from 'react-transition-group';
import { Button } from '../Button';
import './Modal.css';

export const Modal = ({
  show,
  title,
  alert,
  closeText = 'Cancel',
  actionText,
  children,
  onClose,
  onSubmit,
}) => {
  const closeOnEscapeKeyDown = (e) => {
    if ((e.charCode || e.keyCode) === 27) {
      onClose();
    }
  };

  useEffect(() => {
    document.body.addEventListener('keydown', closeOnEscapeKeyDown);
    return function cleanup() {
      document.body.removeEventListener('keydown', closeOnEscapeKeyDown);
    };
  }, []);

  return ReactDOM.createPortal(
    <CSSTransition in={show} unmountOnExit timeout={{ enter: 0, exit: 300 }}>
      <div className='dex_modal' onClick={onClose}>
        <div className='dex_modal_content' onClick={(e) => e.stopPropagation()}>
         {title && <div className='dex_modal_header'>
            <h4 className='dex_modal_title'>{title}</h4>
          </div>}
          {}
          <div className='dex_modal_body'>
            { alert && <p className='dex_alert'>{alert}</p>}
            {children}
          </div>
          {onSubmit && (
            <div className='dex_modal_action_footer'>
              <Button className={'btn_danger normal_btn'} text={closeText} onClick={onClose}></Button>
              <Button className={'btn_success normal_btn'} text={actionText} onClick={onSubmit}></Button>
            </div>
          )}
        </div>
      </div>
    </CSSTransition>,
    document.getElementById('root')
  );
};
