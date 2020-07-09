import { article, link } from './elements.js'
import crel from 'https://unpkg.com/crelt@1.x/index.es.js'

function rewriteInternalLink (e) {
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
}

class ShredsApp extends HTMLElement {
	connectedCallback () {
    this.addEventListener('click', rewriteInternalLink)
    this.process(this.textContent)
  }

  disconnectedCallback () {
    this.removeEventListener('click', rewriteInternalLink)
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

      JSON.parse(data).filter(this.filter)
        .sort((a, b) => this.order(a, b))
        .forEach(account => this.render(account))
    }

    this.classList.add('ready')
  }

  render (account) {
    if (this.state.statuses.has(account.status.id_str)) {
      return
    }

    var element = article(account)
    this.state.accounts.set(element, account)
    this.state.statuses.add(account.status.id_str)
    this.insertBefore(element, this.firstChild)
  }

  filter (account) {
    var status = account.status

    if (status == null) return false
    if (status.retweeted_status && !status.entities.user_mentions[0]) {
      return false // Invalid retweet
    }
    return true
  }

  order (a, b) {
    var one = this.date(a.status)
    var two = this.date(b.status)

    if (one > two) return 1
    else if (one < two) return -1
    else return 0
  }

  date (status) {
    return status ? new Date(status.created_at) : new Date(0)
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
