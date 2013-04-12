var pull = require('pull-stream')

function destroy(stream, cb) {
  function onClose () {
    cleanup(); cb()
  }
  function onError (err) {
    cleanup(); cb(err)
  }
  function cleanup() {
    stream.removeListener('close', onClose)
    stream.removeListener('error', onError)
  }
  stream.on('close', onClose)
  stream.on('error', onError)
}

function write(read, stream) {
  var ended
  function onClose () {
    cleanup()
    if(!ended) read(ended = true, function () {})
  }
  function onError (err) {
    cleanup()
    if(!ended) read(ended = err, function () {})
  }
  function cleanup() {
    stream.removeListener('close', onClose)
    stream.removeListener('error', onError)
  }
  stream.on('close', onClose)
  stream.on('error', onError)
  process.nextTick(function next() {
    read(null, function (end, data) {
      if(end === true)
        return stream._isStdio || stream.end()
      if(ended = ended || end)
        return stream.emit('error', end)

      var pause = stream.write(data)
      if(pause === false)
        stream.once('drain', next)
      else next()
    })
  })
}

function read2(stream) {
  var ended = false
  var _cb
  stream.on('end', function () {
    ended = true
  })
  stream.on('error', function (err) {
    ended = err
    _cb && _cb(ended)
  })
  return function (end, cb) {
    _cb = cb
    ;(function next () {
      if(ended && ended !== true) //ERROR
        return cb(ended)
      var data = stream.read()

      if(data == null) {
        if(ended)
          return cb(ended)
        return stream.once('readable', next)
      } else
        return cb(null, data)
    })()
  }
}

function read(stream) {
  if('function' === typeof stream.read)
    return read2(stream)

  var buffer = [], cbs = [], ended, paused = false

  var draining
  function drain() {
    while((buffer.length || ended) && cbs.length)
      cbs.shift()(buffer.length ? null : ended, buffer.shift())
    if(!buffer.length && (paused)) {
      paused = false
      stream.resume() 
    }
  }

  stream.on('data', function (data) {
    buffer.push(data)
    drain()
    if(buffer.length && stream.pause) {
      paused = true
      stream.pause()
    }
  })
  stream.on('end', function () {
    ended = true
    drain()
  })
  stream.on('error', function (err) {
    ended = err
    drain()
  })
  return function (abort, cb) {
    if(!cb) throw new Error('*must* provide cb')
    if(abort) {
      stream.once('close', function () {
        cb(abort)
      })
      stream.destroy()
    }
    cbs.push(cb)
    drain()
  }
}

module.exports = function (stream) {
  return (
    stream.writable
    ? stream.readable
      ? pull.Through(function (r) { write(r, stream); return read(stream) })() 
      : pull.Sink(function (r) { return write(r, stream) })()
    : pull.Source(function () { return read(stream) })()
  )
}


