/**
 * Tích Descartes: mỗi phần tử output là một mảng giá trị theo thứ tự trục.
 * @param {string[][]} option_values — mảng các trục, mỗi trục danh sách chuỗi
 * @returns {string[][]}
 */
export function generateVariants(option_values) {
  if (!option_values.length) return []
  if (option_values.some(ax => !ax?.length)) return []

  return option_values.reduce((acc, axis) => {
    const list = axis.map(String)
    if (!acc.length) return list.map(v => [v])
    const next = []
    for (const row of acc) {
      for (const v of list) {
        next.push([...row, v])
      }
    }
    return next
  }, [])
}
