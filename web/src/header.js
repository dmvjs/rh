import { api } from './api.js'

let _user = undefined

export async function getUser() {
  if (_user !== undefined) return _user
  if (!localStorage.getItem('token')) {
    _user = null
    return _user
  }
  try {
    const u = await api.get('/api/auth/me')
    _user = u?.id ? u : null
  } catch {
    _user = null
  }
  return _user
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) window.location.href = `/login/?next=${encodeURIComponent(location.pathname + location.search)}`
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user && !user.role === 'admin' || user.role === 'moderator') window.location.href = '/'
  return user
}

export async function renderHeader(el) {
  const user = await getUser()

  el.innerHTML = `
    ${!user ? `<div class="beta-bar">
      <div class="container">Have a ridgeleahills.org email? <a href="/register/" style="color:inherit;text-decoration:underline;">Sign up</a> — members get no ads.</div>
    </div>` : ''}
    <header>
      <div class="container">
        <div class="header-inner">
          <a href="/" class="site-name">ridgelea hills</a>
          <button class="nav-toggle" id="nav-toggle" aria-label="Menu">&#9776;</button>
          <nav id="main-nav">
            <a href="/">news</a>
            <a href="/weather/">weather</a>
            <a href="/transit/">transit</a>
            <a href="/restaurants/">dining</a>
            <a href="/government/">govt</a>
            <a href="/cameras/">cams</a>
            <a href="/property/">homes</a>
            <a href="/water/">water</a>
            <a href="/parks/">parks</a>
            <a href="/wildlife/">wildlife</a>


            ${user
              ? `<a href="/community/">posts</a>
<a href="/post/">+ post</a>
                 <a href="/account/">my posts</a>
                 ${user.role === 'admin' || user.role === 'moderator' ? '<a href="/admin/">admin</a>' : ''}
                 <a href="#" id="nav-logout">sign out</a>`
              : `<a href="/login/">sign in</a>
                 <a href="/register/" class="btn btn-sm">join</a>`
            }
          </nav>
        </div>
      </div>
    </header>
  `

  el.querySelector('#nav-logout')?.addEventListener('click', (e) => {
    e.preventDefault()
    localStorage.removeItem('token')
    _user = null
    window.location.href = '/'
  })

  el.querySelector('#nav-toggle')?.addEventListener('click', () => {
    el.querySelector('#main-nav').classList.toggle('nav-open')
  })

  return user
}

export function renderFooter(el) {
  el.innerHTML = `
    <footer>
      <div class="container">
        <div class="official-link">
          Official neighborhood association: <a href="https://www.ridgeleahills.org/" target="_blank" rel="noopener">ridgeleahills.org</a>
        </div>
      </div>
    </footer>
  `
}
