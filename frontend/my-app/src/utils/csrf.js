export function getCsrfToken() {
  const cookies = document.cookie.split(';')
  for (let cookie of cookies) {
    const trimmed = cookie.trim()
    if (trimmed.startsWith('csrftoken=')) {
      return trimmed.substring('csrftoken='.length)
    }
  }
  return ''
}