var test = require('tap').test
var pr = require('../')

test('publish', function (t) {
  var ee = pr({ 
    endpoint: 'amqp://guest:guest@localhost:5672',
    app: 'foo'
  })
  ee.emit('send', { id: 'widget.request.create', name: 'foobar'})
  t.end()
})