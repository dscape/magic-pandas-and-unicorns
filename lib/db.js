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

  //
  // perform a query
  //
  function query(params, cb) {
    var docs_cache = {};

    //
    // destruct a list of parameters from the http app
    //
    // e.g.
    // country: 'England'
    // gender: 'Female'
    //
    async.reduce(Object.keys(params), null, function (memo, key, next) {
        //
        // make upper and lower bounds for the value
        //
        var value = rangebound(params[key]);

        //
        // to do a proper range query in this api
        // you need to have a value and for that key
        // to be the child of root
        //
        // e.g.
        // {a: 'foo', b: {c: 'bar'}}
        //
        // a=foo (yes)
        // c=bar (no)
        //
        idx.query(['value', key, value.start], ['value', key, value.end],
          function (e, r1) {
            if (e) {
              return next(e);
            }

            //
            // get the ids of the docs that match
            //
            var m = r1.reduce(function (memo2, elem) {
              //
              // cache the doc, useful for the response
              //
              docs_cache[elem.value.id] = elem.value;

              //
              // if we can get the element from the root
              // this is valid
              //
              if (elem.value[key]) {
                memo2.push(elem.value.id);
              }
              return memo2;
            }, []);

            //
            // initialize
            //
            if (!memo) {
              memo = m;
            }
            //
            // merge
            //
            else {
              memo = mergesorted(m, memo);
            }
            return next(null, memo);
          });
      },
      function (err, union) {
        //
        // replace the ids with actual documents from cache
        //
        var docs = union.map(function (id) {
          return docs_cache[id];
        });
        //
        // return documents
        //
        return cb(err, docs);
      });
  }

  function store(athlete, cont) {
    async.series([
    //
    // store the document itself
    //
    function store_doc(callback) {
        console.log(athlete.id, athlete.name);
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
    function base_indexer(callback) {
        async.each(parentchild(athlete), function (idxspec, next) {
          idxspec.push(+athlete.id);
          idx.replace(idxspec, athlete);
          next();
        }, callback);
    }], cont);
  }

  return {
    query: query,
    store: store,
    get: function (id, cb) {
      leveldb.get(id, cb);
    }
  };
};
