export default function Input({ label, id, error, ...props }) {
  return (
    <div>
      {label && <div className="label" style={{ marginBottom: 6 }}>{label}</div>}
      <input id={id} className="field-input" {...props} />
      {error && <div className="error" style={{ marginTop: 6 }}>{error}</div>}
    </div>
  )
}
