/* =========================================================================
 * 
 * server-amqp.js
 *      Server which tracks amqp stats
 *
 * ========================================================================= */
// Use cluster
var os = require('os');
var _ = require('lodash');
var async = require('async');
var request = require('request');
var nconf = require('nconf');
var logger = require('bragi');
var flattenObject = require('./util').flattenObject;

require('./conf/configure')();

var analytics = require('../lib/util/analytics');

// TODO: get from config
var url = 'http://guest:guest@localhost:15672/api/overview';


// --------------------------------------
// Connect to Mongo and get stats
// --------------------------------------
function getData (){
    request.get(
        url,
        function(e, res, text){
            // Handle error
            // --------------------------
            if(e){
                logger.log('error:server-stats-amqp', 'error contacting server: ' + e);
                analytics.track({
                    group: 'stats:amqp:error'
                });
                return setTimeout(getData, 1000 * 20);
            }

            // Process Data
            // --------------------------
            var data = JSON.parse(text);

            // track data
            analytics.track(_.extend({
                group: 'stats:amqp'
            }, flattenObject( data )));

            // call again
            setTimeout(getData, 1000 * 3);
    });
}

getData();
