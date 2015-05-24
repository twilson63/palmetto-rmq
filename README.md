# Palmetto RMQ

This module uses rabbitMQ as the pub/sub messaging component for palmetto flow applications

## usage

### configure

``` js
var io = require('@twilson63/palmetto-rmq')({
  endpoint: 'amqp://guest:guest@localhost:5672',
  app: '<appname>',
  vhost: '<optional>'
})
```

### subscribe
``` js
io.on('foobar', function (msg) {
  console.log(msg)
})
```

### publish
``` js
io.emit('send', msg)
```

## common patterns

### frontend component query

``` js
var uuid = uuid.v4()
io.on(uuid, function (event) {
  console.log(event.object)
})
io.emit('send', {
  to: 'widget.all.request',
  from: uuid,
  subject: 'widget',
  verb: 'all',
  type: 'request',
  object: {}
})
```

### backend service

``` js
io.on('widget.all.request', function (event) {
  // do work
  var results = ...

  io.emit('send', {
    to: event.from,
    subject: 'widget',
    verb: 'all',
    type: 'response',
    object: results
  })
})
```

The service listens to the `widget.all.request` svc then uses the `from` node to publish the response to.