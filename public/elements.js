import { DateTime } from 'https://moment.github.io/luxon/es6/luxon.js'
import JSONFormatter from 'https://unpkg.com/json-formatter-js@2.x/dist/json-formatter.esm.js'
import crel from 'https://unpkg.com/crelt@1.x/index.es.js'

export function json (data) {
  var formatter = new JSONFormatter(data)
  return crel('main', formatter.render())
}

export function feed (data) {
  var items = data.filter(choose).map(article)
  return crel('main', items)
}

export function link (href, text) {
  return crel('a', { href },
    crel('span', { class: 'text' }, text == null ? href : text)
  )
}

function choose (user) {
  if (user.status == null) return false
  if (user.status.retweeted_status && !user.status.entities.user_mentions[0]) {
    return false // Invalid retweet
  }
  return true
}

function article (user) {
  var id = user.screen_name
  var classes = localStorage.getItem(id) || ''
  var style = `--border-color:#${user.profile_link_color};`
  var t = user.status.retweeted_status || user.status

  return crel('article', { id, style, class: classes },
    header(user, classes.includes('spotlight')),
    address(user.status, user),
    content(t, user)
  )
}

function header (user, spotlight) {
  var avatar = thumb(user, spotlight)
  var info = crel('span',
    crel('address', user.name),
    stamp(user.status.created_at)
  )

  avatar.addEventListener('click', event => {
    var article = window[user.screen_name]
    article.classList.toggle('spotlight')
    localStorage.setItem(user.screen_name, article.className)
    event.preventDefault()
  })

  return crel('header', avatar, info)
}

function thumb (user, spotlight) {
  var href = new URL('#' + user.screen_name, location)

  return crel('a', { href, class: 'thumb' },
    crel('img', { src: user.profile_image_url_https }),
    icon('brightness-up', { class: 'hover on' }),
    icon('brightness-down', { class: 'hover off' })
  )
}

function address (status, user) {
  var rt = !!status.retweeted_status
  var mentions = status.entities.user_mentions

  if (!rt && mentions.length === 0) {
    return null
  }

  var names = status.in_reply_to_status_id
    ? mentions.map(m => m.name).join(', ')
    : mentions[0].name

  return crel('aside',
    icon(rt ? 'retweet' : names ? 'reply' : 'thread'),
    crel('address', names || referral(status, user, 'Click to read thread')),
    rt ? stamp(status.retweeted_status.created_at) : null
  )
}

function content (status, user) {
  var tweet = referral(status, user, '')
  tweet.classList.add('content')

  var cursor = status.display_text_range[0]
  var end = status.display_text_range[1]

  status.entities.urls.forEach(url => {
    tweet.append(status.full_text.substring(cursor, url.indices[0]))
    tweet.append(crel('a', { href: url.expanded_url }, url.display_url))
    cursor = url.indices[1]
  })

  if (cursor < end) {
    tweet.append(text(status.full_text.substring(cursor, end)))
  }

  tweet.append(nav(status, user))
  return tweet
}

function nav (status, user) {
  var el = crel('nav')
  var sep = ''

  if (status.entities.media != null) {
    addItem(referral(status, user, 'View Media'))
  }
  if (status.in_reply_to_status_id == null) {
    addItem(referral(status, user, 'View Thread'))
  }

  function addItem (item) {
    el.append(text(sep))
    el.append(item)
    sep = ' · '
  }

  return el
}

function referral (status, user, text) {
  return link(`https://twitter.com/${user.screen_name}/status/${status.id_str}`, text)
}

function stamp (str) {
  var date = DateTime.fromJSDate(new Date(str))
  var el = crel('time', date.setLocale('en').toRelative())

  setInterval(() => {
    el.innerText = date.setLocale('en').toRelative()
  }, 60000)

  return el
}

function icon (name, attrs) {
  var el = crel('span', attrs)
  el.innerHTML = `<svg viewBox="0 0 512 512">
    <use xlink:href="/sprite.svg#${name}">
  </svg>`

  return el
}

function text (str) {
  return document.createTextNode(str)
}
