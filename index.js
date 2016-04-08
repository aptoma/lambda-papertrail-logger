'use strict';

require('./object.assign-polyfill');
var winston = require('winston');
var moment = require('moment-timezone');
var papertrailTransport = require('winston-papertrail').Papertrail;

/**
 * @typedef {Object} LambdaLogger
 * @augments {winston.Logger}
 * @property {function} timerEvent
 */

/**
 * @typedef {Object} TimerEvent
 * @property {string} name
 * @property {string} summary
 * @property {float} msec
 * @property {Array} hrtime
 */

/**
 * @typedef {Object} LambdaContext
 * @property {string} functionName
 * @property {string} invokedFunctionArn
 * @property {string} awsRequestId
 * @property {string} functionVersion
 */

/**
 * @typedef {Object} PapertrailConfig
 * @property {string} host
 * @property {int} port
 * @see https://papertrailapp.com/account/destinations
 */

/**
 * @param {LambdaContext} context
 * @param {PapertrailConfig} papertrailConfig
 * @returns {LambdaLogger}
 */
module.exports = function createLogger(context, papertrailConfig) {
	var log = new (winston.Logger)({
		transports: [
			// This transport is used to output message to your local console, and is also the one picked up by Cloudwatch
			new (winston.transports.Console)({
				formatter: function (options) {
					return timestamp() + ' ' + options.message;
				}
			})
		]
	});

	// Only send logs to Papertrail if we're running on Lambda, and have provided config options
	if (context.awsRequestId && papertrailConfig && papertrailConfig.host) {
		addPapertrailLogger(context, papertrailConfig);
	}

	/**
	 * Log timer event, formatted for sending to Grimm
	 *
	 * @param {TimerEvent} event
	 */
	log.timerEvent = function (event) {
		log.info(event.summary, {
			name: event.name,
			fields: {
				msec: parseFloat(event.msec.toFixed(3))
			},
			tags: {
				service: context.functionName
			},
			_tags: ['event']
		});
	};

	return log;

	/**
	 * @param {LambdaContext} context The context object supplied to the handler by AWS Lambda
	 * @param {PapertrailConfig} papertrailConfig
	 */
	function addPapertrailLogger(context, papertrailConfig) {
		log.add(papertrailTransport, {
			host: papertrailConfig.host,
			port: papertrailConfig.port,
			program: context.functionName,
			hostname: getHostnameForARN(context.invokedFunctionArn),
			includeMetaInMessage: false,
			messageFormat: function (level, message, meta) {
				return JSON.stringify(Object.assign({
					_time: timestamp(),
					msg: message
				}, meta, {
					level: level,
					version: context.functionVersion,
					requestId: context.awsRequestId
				}));
			}
		});
	}

	function getHostnameForARN(ARN) {
		var arnParts = ARN.split(':');
		return arnParts[3] ? 'aws-lambda-' + arnParts[3] : 'aws-lambda';
	}

	function timestamp() {
		var m = moment();
		m.tz('Europe/Oslo');
		return m.format('YYYY-MM-DD HH:mm:ss.SSS');
	}
};
