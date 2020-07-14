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
  }
}

async function getHome (user) {
	var t = new Twit({
		consumer_key: consumerKey,
		consumer_secret: consumerSecret,
		access_token: user.accessToken,
		access_token_secret: user.accessTokenSecret
	})

  var feed = getFeed(t)
  var user = getUser(t, user.username)

  return {
    user: await user,
    feed: await feed
  }
}

async function getFeed (t) {
  var res = await get(t, 'friends/list', { count: 200 })
  return res.users
}

async function getUser (t, screen_name) {
  var res = await get(t, 'users/lookup', { screen_name })
  return res[0]
}

function get (t, endpoint, opts = {}) {
	opts.tweet_mode = opts.tweet_mode || 'extended'
	return promise(done => t.get(endpoint, opts, done))
}
