'use strict'

// var servicebus = require('servicebus')
var debug = require('debug')('palmetto-rmq')
var EventEmitter = require('events').EventEmitter

var DEFAULT_RETRY_INTERVAL = 5000
var DEFAULT_MAX_RETRIES = 10

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

  var bus = require('servicebus').bus({
    url: config.endpoint,
    vhost: config.vhost || null
  });

  bus.on('ready', () => { config._attempts = 1; });

  bus.on('error', (err) => {
    var maxRetries = Number(config.maxRetries) || DEFAULT_MAX_RETRIES;
    if ((err.code === 'ECONNREFUSED' || err.errno === 'ECONNREFUSED') &&
        config._attempts <= maxRetries) {
      // Only happens if the Rabbit host is up, but the service not responsive (at startup)
      var retryInterval = Number(config.retryInterval) || DEFAULT_RETRY_INTERVAL;
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

