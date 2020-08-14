var { consumerKey, consumerSecret } = require('../env')
var Twit = require('twit')
var promise = require('await-callback')

module.exports.getData = getData
module.exports.getHome = getHome

function getData (user, query) {
  var t = new Twit({
    consumer_key: consumerKey,
    consumer_secret: consumerSecret,
    access_token: user.accessToken,
    access_token_secret: user.accessTokenSecret
  })

  switch (query.data) {
    case 'feed':
      return getFeed(t)
    case 'thread':
      return getThread(t, query.id)
    case 'user':
      return getUser(t, user.username)
  }
}

async function getHome (user, query) {
  query.data = query.data || 'user'

  var home = {}
  home['feed'] = getData(user, { data: 'feed' })
  home[query.data] = getData(user, query)

  for (var key of Object.keys(home))
    home[key] = await home[key]

  return home
}

async function getFeed (t) {
  var res = await get(t, 'friends/list', { count: 200 })
  return res.users
}

async function getThread (t, id) {
  var thread = []
  var prev = await get(t, 'statuses/show', { id })
  thread.push(prev)

  while (id = prev.in_reply_to_status_id_str) {
    if (thread.length > 7) break
    prev = await get(t, 'statuses/show', { id })
    thread.push(prev)
  }

  return thread.reverse()
}

async function getUser (t, screen_name) {
  var res = await get(t, 'users/lookup', { screen_name })
  return res[0]
}

function get (t, endpoint, opts = {}) {
  opts.tweet_mode = opts.tweet_mode || 'extended'
  return promise(done => t.get(endpoint, opts, done))
}
