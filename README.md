# stream-to-pull-stream

Convert a classic-stream, or a new-stream into a
[pull-stream](https://github.com/dominictarr/pull-stream)

## example

``` js
var toPullStream = require('stream-to-pull-stream')
var pull = require('pull-stream')

toPullStream(fs.createReadStream(__filename))
  .pipe(pull.map(function (e) { return e.toString().toUpperCase() }))
  .pipe(toPullStream(process.stdout))
```

## License

MIT
