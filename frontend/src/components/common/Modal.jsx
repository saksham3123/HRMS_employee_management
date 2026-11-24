import { useEffect, useId, useRef } from "react";

// Pop-up panel for create/edit forms, built on the native <dialog>, which
// gives a focus trap, Escape to close and a backdrop for free.
//
//   <Modal open={showForm} title="Add department" onClose={() => setShowForm(false)}>
//     <DepartmentForm ... />
//   </Modal>
//
// While `busy` (a save in flight) Escape, the backdrop and × don't close it,
// so a request can't be abandoned half-way.
export default function Modal({
  open,
  title,
  description,
  onClose,
  busy = false,
  size = "md",
  children,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      // Start on the first field rather than the close button.
      dialog.querySelector("input, select, textarea")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Escape fires "cancel" on the dialog; route it through onClose.
  const handleCancel = (event) => {
    event.preventDefault();
    if (!busy) onClose();
  };

  // A click whose target is the <dialog> itself landed on the backdrop.
  const handleClick = (event) => {
    if (event.target === dialogRef.current && !busy) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className={`pd-modal is-${size}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={handleCancel}
      onClick={handleClick}
    >
      {open && (
        <div className="pd-modal-panel">
          <header className="pd-modal-head">
            <div>
              <h2 id={titleId}>{title}</h2>
              {description && <p id={descriptionId}>{description}</p>}
            </div>
            <button
              type="button"
              className="pd-modal-close"
              aria-label="Close"
              onClick={onClose}
              disabled={busy}
            >
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </header>
          <div className="pd-modal-body">{children}</div>
        </div>
      )}
    </dialog>
  );
}
