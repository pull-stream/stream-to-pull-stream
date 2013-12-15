var pull = require('pull-core')

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

function first (emitter, events, handler) {
  function listener (val) {
    events.forEach(function (e) {
      emitter.removeListener(e, listener)
    })
    handler(val)
  } 
  events.forEach(function (e) {
    emitter.on(e, listener)
  })
  return emitter
}

function read2(stream) {
  var ended = false, waiting = false
  var _cb

  function read () {
    var data = stream.read()
    if(data !== null && _cb) {
      var cb = _cb; _cb = null
      cb(null, data)
    }
  }

  stream.on('readable', function () {
    waiting = true
    _cb && read()
  })
  .on('end', function () {
    ended = true
    _cb && _cb(ended)
  })
  .on('error', function (err) {
    ended = err
    _cb && _cb(ended)
  })

  return function (end, cb) {
    _cb = cb
    if(ended)
      cb(ended)
    else if(waiting)
      read()
  }
}

function read1(stream) {
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

function read (stream) {
  if('function' === typeof stream.read)
    return read2(stream)
  return read1(stream)
}

var sink = function (stream) {
  return pull.Sink(function (read) {
    return write(read, stream)
  })()
}

var source = function (stream) {
  return pull.Source(function () { return read(stream) })()
}

exports = module.exports = function (stream) {
  return (
    stream.writable
    ? stream.readable
      ? pull.Through(function(_read) {
          write(_read, stream); 
          return read(stream) 
        })()  
      : sink(stream)
    : source(stream)
  )
}

exports.sink = sink
exports.source = source
exports.read = read
exports.read1 = read1
exports.read2 = read2

