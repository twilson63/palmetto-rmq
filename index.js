module.exports = function (config) {
  const servicebus = require('servicebus')
  const EventEmitter = require('events').EventEmitter
  const ee = new EventEmitter()
  // validate config
  if (!config.endpoint) throw new Error('endpoint required!')
  if (!config.app) throw new Error('app required!')

  var bus = servicebus.bus({
    url: config.endpoint,
    vhost: config.vhost || null
  })

  if (config.consumer) {
    config.roundRobin ? bus.listen(config.app, notify) : bus.subscribe(config.app, notify)
  }

  function notify (event) {
    if (event.to) ee.emit(event.to, event)
  }

  ee.on('send', function (event) {
    console.log('config.roundRobin: ' + config.listen);
    console.log('config.app: ' + config.app);
    console.log('event: ' + event);
    config.roundRobin ? bus.send(config.app, event) : bus.publish(config.app, event);
  })
  return ee
}