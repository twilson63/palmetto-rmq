var test = require('tap').test
var rewire = require('rewire')
var palmetto = rewire('../')

test('listen', function (t) {
  palmetto.__set__('servicebus', {
    bus: function () {
      return {
        listen: function(n, fn) {
          setTimeout(function () {
            fn({ to: 'foo.bar', from: 'beepboop' })
          }, 50)
        },
        send: function () {},
        on: function() {}
      }
    }
  })

  var ee = palmetto({
    endpoint: 'amqp://guest:guest@localhost:5672',
    app: 'foo',
    roundRobin: true
  })

  ee.on('foo.bar', function (event) {
    t.equals(event.to, 'foo.bar')
    t.equals(event.from, 'beepboop')
    t.end()
  })
})
