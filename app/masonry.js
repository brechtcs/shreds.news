export class Masonry {
  static init (grid) {
    var self = new Masonry(grid)
    self.resizer.observe(self.grid)
    return self
  }

  constructor (grid) {
    this.grid = grid
    this.resizer = new Resizer(() => {
      this.reposition()
    })
  }

  reposition () {
    var style = getComputedStyle(this.grid)
    var columns = style.gridTemplateColumns.split(' ').length
    var heights = style.gridTemplateRows.split(' ')

    Array.from(this.grid.children).forEach((item, i) => {
      var rowHeight = Number(heights[Math.floor(i / columns)].replace(/px$/, ''))
      var itemHeight = Number(getComputedStyle(item).height.replace(/px$/, ''))
      item.dataset.freeHeight = rowHeight - itemHeight
      item.dataset.column = i % columns
      this.resizer.observe(item)
    })

    for (var column = 0; column < columns; column++) {
      var moveUp = 0

      for (var row of document.querySelectorAll(`[data-column="${column}"]`)) {
        row.style.setProperty('position', 'relative')
        row.style.setProperty('top', `-${moveUp}px`)
        moveUp += Number(row.dataset.freeHeight)
      }
    }
  }
}

class Resizer {
  constructor (cb) {
    if ('ResizeObserver' in window) {
      this.observer = new ResizeObserver(cb)
    } else {
      addEventListener('resize', () => cb())
      setTimeout(cb)
    }
  }

  observe (el) {
    if (this.observer) this.observer.observe(el)
  }
}
