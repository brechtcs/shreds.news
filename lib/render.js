var outdent = require('outdent')

module.exports = (type, content) => outdent`
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
      <main is="shreds-app" content-type="${type}" id="app">${content}</main>
    </body>
  </html>
`
