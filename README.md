# Palmetto RMQ

This module uses rabbitMQ as the pub/sub messaging component for palmetto flow applications and also supports

The default behavior works well if you want to have several subscribers that receive all messages.

Optional behavior is to utilize the `roundRobin` option to distribute the message to the subscribers in a round-robin fashion.

In either configuration you can optionally provide a `publishOnly` option. The returned instance will not receive any messages.


[![Build Status](https://travis-ci.org/twilson63/palmetto-rmq.svg?branch=master)](https://travis-ci.org/twilson63/palmetto-rmq)

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

------------------

### Fetching response from scaled service

#### Requesting from a scaled load-balanced service instance

``` js
//requestor-service.js

var requestorIo = require('@twilson63/palmetto-rmq')({
  endpoint: 'amqp://guest:guest@localhost:5672',
  app: '<requestorServiceName>',
  vhost: '<optional>'
})

var handlerIo = require('@twilson63/palmetto-rmq')({
  endpoint: 'amqp://guest:guest@localhost:5672',
  app: '<handlerServiceName>',
  vhost: '<optional>',
  roundRobin: true,
  publishOnly: true // only the 'handlerService' will listen for messages
})                  // this instance shouldn't participate in `roundRobin` consumption


var uuid = uuid.v4()

//setup response msg handler
requestorIo.on(uuid, function (event) {
  console.log(event.object)
})

//send request msg
handlerIo.emit('send', {
  to: 'widget.all.request',
  from: uuid,
  subject: 'widget',
  verb: 'all',
  type: 'request',
  object: {}
})
```

#### Receiving response from scaled load-balanced service

``` js
//handler-service.js

var inboundIo = require('@twilson63/palmetto-rmq')({
  endpoint: 'amqp://guest:guest@localhost:5672',
  app: '<handlerServiceName>',
  vhost: '<optional>',
  roundRobin: true,   // all instances of 'handlerService' will get 'roundRobin' msg distribution
  publishOnly: false  // and obviously listen for those msgs
})

var requestorIo = require('@twilson63/palmetto-rmq')({
  endpoint: 'amqp://guest:guest@localhost:5672',
  app: '<requestorServiceName>',
  vhost: '<optional>'
})


//handle request messages
inboundIo.on(uuid, function (event) {

  doSomething(event.object)
    .then(resultObject => {

      requestorIo.emit('send', {
        to: event.from,
        from: event.to,
        subject: event.subject + '-response',
        verb: event.verb + '-response',
        type: 'response',
        object: resultObject
      })

    })
    .catch(error => {

      requestorIo.emit('send', {
        to: event.from,
        from: event.to,
        subject: event.subject + '-error',
        verb: event.verb + '-error',
        type: 'response',
        object: error
      })

    })
})


```


