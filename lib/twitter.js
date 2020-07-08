var { consumerKey, consumerSecret } = require('../env')
var Twit = require('twit')
var promise = require('await-callback')

module.exports.get = function get (user, endpoint, opts = {}) {
	var t = new Twit({
		consumer_key: consumerKey,
		consumer_secret: consumerSecret,
		access_token: user.accessToken,
		access_token_secret: user.accessTokenSecret
	})

	opts.tweet_mode = opts.tweet_mode || 'extended'

	return promise(done => t.get(endpoint, opts, done))
}
