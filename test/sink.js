var pull    = require('pull-stream')
var through = require('through')
var toPull  = require('../')

var tape = require('tape')

tape('propagate close back to source', function (t) {

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
    })
  )
})


tape('error', function (t) {


  var ts = through()
  var err = new Error('wtf')
  pull(
    pull.values([1,2,3]),
    function (read) {
      return function (abort, cb) {
        read(abort, function (end, data) {
          if(data === 3) cb(err)
          else           cb(end, data)
        })
      }
    },
    toPull.sink(ts, function (_err) {
      t.equal(_err, err)
      t.end()
    })
  )

})

// This should only occur with streams that are not
// behaving properly. Streams that do not close properly
// may not be writable, so subsequent writes will throw an error
tape('write to stream when writable is false', (t) => {

  var ts = through()
  pull(
    pull.values([1,2,3]),
    function (read) {
      return function (abort, cb) {
        read(abort, function (end, data) {
          if(data === 2) {
            ts.writable = false
            ts.write = function() {
              throw new Error('Cannot call write after a stream was destroyed')
            }
          }
          cb(end, data)
        })
      }
    },
    toPull.sink(ts, function (err, v) {
      t.notOk(err)
      t.end()
    })
  )

})
