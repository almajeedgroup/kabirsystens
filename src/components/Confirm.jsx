import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Modal from './Modal.jsx';

const ConfirmContext = createContext(() => Promise.resolve(false));

export function useConfirm() {
  return useContext(ConfirmContext);
}

// An on-brand replacement for window.confirm. Returns a Promise<boolean>.
// (Also works inside sandboxed frames, where window.confirm is blocked.)
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      resolver.current = resolve;
      setDialog({
        title: 'Please confirm',
        message: '',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        danger: false,
        ...opts,
      });
    });
  }, []);

  const close = (result) => {
    setDialog(null);
    resolver.current?.(result);
    resolver.current = null;
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <Modal title={dialog.title} onClose={() => close(false)}>
          <p style={{ marginTop: 0, fontSize: '0.92rem', lineHeight: 1.55 }}>{dialog.message}</p>
          <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn ghost" onClick={() => close(false)} autoFocus>
              {dialog.cancelLabel}
            </button>
            <button
              className={`btn${dialog.danger ? ' gold' : ''}`}
              onClick={() => close(true)}
            >
              {dialog.confirmLabel}
            </button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}
