var servicebus = require('servicebus')
var debug = require('debug')('palmetto-rmq')
var EventEmitter = require('events').EventEmitter

module.exports = function (config) {
  var ee = new EventEmitter()

  config._attempts = 0;

  // validate config
  if (!config.endpoint) throw new Error('endpoint required!')
  if (!config.app) throw new Error('app required!')

  establishConnection(config, ee);

  return ee
}

function establishConnection(config, ee) {
  config._attempts++;

  var bus = servicebus.bus({
    url: config.endpoint,
    vhost: config.vhost || null
  });

  bus.on('error', (err) => {
    if ((err.code === 'ECONNREFUSED' || err.errno === 'ECONNREFUSED') && config._attempts <= 10) {
      // Only happens if the Rabbit host is up, but the service not responsive (at startup)
      var retryInterval = Number(config.retryInterval) || 2000;
      debug('ECONNREFUSED (' + config.endpoint + ' / ' + config.app + '). Reconnection attempt #' + config._attempts + ' in ' + retryInterval + ' ms');
      setTimeout(() => { establishConnection(config, ee); }, retryInterval);
    } else {
      ee.emit('error', err);
    }
  });

  // If this is a reconnection, the old listener is being replaced
  ee.removeAllListeners(['send']);
  ee.on('send', function (event) {
    config.roundRobin ? bus.send(config.app, event) : bus.publish(config.app, event);
  })

  if (!config.publishOnly) {
    function notify (event) {
      if (event.to) ee.emit(event.to, event)
    }
    if (config.roundRobin) {
      bus.listen(config.app, notify);
    } else {
      bus.subscribe(config.app, notify);
    }
  }

  // Automatically reconnect on closed connections (true by default)
  if (config.reconnect !== false) {
    bus.on('connection.close', () => {
      bus = establishConnection(config, ee);
    });
  }
  return bus;
}

