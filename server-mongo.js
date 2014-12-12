/* =========================================================================
 * 
 * server-db-stats.js
 *      Server which queries and reports on DB stats 
 *
 * ========================================================================= */
// Use cluster
var os = require('os');
var _ = require('lodash');
var async = require('async');
var nconf = require('nconf');
var logger = require('bragi');

// Use the native mongodb driver
var MongoClient = require('mongodb').MongoClient,
    ReplSetServers = require('mongodb').ReplSetServers;

// get config (NOTE: In a real project, you could use something like nconf)
// ....

// include libs
var flatten = require('./lib/helpers').flatten;
var analytics = require('./lib/analytics');

// Connect to Mongo and get stats
// --------------------------------------
// TODO: Chat messages should be on separate DB
MongoClient.connect(nconf.get('database').db, function(err, db) {
    if(err){ 
        logger.log('error:server-stats', 'error connecting: ' + err);
        throw err;
    }
    logger.log('server-stats', 'Connected!');

    function getStatsAndSend() {

        async.parallel([
            // --------------------------
            // specific behavior stats
            // --------------------------
            function getBehaviorStats(callback){
                var start = process.hrtime();

                // Room Count
                db.collection('rooms').aggregate([
                    { $group: { _id: null, count: { $sum: 1 } } }
                ], function ( err, result ){
                    if(err || !result){ 
                        logger.log('error:roomCount', 'error: ' + err);
                        return; 
                    }

                    var diff = process.hrtime(start);
                    var ms = (diff[0] * 1e9) + diff[1] / 1000000;

                    if(result.length < 1){
                        logger.log('warn:roomCount', 'nothing returned',
                            ' | time: ' + ms + 'ms');
                        analytics.track({
                            group: 'app:rooms:count', queryTime: ms, 
                            value: 0
                        }); 
                        return false;
                    }

                    result = +result[0].count;

                    analytics.track({
                        group: 'app:rooms:count', queryTime: ms, value: result
                    }); 
                });
            
                // User count
                db.collection('users').aggregate([
                    { $match: { isActive: true } },
                    { $group: { _id: null, count: { $sum: 1 } } }
                ], function ( err, result ){
                    if(err || !result){ 
                        logger.log('error:userCount', 'error: ' + err);
                        return; 
                    }

                    var diff = process.hrtime(start);
                    var ms = (diff[0] * 1e9) + diff[1] / 1000000;

                    if(result.length < 1){
                        logger.log('warn:userCount', 'nothing returned',
                            ' | time: ' + ms + 'ms');
                        analytics.track({
                            group: 'app:users:online', queryTime: ms, 
                            value: 0
                        }); 
                        return false;
                    }

                    result = result[0].count;

                    logger.log('userCount', 'num users online: ' + result +
                        ' | time: ' + ms + 'ms');
                    // send to analytics
                    analytics.track({
                        group: 'app:users:online', queryTime: ms, value: result
                    }); 
                });

                // TODO: :::::: Move this to the different DB connection
                // Chat Messages
                // ----------------------
                db.collection('chatmessages').aggregate([
                    { $group: { _id: null, count: { $sum: 1 } } }
                ], function ( err, result ){
                    if(err || !result ){ 
                        logger.log('error:chatMessages', 'error: ' + err);
                        return; 
                    }

                    var diff = process.hrtime(start);
                    var ms = (diff[0] * 1e9) + diff[1] / 1000000;

                    if(result.length < 1){
                        logger.log('warn:roomCount', 'nothing returned',
                            ' | time: ' + ms + 'ms');
                        analytics.track({
                            group: 'app:chatMessages:count', queryTime: ms, 
                            value: 0
                        }); 
                        return false;
                    }


                    result = result[0].count;

                    // send to analytics
                    analytics.track({
                        group: 'app:chatMessages:count', queryTime: ms,
                        value: result
                    }); 
                });

                // ----------------------
                // All done - call this manually after a short time
                // ----------------------
                setTimeout(callback, 30);
            },

            // --------------------------
            // aggregate / server stats
            // --------------------------
            function getServerStats(callback){
                // Server stats
                // ----------------------
                db.admin().serverStatus(function(e,serverStatus){
                    analytics.track(_.extend({
                        group: 'database:serverStatus'
                    }, flatten(serverStatus)));

                    callback();
                });
            }, 

            function getDbStats(callback){
                // Get DB stats
                // ----------------------------------
                db.stats(function(e, dbStats){
                    dbStats.version = dbStats.dataFileVersion.major + '.' + 
                        dbStats.dataFileVersion.minor;

                    delete dbStats.dataFileVersion;
                    delete dbStats.extentFreeList;

                    // send to analytics
                    analytics.track(_.extend({
                        group: 'database:stats:db'
                    }, dbStats));

                    callback();
                });
            },

            function getDbStats(callback){
                // Get collection stats
                // ----------------------------------
                db.collections(function(err, collections){
                    // send over stats for each collection
                    _.each(collections, function(collection, i){
                        // TODO: make sure size is right
                        collection.stats(function(e,stats){ 
                            if(e){ return;  } // no op
                            var index = stats.indexSizes;

                            // flatten indexes
                            delete stats.indexSizes;

                            var totalIndexSize = 0;

                            _.each(index, function(value, key){
                                stats['indexSizes.' + key] = value;
                                totalIndexSize += value;
                            });

                            stats.totalIndexSize = totalIndexSize;

                            // send to analytics
                            analytics.track(_.extend({
                                group: 'database:stats:collection',
                                collectionName: stats.ns
                            }, stats));
                        });
                    });

                    // done with collections, now send
                    callback();
                });
            }
        
        ], function allDone(){
            // All done
            logger.log('server-stats:sentStats',
                'send stats! Preparing to send more...');
                
            // Do it every n seconds
            setTimeout(getStatsAndSend, 3 * 1000);
        });
    }

    // Start the process
    getStatsAndSend();

});
