Lambda Papertrail Logger
========================

A module for logging to Papertrail from AWS Lambda.

It will add metadata to the logs based on the context the function is run in, and format everything as JSON for easy reuse in other services.

This module is designed to be used within Aptoma, and is therefore rather opinionated with limited configuration options.

Installation
------------

    npm install --save @aptoma/lambda-papertrail-logger

Usage
-----

```js
var createLogger = require('@aptoma/lambda-papertrail-logger');

exports.handler = function (event, context) {
	var log = createLogger(context, papertrailConfig);
	log.info('Executing handler', event);
};
```

The logger is an extension of `winston.Logger`.

In addition to being created with the relevant transports and formatters, it also exposes a `log.timerEvent(event)` method.

`log.timerEvent(event)` will format a timer event created by [@aptoma/timer](https://github.com/aptoma/node.timer) for sending to our internal event analytics service:

```js
var createLogger = require('@aptoma/lambda-papertrail-logger');
var timer = require('@aptoma/timer');

exports.handler = function (event, context) {
	var elapsed = timer('ProcessingTime');
	var log = createLogger(context, papertrailConfig);
	log.timerEvent(elapsed());
};
```
