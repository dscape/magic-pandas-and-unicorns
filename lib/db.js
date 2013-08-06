var async = require('async'),
  levelup = require('levelup'),
  leveldb = levelup('./leveldb', {
    encoding: 'json'
  }),
  idx = require('dscape-mind-explosion-database')('./idx')
  ;

function merge_sort(a, b) {
  var result = [];

  while( a.length > 0 && b.length > 0 ) {
     if (a[0] < b[0] ){
       a.shift();
     }
     else if (a[0] > b[0] ){
       b.shift();
     }
     else /* they're equal */
     {
       result.push(a.shift());
       b.shift();
     }
  }

  return result;
}

function typed(value) {
  return isNaN(value) ? {v: value, n: (value+'\ufff0'), type: 'string'} : {v: value, n: value+'\u0000', t: 'number'};
}

module.exports = function() {

  function range(params, cb) {
    async.reduce(Object.keys(params), null, function(memo, key, next) {
      var value = typed(params[key]);

      idx.query([key, value.v], [key, value.n], function(e, results) {
        if (e) {
          return next(e);
        }
        //
        // initialize
        //
        var y = results.map(function (e) { return e.key[2]; });
        if(!memo) {
          memo = y;
        }
        //
        // merge
        //
        else {
          memo = merge_sort(y, memo);
        }
        return next(null, memo);
      });
    },
    function (err, docs) {
      //
      // return actual docs
      //
      return cb(err, docs);
    });
  }

  function store(athlete, next) {
    async.series([
    //
    // store the document itself
    //
    function store_doc(callback) {
      leveldb.put(athlete.id, athlete, function(err) {
        callback();
      });
    },
    //
    //
    //
    function simple_indexer(callback) {
      async.each(Object.keys(athlete), function (key, next) {
        if(typeof athlete[key] === 'string' || typeof athlete[key] === 'number') {
          return idx.replace([key, athlete[key], +athlete.id], athlete.uuid, next);
        }
        next();
      }, callback);
    }
    ], next);
  }

  return {
    range: range,
    store: store,
    get: function (id, cb) {
      leveldb.get(id,cb);
    }
  };
};
