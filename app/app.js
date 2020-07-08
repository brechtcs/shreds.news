import { article, link } from './elements.js'
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

  if (a && a.host === 'shreds.news') {
    a.protocol = location.protocol
    a.host = location.host
  }
}

class ShredsApp extends HTMLElement {
  static define () {
    customElements.define('shreds-app', ShredsApp, { extends: 'main' })
  }

	connectedCallback () {
    this.addEventListener('click', rewriteInternalLink)
    this.render(this.textContent)
  }

  disconnectedCallback () {
    this.removeEventListener('click', rewriteInternalLink)
  }

  morph (content) {
    morphdom(this, crel('main', content), { childrenOnly: true })
  }

  process (data) {
    if (this.contentType === 'application/json') {
      this.data = JSON.parse(data).filter(this.filter)
      this.data.sort((a, b) => this.order(a, b))
    }
  }

  render (data, type) {
    if (data) this.process(data)
    if (type) this.contentType = type

    if (this.contentType === 'application/json') {
      this.classList.add('feed')
      this.morph(this.data.map(ShredsTweet.create))
    }

    this.classList.add('ready')
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

    if (one > two) return -1
    else if (one < two) return 1
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
  static define () {
    customElements.define('shreds-header', ShredsHeader, { extends: 'header' })
  }

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

class ShredsTweet extends HTMLElement {
  static define () {
    customElements.define('shreds-tweet', ShredsTweet, { extends: 'main' })
  }

  static create (account) {
    var id = account.screen_name
    var classes = localStorage.getItem(id) || ''
    var style = `--theme-color:#${account.profile_link_color};`

    var tweet = document.createElement('article', { is: 'shreds-tweet' })
    tweet.setAttribute('id', id)
    tweet.setAttribute('class', classes)
    tweet.setAttribute('style', style)
    tweet.data = account
    return tweet
  }

  connectedCallback () {
    this.render()
  }

  morph (content) {
    morphdom(this, content, { childrenOnly: true })
  }

  render (data) {
    if (data) this.data = data
    this.morph(article(this.data))
  }
}

ShredsHeader.define()
ShredsApp.define()
ShredsTweet.define()
