export class Masonry {
  static init (grid) {
    var self = new Masonry(grid)
    self.resizer.observe(self.grid)
    return self
  }

  constructor (grid) {
    this.grid = grid
    this.resizer = new ResizeObserver(() => {
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
      item.classList.add('column-' + i % columns)
      this.resizer.observe(item)
    })

    for (var column = 0; column < columns; column++) {
      var moveUp = 0

      for (var row of document.querySelectorAll('.column-' + column)) {
        row.style.setProperty('position', 'relative')
        row.style.setProperty('top', `-${moveUp}px`)
        moveUp += Number(row.dataset.freeHeight)
      }
    }
  }
}
