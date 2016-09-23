var pull    = require('pull-stream')
var through = require('through')
var toPull  = require('../')
var Hang = require('pull-hang')
var Cat = require('pull-cat')

require('tape')('abort', function (t) {

  t.plan(2)

  var ts = through()
  ts.on('close', function () {
    t.ok(true)
  })
  pull(
    pull.values([.1, .4, .6, 0.7, .94, 0.3]),
//  pull.infinite()
    toPull(ts),
    function (read) {
      console.log('reader!')
      read(null, function next (end, data) {
        console.log('>>>', end, data) 
        if(data > 0.9) {
          console.log('ABORT')
          read(true, function (end) {
            t.ok(true)
            t.end()
          })
        } else {
          read(null, next)
        }
      })
    }
  )
})

require('tape')('abort hang', function (t) {

  var ts = through(), aborted = false, c = 0, _read, ended, closed
  ts.on('close', function () {
    closed = true
  })
  pull(
    Cat([
      pull.values([.1, .4, .6, 0.7, 0.3]),
      Hang(function () {
        aborted = true
      })
    ]),
    toPull(ts),
    function (read) {
      _read = read
      read(null, function next (end, data) {
        if(end) {
          ended = true
        }
        else read(null, next)
      })
    }
  )

  setTimeout(function () {
    _read(true, function (end) {
      t.ok(aborted, 'aborted')
      t.ok(ended, 'ended')
      t.ok(closed, 'closed')
      t.ok(end, 'abort cb end')
      t.end()
    })
  }, 10)
})




