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
      <div class="container">Have a ridgeleahills.org email? <a href="/register/" style="color:inherit;text-decoration:underline;">Sign up</a></div>
    </div>` : ''}
    <header>
      <div class="container">
        <div class="header-inner">
          <a href="/" class="site-name">ridgelea hills</a>
          <button class="nav-toggle" id="nav-toggle" aria-label="Menu">&#9776;</button>
          <nav id="main-nav">
            <div class="nav-dropdown" id="nav-local">
              <button class="nav-dropdown-trigger">local ▾</button>
              <div class="nav-dropdown-menu nav-dropdown-menu-left">
                <a href="/">news</a>
                <a href="/weather/">weather</a>
                <a href="/transit/">transit</a>
                <a href="/restaurants/">dining</a>
                <a href="/gas/">gas</a>
                <a href="/sky/">sky</a>
                <a href="/cameras/">cams</a>
              </div>
            </div>
            <div class="nav-dropdown" id="nav-neighborhood">
              <button class="nav-dropdown-trigger">neighborhood ▾</button>
              <div class="nav-dropdown-menu nav-dropdown-menu-left">
                <a href="/property/">property</a>
                <a href="/water/">water</a>
                <a href="/parks/">parks</a>
                <a href="/wildlife/">wildlife</a>
                <a href="/government/">govt</a>
                <a href="/about/">about</a>
              </div>
            </div>
            ${user
              ? `<div class="nav-dropdown" id="nav-community">
                   <button class="nav-dropdown-trigger">community ▾</button>
                   <div class="nav-dropdown-menu nav-dropdown-menu-left">
                     <a href="/community/">posts</a>
                     <a href="/post/">+ post</a>
                     <a href="/account/">my posts</a>
                     ${user.role === 'admin' || user.role === 'moderator' ? '<a href="/admin/">admin</a>' : ''}
                   </div>
                 </div>
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

  const dropdowns = el.querySelectorAll('.nav-dropdown')
  dropdowns.forEach(dd => {
    dd.querySelector('.nav-dropdown-trigger')?.addEventListener('click', (e) => {
      e.stopPropagation()
      const isOpen = dd.classList.contains('open')
      dropdowns.forEach(d => d.classList.remove('open'))
      if (!isOpen) dd.classList.add('open')
    })
  })
  document.addEventListener('click', () => dropdowns.forEach(d => d.classList.remove('open')))

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
