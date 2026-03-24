export default function Button({ children, variant = 'neon', className = '', ...props }) {
  const variants = {
    neon: 'neon-btn',
    ghost: 'ghost-btn',
  }
  const cls = `${variants[variant] ?? variants.neon}${className ? ' ' + className : ''}`
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  )
}
