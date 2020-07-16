var MarkdownIt = require('markdown-it')
var outdent = require('outdent')

var md = new MarkdownIt()

module.exports = (data) => outdent`
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Shreds &middot; News</title>

      <link rel="stylesheet" href="/style.css">
      <script type="module" src="/app.js"></script>
    </head>
    <body>
      <header is="shreds-header">
        <h1>
          <a href="/home">
            <svg viewBox="0 0 35 30" style="max-height: 2em">
              <use xlink:href="/icons/logo.svg#logo"></use>
            </svg>
          </a>
        </h1>
      </header>
      <noscript>
        <aside class="nojs">Shreds requires JavaScript to work properly. Please switch it on to continue using the app.</aside>
      </noscript>
      <main>
        <section id="detail" is="shreds-detail" ${type(data)}>${detail(data)}</section>
        <section id="feed" is="shreds-feed">${feed(data)}</section>
      </main>
    </body>
  </html>
`

function detail (data) {
  if (data.markdown)
    return md.render(data.markdown)
  if (data.thread)
    return JSON.stringify(data.thread)
  if (data.user)
    return JSON.stringify(data.user)

  return ''
}

function feed (data) {
  return data.feed ? JSON.stringify(data.feed) : ''
}

function type (data) {
  if (data.thread)
    return 'data-type="thread"'
  if (data.user)
    return 'data-type="user"'

  return ''
}
