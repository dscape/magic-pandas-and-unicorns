var async = require('async'),
  levelup = require('levelup'),
  mergesorted = require('mergesorted'),
  parentchild = require('parentchild'),
  rangebound = require('rangebound'),
  leveldb = levelup('./leveldb', {
    encoding: 'json'
  }),
  idx = require('dscape-mind-explosion-database')('./idx');

module.exports = function () {

  function range(params, cb) {
    var distance_year = null,
      docs_cache = {};

    //
    // these are treated differently as they are a composed index
    //
    if (params.distance) {
      if (params.year) {
        var tyear = rangebound(params.year);
        distance_year = [[params.distance, tyear.start], [params.distance, tyear.end]];
      } else {
        var tdistance = typed(params.distance);
        distance_year = [[tdistance.start], [tdistance.end]];
      }
    }

    delete params.distance;
    delete params.year;

    async.reduce(Object.keys(params), null, function (memo, key, next) {
        var value = rangebound(params[key]);

        idx.query([key, value.start], [key, value.end], function (e, results) {
          if (e) {
            return next(e);
          }

          //
          // get the values
          //
          var y = results.map(function (elem) {
            docs_cache[elem.value.id] = elem.value;
            return elem.value.id;
          });

          //
          // initialize
          //
          if (!memo) {
            memo = y;
          }

          //
          // merge
          //
          else {
            memo = mergesorted(y, memo);
          }
          return next(null, memo);
        });
      },
      function (err, docs) {
        //
        // check for distance year if needed
        //
        if (!err && distance_year) {
          idx.query(distance_year[0], distance_year[1], function (e, results) {
            if (e) {
              return next(e);
            }
            //
            // get the values
            //
            var y = results.map(function (elem) {
              docs_cache[elem.value.id] = elem.value;
              return elem.value.id;
            });

            console.log(distance_year, y);


            var merged = mergesorted(y, docs);

            return cb(e, merged);
          });
        } else {
          return cb(err, docs);
        }
      });
  }

  function store(athlete, cont) {
    async.series([
    //
    // store the document itself
    //
    function store_doc(callback) {
        leveldb.put(athlete.id, athlete, function (err) {
          callback();
        });
    },
    //
    // indexer for `child`, `value`, and `inarray`
    //
    // e.g.
    //
    // {a: {b: 'foo'}, c: ['a', 'b']}
    //
    // ['child', undefined, 'a'],
    // ['child', 'a', 'b'],
    // ['value', 'b', 'foo'],
    // ['child', undefined, 'c'],
    // ['inarray', 'c', 'a'],
    // ['inarray', 'c', 'b']
    //
    function pv_indexer(callback) {
        async.each(parentchild(athlete), function (idxspec, next) {
          console.log(idxspec, +athlete.id);
          idx.put(idxspec, +athlete.id);
          next();
        }, callback);
    }], cont);
  }

  return {
    range: range,
    store: store,
    get: function (id, cb) {
      leveldb.get(id, cb);
    }
  };
};
