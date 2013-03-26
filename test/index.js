var pull = require('pull-stream')
var fs = require('fs')

var toPullStream = require('../')

pull.values([
'hello\n',
'  there\n'
])
.pipe(toPullStream(process.stdout))

toPullStream(fs.createReadStream(__filename))
  .pipe(pull.map(function (e) { return e.toString().toUpperCase() }))
  .pipe(toPullStream(process.stdout))
