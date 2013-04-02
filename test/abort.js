var pull    = require('pull-stream')
var through = require('through')
var toPull  = require('../')


require('tape')('abort', function (t) {

  t.plan(2)

  var ts = through()
  ts.on('close', function () {
    t.ok(true)
  })
  pull.values([.1, .4, .6, 0.7, .94, 0.3])
//  pull.infinite()
  .pipe(toPull(ts))
  .pipe(function (read) {
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

  })

})
