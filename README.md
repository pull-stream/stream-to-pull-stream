# stream-to-pull-stream

Convert a classic-stream, or a new-stream into a
[pull-stream](https://github.com/dominictarr/pull-stream)

## example

``` js
var toPullStream = require('stream-to-pull-stream')
var pull = require('pull-stream')

pull(
  toPullStream.source(fs.createReadStream(__filename)),
  pull.map(function (e) { return e.toString().toUpperCase() }),
  toPullStream.sink(process.stdout, function (err) {
    if(err) throw err
    console.log('done')
  })
)
```

## License

MIT
