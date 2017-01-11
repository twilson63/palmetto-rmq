module.exports = function (config) {
  var servicebus = require('servicebus')
  var EventEmitter = require('events').EventEmitter
  var ee = new EventEmitter()
  // validate config
  if (!config.endpoint) throw new Error('endpoint required!')
  if (!config.app) throw new Error('app required!')

  var bus = servicebus.bus({
    url: config.endpoint,
    vhost: config.vhost || null
  })

  if (!config.publishOnly) {
    config.roundRobin ? bus.listen(config.app, notify) : bus.subscribe(config.app, notify);
  }

  function notify (event) {
    if (event.to) ee.emit(event.to, event)
  }

  ee.on('send', function (event) {
    config.roundRobin ? bus.send(config.app, event) : bus.publish(config.app, event);
  })
  return ee
}