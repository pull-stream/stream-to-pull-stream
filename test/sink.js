var pull    = require('pull-stream')
var through = require('through')
var toPull  = require('../')

require('tape')('propagate close back to source', function (t) {

//  t.plan(4)

  var ended = false
  var input = [1,2,3]
  var ts = through(function (data) {
    t.equal(data, input.shift())
  }, function () {
    ended = true
    this.queue(null)
  })
  pull(
    pull.values([1,2,3]),
    toPull.sink(ts, function (err) {
      t.notOk(err)
      t.ok(ended)
      t.end()
    }))
})

