var EventEmitter = require('events').EventEmitter
var ee = new EventEmitter()


module.exports = function (config) {
  // validate config
  if (!config.endpoint) throw new Error('endpoint required!') 
  if (!config.app) throw new Error('app required!')

  var bus = require('servicebus').bus({
    url: config.endpoint,
    vhost: config.vhost || null
  })
  
  bus.subscribe(config.app, notify)

  function notify (event) {
    if (event.to) ee.emit(event.to, event)
  }

  ee.on('send', function (event) {
    bus.publish(config.app, event)
  })
  return ee
}