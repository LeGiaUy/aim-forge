export default function Button({
  type = 'button',
  loading = false,
  disabled = false,
  children,
  class_name = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-display font-semibold uppercase tracking-wider transition ${
        disabled || loading
          ? 'cursor-not-allowed border border-white/10 bg-white/5 text-[#64748b]'
          : 'cursor-pointer bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white shadow-[0_0_22px_rgba(124,58,237,0.4)] hover:brightness-110'
      } ${class_name}`}
      {...props}
    >
      {loading ? 'Processing...' : children}
    </button>
  )
}
