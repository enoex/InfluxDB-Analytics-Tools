/* =========================================================================
 *
 * add-message-to-influx-db
 *      Analytics util to add data to influx db
 *
 *  ======================================================================== */
var logger = require('bragi');
var nconf = require('nconf');
var _ = require('lodash');
var request = require('request');

//NOTE: Ideally, nconf would be used to set analytics info
var influxDbUrl = require('../conf/config').influxDb.url;

// ======================================
//
// Util to send message to influxdb
//
// ======================================
// Instead of sending a POST request for each incoming analytics message, 
// batch them and send every SEND_INTERVAL milliseconds. 300 seems to be 
// a good amount of our use case, but yours may vary. The rationale for the
// batching is to prevent flooding the network with too many requests. 
// Data is batched into an array and sent over as a group (original time is
// preserved). 
//
// If you don't want this kind of batching (perhaps you must send a lot of
// requests on sub 1/3 second basis), simply take out the request.post and 
// place it in addMessageToInfluxData. However, you'll probably want to NOT
// use a HTTP request if you're doing this
//
var SEND_INTERVAL = 300;
var INFLUX_DATA = [];

var _influxTimeout = setInterval( function sendMessageToInflux (){
    // send messages on an interval, then reset the influx data array
    if(INFLUX_DATA.length > 0){ 
        logger.log('sendMessagesToInflux', 
            'sending data: %j', {
                numMessages: INFLUX_DATA.length,
                url: influxDbUrl
            });

        // send the data over an HTTP POST request.
        //      NOTE: As an HTTP POST request, the URL could point to a 
        //      load balancer 
        request.post({
            url: influxDbUrl,
            headers: { 'content-type': 'application/json' },

            // NOTE: This can be a bit expensive if there is a LOT of data,
            // so be sure to tweak the SEND_INTERVAL based on your use case
            body: JSON.stringify(INFLUX_DATA)

        }, function done(e,res,body){
            if(e){ 
                logger.log('error:addMessageToInfluxData', 'error with request: ' + e); 
            }
        });

        INFLUX_DATA.length = 0;  // reset array
    }
}, SEND_INTERVAL);


// --------------------------------------
// Send Data util
// --------------------------------------
function addMessageToInfluxData( data ){
    // Add messages to the INFLUX_DATA queue. Takes in an already processed 
    // `data` object.
    //
    // This is the exported function which others will call. It ensures that
    // the first column is a `time` column and adds it if not, then adds the
    // data the INFLUX_DATA, which is a batched array which will get sent to
    // influx

    // ensure time is first column
    if( data.columns[0] !== 'time' ){
        //ensure time is added
        var now = +new Date();

        data.columns.unshift( 'time' );

        _.each(data.points, function (d){
            d.unshift(now);
        });
    }

    // update messages
    INFLUX_DATA.push(data);
}
module.exports = addMessageToInfluxData;
