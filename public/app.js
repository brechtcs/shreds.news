import { feed, json } from './elements.js'
import crel from 'https://unpkg.com/crelt@1.x/index.es.js'
import morphdom from 'https://unpkg.com/morphdom@2.x/dist/morphdom-esm.js'

customElements.define('shreds-app', class extends HTMLElement {
  static get observedAttributes () {
    return ['type']
  }

  attributeChangedCallback () {
    if (this.connected) this.render()
  }

	connectedCallback () {
    this.connected = true
    this.process(this.textContent)
    this.render()
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
