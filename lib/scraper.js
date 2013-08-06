var athletes = require('./athlete'),
  equal = require('deep-equal'),
  async = require('async'),
  idx = require('dscape-mind-explosion-database')('./leveldb'),
  db,
  //
  // START=4 node index.js
  //
  k = +(process.env.START || 1),
  //
  // the max amount of not founds we can get
  // before we restart our search
  //
  current_errors = 0,
  how_many_errors_to_stop = 10;

function put_and_index_athlete(athlete) {
  async.series([
  //
  // store the document itself
  //
  function store_doc(callback) {
    db.put(athlete.id, athlete, function(err) {
      callback();
    });
  },
  function simple_indexes(callback) {
    async.each(Object.keys(athlete), function (key, next) {
      if(typeof athlete[key] === 'string' || typeof athlete[key] === 'number') {
        idx.put(['simple', key, athlete.id], athlete[key], next);
      }
    }, callback);
  }
  ], function(err, results) {
    //
    // go to next
    //
    k = k + 1;
    athletes.get(k, get_athlete);
  });
}

function get_athlete(err, data) {
  //
  // ignore errors, and go to next
  //
  if (err) {
    console.log('err: ' + err.message);
    current_errors = 0;
    k = k + 1;
    athletes.get(k, get_athlete);
    return;
  }

  //
  // if we found everyone we should restart
  //
  if (data.found === false) {
    current_errors++;

    k++;

    //
    // if n consecutive athletes are not found then
    // we consider the database complete
    //
    if (current_errors === how_many_errors_to_stop) {
      current_errors = 0;
      k = 1;
    }

    athletes.get(k, get_athlete);
    return;
  }

  data.last_modified = (new Date())
    .toISOString();

  db.get(data.id, function(err, dbdata) {
    //
    // not found
    //
    if (err) {
      data.created = (new Date())
        .toISOString();
      return put_and_index_athlete(data);
    }
    //
    // compare data from couchdb to data we have
    //
    if (equal(dbdata, data)) {
      //
      // nothing change
      //
      k = k + 1;
      athletes.get(k, get_athlete);
    } else {
      return put_and_index_athlete(data);
    }
  });
}

module.exports = function run(leveldb) {
  db = leveldb;
  athletes.get(k, get_athlete);
};
