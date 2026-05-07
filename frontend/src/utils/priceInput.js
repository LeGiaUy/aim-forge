const digit_only_regex = /\D+/g

export const normalize_price_input = raw_value =>
  String(raw_value ?? '').replace(digit_only_regex, '')

export const format_price_display = raw_value => {
  const normalized = normalize_price_input(raw_value)
  if (!normalized) return ''
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
