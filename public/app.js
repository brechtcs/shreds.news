import { feed, json, link, markdown } from './elements.js'
import crel from 'https://unpkg.com/crelt@1.x/index.es.js'
import morphdom from 'https://unpkg.com/morphdom@2.x/dist/morphdom-esm.js'

function rewriteInternalLink (e) {
  if (e.defaultPrevented) return

  var a = (function traverse (node) {
    if (!node || node === document) return
    if (node.localName !== 'a' || node.href === undefined) {
      return traverse(node.parentNode)
    }
    return node
  })(e.target)

  if (a.host === 'shreds.news') {
    a.protocol = location.protocol
    a.host = location.host
  }
}

customElements.define('shreds-app', class extends HTMLElement {
  static get observedAttributes () {
    return ['type']
  }

  attributeChangedCallback () {
    if (this.connected) this.render()
  }

	connectedCallback () {
    this.connected = true
    this.addEventListener('click', rewriteInternalLink)
    this.process(this.textContent)
    this.render()
  }

  disconnectedCallback () {
    this.removeEventListener('click', rewriteInternalLink)
  }

  morph (content) {
    morphdom(this, content, { childrenOnly: true })
  }

  process (data) {
    switch (this.type) {
      case 'feed':
        this.data = JSON.parse(data)
        this.data.sort((a, b) => this.order(a, b))
        break
      case 'markdown':
        this.data = data
        break
    }
  }

  render () {
    switch (this.type) {
      case 'feed':
        this.morph(feed(this.data))
        break
      case 'json':
        this.morph(json(this.data))
        break
      case 'markdown':
        this.morph(markdown(this.data))
        break
    }

    this.removeAttribute('hidden')
  }

  order (a, b) {
    var one = this.date(a.status)
    var two = this.date(b.status)

    if (one > two) return -1
    else if (one < two) return 1
    else return 0
  }

  date (status) {
    return status ? new Date(status.created_at) : new Date(0)
  }

  get type () {
    return this.getAttribute('type')
  }
}, { extends: 'main' })

customElements.define('shreds-header', class extends HTMLElement {
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
}, { extends: 'header' })
