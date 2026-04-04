const BASE = import.meta.env.VITE_API_URL

function getToken() {
  return localStorage.getItem('token')
}

async function req(method, path, body) {
  const token = getToken()
  const headers = {}
  if (body != null) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error ?? 'Request failed'), { status: res.status })
  return data
}

export const api = {
  get:    (path)        => req('GET', path),
  post:   (path, body)  => req('POST', path, body),
  patch:  (path, body)  => req('PATCH', path, body),
  delete: (path)        => req('DELETE', path),
}

export async function uploadImage(file) {
  const { url, key } = await api.post('/api/upload/presign', { contentType: file.type })
  await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
  return key
}

export const imgUrl = (key) => `${import.meta.env.VITE_IMAGES_BASE_URL}/${key}`
