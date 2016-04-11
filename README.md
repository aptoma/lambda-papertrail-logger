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
	var papertrailConfig = {
		// @see https://papertrailapp.com/account/destinations
		host: 'logs123.papertrail.com',
		port: 12345
	};
	var log = createLogger(context, papertrailConfig);
	log.info('Executing handler', event);
};
```

The logger is an extension of `winston.Logger`.

### Log timer events

In addition to being created with the relevant transports and formatters, the logger also exposes a `log.timerEvent(event)` method.

It will format a timer event created by [@aptoma/timer](https://github.com/aptoma/node.timer) for sending to our internal event analytics service:

```js
var createLogger = require('@aptoma/lambda-papertrail-logger');
var timer = require('@aptoma/timer');

exports.handler = function (event, context) {
	var elapsed = timer('ProcessingTime');
	var log = createLogger(context, papertrailConfig);
	log.timerEvent(elapsed());
};
```

## Caveat!

When using the 0.10 Lambda runtime, the process will terminate soon after `context.success/fail/done()` is called. In practice, this means that events may not be sent if the connection to Papertrail has not been established by this time. There's also a possibility that the last few events may not be sent anyway.

When using the 4.3 runtime with callbacks, the process isn't terminated until the event loop is empty. This means that all events should be sent, but especially for scripts with very short durations, there's a possibility that the duration will be extended in order to ship the logs to Papertrail.

If you prefer the 4.3 runtime to rather shut down early, set `context.callbackWaitsForEmptyEventLoop` to false. See http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html.
