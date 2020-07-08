var { Strategy } = require('passport-twitter')
var { get } = require('./lib/twitter')
var { join } = require('path')
var MarkdownIt = require('markdown-it')
var env = require('./env')
var fs = require('fs')
var morgan = require('morgan')
var passport = require('passport')
var polka = require('polka')
var render = require('./lib/render')
var session = require('express-session')
var static = require('serve-static')
var store = require('session-file-store')

var APP = join(__dirname, 'app')
var README = join(__dirname, 'README.md')

var FileStore = store(session)
var sessionSettings = {
  store: new FileStore({ ttl: Infinity }),
  secret: env.sessionSecret,
  saveUninitialized: true,
  resave: true
}

passport.use(new Strategy(env, (token, secret, profile, cb) => {
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

var md = new MarkdownIt()
var app = polka({
  onError: (err, req, res) => {
    res.writeHead(err.code, { 'Content-Type': 'text/html' })

    if (err.code !== 404)
      res.end(render('text/html', '<h1>Oops</h1><p>Something went wrong</p>'))
    else
      res.end(render('text/html', '<h1>Oops</h1><p>Page not found</p>'))
  }
})

app.use(morgan('tiny'))
app.use(static(APP))
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

app.get('/', (req, res, next) => {
  fs.readFile('./README.md', 'utf8', function (err, readme) {
    var content = md.render(readme)
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(render('text/html', content))
  })
})

app.get('/home', async (req, res) => {
  if (req.user) {
    var data = await get(req.user, 'friends/list', { count: 200 })
    var page = render('application/json', JSON.stringify(data.users))
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(page)
  } else {
    res.writeHead(302, { 'Location': '/' })
    res.end()
  }
})

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err)
    res.writeHead(302, { 'Location': '/' })
    res.end()
  })
})

app.listen(3000, () => console.log('Listening at localhost:3000'))
