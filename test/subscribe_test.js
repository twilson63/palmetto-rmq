var test = require('tap').test
var pr = require('../')

test('subscribe', function (t) {
  var ee = pr({ 
    endpoint: 'amqp://guest:guest@localhost:5672',
    app: 'foo'
  })
  var msg = { to: 'widget.request.create', name: 'foobar'}
  ee.on(msg.to, function (event) {
    console.log(event)
    console.log('notified')
    t.end()
  })
  setTimeout(function() {
    ee.emit('send', msg)
    console.log('sent')
  }, 500)

})