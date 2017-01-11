var test = require('tap').test
var rewire = require('rewire')
var palmetto = rewire('../')

test('send', function (t) {
  palmetto.__set__('servicebus', {
    bus: function () {
      return {
        listen: function() {},
        send: function (n, e) {
          t.equals(n, 'foo', 'should equal app name')
          t.deepEquals(e, { to: 'widget.request.create', name: 'foobar'}, 'should equal object')
        }
      }
    }
  })

  var ee = palmetto({
    endpoint: 'amqp://guest:guest@localhost:5672',
    app: 'foo',
    roundRobin: true
  })

  ee.emit('send', { to: 'widget.request.create', name: 'foobar'})
  t.end()
})