/*  ========================================================================
 *
 * util.js
 *
 * ========================================================================= */
function flatten (obj, delimitter) {
    // Takes in an object and returned a flattened object, using a delimitter
    // to indicate nesting. e.g., {a: {b: 42 }} turns into { 'a.b': 42 }
    delimitter = delimitter || '.'; // delimitter is '.' by defailt

    if(typeof delimitter !== 'string') { delimitter = '.'; } // must be a string

    var finalObj = {};

    for (var key in obj) { // iterate over all keys
        if (!obj.hasOwnProperty(key)){ 
            continue;
        }

        if ((typeof obj[key]) === 'object') { 
            // if it's an object, flatten it recursively
            var flatObject = flatten(obj[key]);

            for (var innerKey in flatObject) {
                if (!flatObject.hasOwnProperty(innerKey)){ 
                    continue;
                }
                finalObj[key + delimitter + innerKey] = flatObject[innerKey];
            }

        } else {
            finalObj[key] = obj[key];

        }
    }

    return finalObj;
}
module.exports.flatten = flatten;
