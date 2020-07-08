import { DateTime } from 'https://moment.github.io/luxon/es6/luxon.js'
import crel from 'https://unpkg.com/crelt@1.x/index.es.js'

export function link (href, text) {
  return crel('a', { href },
    crel('span', { class: 'text' }, text == null ? href : text)
  )
}

export function article (user) {
  var t = user.status.retweeted_status || user.status

  return crel('article',
    header(user),
    address(user.status, user),
    content(t, user),
    nav(t, user)
  )
}

function header (user, spotlight) {
  var avatar = thumb(user)
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

function thumb (user) {
  var href = new URL('#' + user.screen_name, location)
  var title = user.screen_name

  return crel('a', { href, title, class: 'thumb' },
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

  return tweet
}

function nav (status, user) {
  var el = crel('nav')
  var sep = ''

  if (status.entities.media != null) {
    addItem(referral(status, user, 'Media'))
  }
  if (status.in_reply_to_status_id != null) {
    addItem(referral(status, user, 'Thread'))
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
    <use xlink:href="/icons/sprite.svg#${name}">
  </svg>`

  return el
}

function text (str) {
  return document.createTextNode(str)
}
