import { DateTime } from 'https://moment.github.io/luxon/es6/luxon.js'
import JSONFormatter from 'https://unpkg.com/json-formatter-js@2.x/dist/json-formatter.esm.js'
import crel from 'https://unpkg.com/crelt@1.x/index.es.js'

export function json (data) {
  var formatter = new JSONFormatter(data)
  return crel('main', formatter.render())
}

export function feed (data) {
  var items = data.filter(choose).map(display)
  return crel('main', items)
}

function choose (user) {
  if (user.status == null) return false
  if (user.status.retweeted_status && !user.status.entities.user_mentions[0]) {
    return false // Invalid retweet
  }
  return true
}

function display (user) {
  var id = user.screen_name
  var classes = localStorage.getItem(id)
  var style = colors(user)

  return crel('article', { id, style, class: classes },
    crel('header',
      thumb(user),
      crel('address', user.name),
      stamp(user.status.created_at)
    ),
    content(user.status),
    crel('ul', conversation(user), spotlight(user))
  )
}

function thumb (user) {
  var href = `https://twitter.com/${user.screen_name}/with_replies`

  return crel('a', { href, class: 'thumb' },
    crel('img', { src: user.profile_image_url_https })
  )
}

function content (status) {
  if (status.retweeted_status ) {
    var rt = status.retweeted_status
    var author = status.entities.user_mentions[0]
    var href = `https://twitter.com/${author.screen_name}/status/${rt.id_str}`
    var content = crel('span', { class: 'retweet' }, rt.full_text)
    var link = author ? crel('a', { href, class: 'author' }, author.name) : null
    return crel('section', link, content)
  } else {
    return crel('section', status.full_text)
  }
}

function colors (user) {
  var style = ''
  style += `--border-color:#${user.profile_link_color};`
  return style
}

function spotlight (user) {
  var href = `#${user.screen_name}`
  var button = crel('a', { href }, 'Toggle spotlight')
  var item = crel('li', button)

  button.addEventListener('click', event => {
    var article = window[user.screen_name]
    article.classList.toggle('spotlight')
    localStorage.setItem(user.screen_name, article.className)
    event.preventDefault()
  })

  return item
}

function conversation (user) {
  var href = `https://twitter.com/${user.screen_name}/status/${user.status.id_str}`
  var link = crel('a', { href }, 'Open conversation')
  return crel('li', link)
}

function hashtags (status) {
  return status.entities.hashtags.length <= 3
}

function retweet (status) {
  if (status.retweeted_status) {
    var rt = status.retweeted_status
    rt.via = status.user
    return rt
  }
  return status
}

function stamp (str) {
  var date = DateTime.fromJSDate(new Date(str))
  var el = crel('time', date.setLocale('en').toRelative())

  setInterval(() => {
    el.innerText = date.setLocale('en').toRelative()
  }, 60000)

  return el
}
