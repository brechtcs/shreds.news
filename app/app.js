import { Masonry } from './masonry.js'
import { article, link } from './elements.js'
import crel from 'https://unpkg.com/crelt@1.x/index.es.js'

document.addEventListener('click', e => {
  if (e.defaultPrevented) return

  var a = (function traverse (node) {
    if (!node || node === document) return
    if (node.localName !== 'a' || node.href === undefined) {
      return traverse(node.parentNode)
    }
    return node
  })(e.target)

  if (a && a.host === 'shreds.news') {
    a.protocol = location.protocol
    a.host = location.host
  }
})

class ShredsApp extends HTMLElement {
  connectedCallback () {
    this.masonry = Masonry.init(this)
    this.process(this.textContent)
  }

  get (element) {
    return this.state.accounts.get(element)
  }

  process (data) {
    if (this.contentType === 'application/json') {
      this.innerText = ''
      this.classList.add('feed')

      this.state = {
        accounts: new WeakMap(),
        statuses: new Set()
      }

      JSON.parse(data).forEach(acc => this.insert(acc))
    }

    this.classList.add('ready')
  }

  insert (account) {
    if (this.drop(account.status)) return

    var element = article(account)
    var date = new Date(account.status.created_at)
    this.state.accounts.set(element, account)
    this.state.statuses.add(account.status.id_str)

    for (var sibling of this.children) {
      var ts = sibling.getAttribute('data-created')

      if (date > new Date(ts)) {
        return this.insertBefore(element, sibling)
      }
    }

    this.append(element)
  }

  drop (status) {
    return status == null
      || this.state.statuses.has(status.id_str) // already rendered
      || status.retweeted_status && !status.entities.user_mentions[0] // Invalid retweet
  }

  get contentType () {
    return this.getAttribute('content-type')
  }

  set contentType (type) {
    return this.setAttribute('content-type', type)
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

customElements.define('shreds-app', ShredsApp, { extends: 'main' })
customElements.define('shreds-header', ShredsHeader, { extends: 'header' })
