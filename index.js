var EventEmitter = require('events').EventEmitter
var ee = new EventEmitter()


module.exports = function (config) {
  // validate config
  if (!config.endpoint) throw new Error('endpoint required!') 
  if (!config.app) throw new Error('app required!')

  var bus = require('servicebus').bus({url: config.endpoint})
  
  bus.subscribe(config.app, notify)

  function notify (event) {
    ee.emit(event.id, event)
  }

  ee.on('send', function (event) {
    bus.publish(config.app, event)
  })
  return ee
}