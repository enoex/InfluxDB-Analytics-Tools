/* =========================================================================
 *
 * config.js
 *      Ideally, this would be replaced with a script that uses something like
 *      nconf to load various environmental config files; or, some other
 *      system that makes changing parameters more easy.
 *
 *      For this demo, all config settings will be exposed here
 *
 * ========================================================================= */
// values that should change based on your setup:
var influxUser = 'root';
var influxPass = 'root';
// NOTE: ensure this DB exists! If it doesn't, , you will get an error
var influxDb = 'analytics';

// Config object
// --------------------------------------
var CONFIG = {
    db: {
        host: 'localhost',
        port: 27017
    },

    influxdb: {
        url: 'http://localhost:8086/db/' + influxDb + '/series?' + 
            'u=' + influxUser + '&p=' + influxPass
    }
};

module.exports = CONFIG;
