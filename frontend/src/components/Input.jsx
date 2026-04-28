export default function Input({
  label_text,
  error_text,
  class_name = '',
  ...props
}) {
  return (
    <label className='block'>
      <span className='mb-2 block text-xs font-display uppercase tracking-wider text-[#cbd5e1]'>
        {label_text}
      </span>
      <input
        {...props}
        className={`w-full rounded-xl border bg-[#0b0b16] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#475569] focus:border-[#9f67ff] focus:ring-2 focus:ring-[#7c3aed]/30 ${
          error_text ? 'border-red-400/50' : 'border-white/15'
        } ${class_name}`}
      />
      {error_text && (
        <span className='mt-1 block text-xs text-red-300'>{error_text}</span>
      )}
    </label>
  )
}
