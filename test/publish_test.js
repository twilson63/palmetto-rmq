var test = require('tap').test
var rewire = require('rewire')
var palmetto = rewire('../')

test('publish', function (t) {
  palmetto.__set__('servicebus', {
    bus: function () {
      return {
        subscribe: function() {},
        publish: function (n, e) {
          t.equals(n, 'foo', 'should equal app name')
          t.deepEquals(e, { to: 'widget.request.create', name: 'foobar'}, 'should equal object')
          
        }
      }
    }
  })

  var ee = palmetto({ 
    endpoint: 'amqp://guest:guest@localhost:5672',
    app: 'foo'
  })
  ee.emit('send', { to: 'widget.request.create', name: 'foobar'})
  t.end()
})