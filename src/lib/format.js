export function bytesToReadable(bytes) {
  const n = Number(bytes || 0)
  if (!n) return ''
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  if (i <= 1) return Math.round(v) + ' ' + units[i]
  return v.toFixed(2) + ' ' + units[i]
}

export function formatPublishedAt(publishedAt) {
  return (publishedAt || '').trim()
}

export function formatDateOnly(publishedAt) {
  return (publishedAt || '').trim().slice(0, 10)
}

export function parseJsonField(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'object') return value
  try {
    const parsed = JSON.parse(value)
    return parsed === null ? fallback : parsed
  } catch (e) {
    return fallback
  }
}
