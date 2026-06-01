export default function Modal({ title, children, onClose, actions }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close modal">×</button>
        <h3>{title}</h3>
        {children}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  )
}
