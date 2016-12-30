var EventEmitter = require('events').EventEmitter
var ee = new EventEmitter()
var servicebus = require('servicebus')

module.exports = function (config) {
  // validate config
  if (!config.endpoint) throw new Error('endpoint required!')
  if (!config.app) throw new Error('app required!')

  var bus = servicebus.bus({
    url: config.endpoint,
    vhost: config.vhost || null
  })

  config.listen ? bus.listen(config.app, notify) : bus.subscribe(config.app, notify)

  function notify (event) {
    if (event.to) ee.emit(event.to, event)
  }

  ee.on('send', function (event) {
    console.log('config.listen: ' + config.listen);
    console.log('config.app: ' + config.app);
    console.log('event: ' + event);
    config.listen ? bus.send(config.app, event) : bus.publish(config.app, event);
  })
  return ee
}