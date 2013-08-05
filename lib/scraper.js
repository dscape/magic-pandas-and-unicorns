var athletes       = require('./athlete')
  , equal          = require('deep-equal')
  , db
  //
  // START=4 node index.js
  //
  , k              = +(process.env.START || 1)
  , current_errors = 0
  , how_many_errors_to_stop = 10
  ;

function get_athlete(err, data) {
  //
  // ignore errors, and go to next
  //
  if(err) {
    console.log('err: ' + err.message);
    current_errors = 0;
    k = k + 1;
    athletes.get(k, get_athlete);
    return;
  }

  //
  // if we found everyone we should restart
  //
  if(data.found === false) {
    current_errors++;

    k++;

    //
    // if n consecutive athletes are not found then
    // we consider the database complete
    //
    if(current_errors === how_many_errors_to_stop) {
      current_errors = 0;
      k = 1;
    }

    athletes.get(k, get_athlete);
    return;
  }

  process.stdout.write(k + ' ');

  //
  // store database
  //
  console.log(data.name);

  data.last_modified = (new Date()).toISOString();

  db.get(data.id, function (err, dbdata) {
    //
    // not found
    //
    if(err) {
      data.created = (new Date()).toISOString();
      db.put(data.id, data, function (err) {
        //
        // go to next
        //
        k = k + 1;
        athletes.get(k, get_athlete);
      });
      return;
    }
    //
    // compare data from couchdb to data we have
    //
    if(equal(dbdata, data)) {
      //
      // nothing change
      //
      k = k + 1;
      athletes.get(k, get_athlete);
    } else {
      db.put(data.id, data, function (err) {
        //
        // go to next
        //
        k = k + 1;
        athletes.get(k, get_athlete);
      });
    }
  });
}

module.exports = function run(leveldb) {
  db = leveldb;
  athletes.get(k, get_athlete);
};