const VND_FORMATTER = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
})

export const formatVnd = value_number => {
  if (value_number === null || value_number === undefined) {
    return VND_FORMATTER.format(0)
  }

  return VND_FORMATTER.format(Number(value_number) || 0)
}
