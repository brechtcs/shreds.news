var { Strategy } = require('passport-twitter')
var { consumerKey, consumerSecret, callbackURL, sessionSecret } = require('./env')
var Twit = require('twit')
var outdent = require('outdent')
var passport = require('passport')
var polka = require('polka')
var promise = require('await-callback')
var session = require('express-session')
var static = require('serve-static')
var store = require('session-file-store')

var FileStore = store(session)
var sessionSettings = {
  store: new FileStore({ ttl: Infinity }),
  secret: sessionSecret,
  saveUninitialized: true,
  resave: true
}

passport.use(new Strategy({ consumerKey, consumerSecret, callbackURL }, (token, secret, profile, cb) => {
	profile.accessToken = token
	profile.accessTokenSecret = secret
	return cb(null, profile)
}))

passport.serializeUser((user, cb) => {
	delete user._raw
	return cb(null, user)
})

passport.deserializeUser((obj, cb) => {
	return cb(null, obj)
})

var app = polka()
app.use(static('public'))
app.use(session(sessionSettings))
app.use(passport.initialize())
app.use(passport.session())

app.get('/login', passport.authenticate('twitter'))
app.get('/login/callback', passport.authenticate('twitter', {
	failureRedirect: '/login'
}), (req, res) => {
	res.writeHead(302, { 'Location': '/home' })
	res.end()
})

app.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(render('login', '<a href="/login">login</a>'))
})

app.get('/home', async (req, res) => {
  var data = await get(req.user, 'friends/list', { count: 200 })
  var page = render('feed', JSON.stringify(data.users))
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(page)
})

app.listen(3000, () => console.log('Listening at localhost:3000'))

//======

function get (user, endpoint, opts = {}) {
	var t = new Twit({
		consumer_key: consumerKey,
		consumer_secret: consumerSecret,
		access_token: user.accessToken,
		access_token_secret: user.accessTokenSecret
	})

	opts.tweet_mode = opts.tweet_mode || 'extended'
	return promise(done => t.get(endpoint, opts, done))
}

function render (type, content) {
  return outdent`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>shreds.news</title>
        <link rel="stylesheet" href="/style.css">
        <script type="module" src="/app.js"></script>
      </head>
      <body>
        <header>
          <h1>Shreds.News</h1>
          <a href="https://github.com/brechtcs/shreds.news">Code</a>
        </header>
        <main is="shreds-app" type="${type}" hidden>
          ${content}
        </main>
      </body>
    </html>
  `
}
