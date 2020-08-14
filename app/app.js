import { Masonry } from './masonry.js'
import { article, link, refresh, back } from './elements.js'
import crel from 'https://unpkg.com/crelt@1.x/index.es.js'

function navigate (e, url) {
  if (url.hash === '#feed')
    feed.refresh()
  else if (url.search)
    detail.load(url)
  else return

  e.preventDefault()
}

window.addEventListener('popstate', e => {
  navigate(e, e.target.location)
})

window.addEventListener('click', e => {
  if (e.defaultPrevented) return

  var mod = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey
  var a = (function traverse (node) {
    if (!node || node === document) return
    if (node.localName !== 'a' || node.href === undefined) {
      return traverse(node.parentNode)
    }
    return node
  })(e.target)

  if (a == null) {
    return
  }

  if (a.host === 'twitter.com' && !mod) {
    var parts = a.pathname.split('/')
    
    if (parts[2] === 'status' && parts[3]) {
      var target = new URL('?data=thread&id=' + parts[3], location)
      history.pushState(null, null, target)
      return navigate(e, target)
    }
  } else if (a.origin === location.origin && !mod) {
    return navigate(e, a)
  }

  if (a.host === 'shreds.news') {
    a.protocol = location.protocol
    a.host = location.host
  }
})

class ShredsDetail extends HTMLElement {
  connectedCallback () {
    this.render(this.textContent)
  }

  scrollIntoView () {
    window.feed.scrollIntoView()
  }

  async load (url) {
    var endpoint = new URL(url)
    endpoint.searchParams.set('format', 'json')

    var res = await fetch(endpoint)
    var data = await res.text()

    this.render(data, endpoint.searchParams.get('data'))
    this.scrollIntoView()
  }

  render (data, type) {
    if (type)
      this.type = type

    switch (this.type) {
      case 'thread':
        this.data = JSON.parse(data)
        this.innerText = ''

        this.data.forEach(status => {
          var user = Object.assign({ status }, status.user)
          this.append(article(user))
        })
        break
      case 'user':
        this.data = JSON.parse(data)
        this.innerText = ''
        this.append(article(this.data))
        break
    }

    this.append(back(this.handle))
    this.classList.add('ready')
  }

  get bounding () {
    return this.getBoundingClientRect()
  }

  get handle () {
    var last = this.data[this.data.length - 1]
    return last ? last.user.screen_name : null
  }

  get type () {
    return this.dataset.type
  }

  set type (type) {
    this.dataset.type = type
  }
}

class ShredsFeed extends HTMLElement {
  connectedCallback () {
    this.accounts = new WeakMap()
    this.statuses = new Set()
    this.masonry = Masonry.init(this)
    this.process(this.textContent)
  }

  scrollIntoView() {
    if (this.bounding.top < 0)
      this.firstChild.scrollIntoView()
  }

  get (element) {
    return this.accounts.get(element)
  }

  process (data) {
    if (data) {
      this.innerText = ''

      JSON.parse(data).forEach(acc => this.insert(acc))
      this.append(refresh('#feed'))
    }

    this.classList.add('ready')
  }

  async refresh () {
    var endpoint = new URL(location)
    endpoint.searchParams.set('format', 'json')
    endpoint.searchParams.set('data', 'feed')

    var res = await fetch(endpoint)
    var data = await res.json()
    data.forEach(tweeter => this.insert(tweeter))

    this.masonry.reposition()
    this.scrollIntoView()
  }

  insert (account) {
    if (this.drop(account.status)) return
    if (account.screen_name in window) {
      window[account.screen_name].remove()
    }

    var append = true
    var element = article(account, account.screen_name)
    var date = new Date(account.status.created_at)
    this.accounts.set(element, account)
    this.statuses.add(account.status.id_str)

    for (var sibling of this.children) {
      var ts = sibling.getAttribute('data-created')

      if (date > new Date(ts)) {
        this.insertBefore(element, sibling)
        append = false
        break
      }
    }

    if (append) this.append(element)
    element.classList.add('fade')
  }

  drop (status) {
    return status == null
      || this.statuses.has(status.id_str) // already rendered
      || status.retweeted_status && !status.entities.user_mentions[0] // Invalid retweet
  }

  get bounding () {
    return this.getBoundingClientRect()
  }
}

class ShredsHeader extends HTMLElement {
  connectedCallback () {
    var nav = crel('nav')

    switch (this.route) {
      case '/':
        nav.append(link('/login', 'Sign In'))
        break
      case '/home':
        nav.append(link('/logout', 'Sign Out'))
        break
    }

    this.append(nav)
  }

  get route () {
    return location.pathname
  }
}

customElements.define('shreds-detail', ShredsDetail, { extends: 'section' })
customElements.define('shreds-feed', ShredsFeed, { extends: 'section' })
customElements.define('shreds-header', ShredsHeader, { extends: 'header' })
