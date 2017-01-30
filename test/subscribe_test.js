var test = require('tap').test
var rewire = require('rewire')
var palmetto = rewire('../')

test('subscribe', function (t) {
  palmetto.__set__('servicebus', {
    bus: function () {
      return {
        subscribe: function(n, fn) {
          setTimeout(function () {
            fn({ to: 'foo.bar', from: 'beepboop' })
          }, 50)
        },
        publish: function () {},
        on: function() {}
      }
    }
  })

  var ee = palmetto({ 
    endpoint: 'amqp://guest:guest@localhost:5672',
    app: 'foo'
  })
  ee.on('foo.bar', function (event) {
    t.equals(event.to, 'foo.bar')
    t.equals(event.from, 'beepboop')
    t.end()
  })
})
