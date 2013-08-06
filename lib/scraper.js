module.exports = function (db) {
  var equal = require('deep-equal'),
    exec = require('child_process').exec,
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

  //
  // stores in the database
  //

  function db_store(data) {
    db.store(data, function (err, result) {
      //
      // go to next
      //
      k = k + 1;
      athlete_exec(k, get_athlete);
    });
  }

  function athlete_exec(k, get_athlete) {
    exec('./bin/athlete ' + k, function (error, stdout, stderr) {
      //
      // errors return to continuation
      //
      if (error || stderr) {
        return get_athlete(error || stderr);
      }

      //
      // parse the athlete
      //
      stdout = JSON.parse(stdout);
      Object.keys(stdout).forEach(function (k) {
        var v = stdout[k];
        if (typeof v === 'string' || typeof v === 'number') {
          console.log(k.toString(), '=', v);
        }
      });

      //
      // return the athlete
      //
      return get_athlete(null, stdout);
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
      athlete_exec(k, get_athlete);
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

      athlete_exec(k, get_athlete);
      return;
    }

    data.last_modified = (new Date())
      .toISOString();

    db.get(data.id, function (err, dbdata) {
      //
      // not found
      //
      if (err) {
        data.created = (new Date())
          .toISOString();
        return db_store(data);
      }
      //
      // compare data from couchdb to data we have
      //
      if (equal(dbdata, data)) {
        //
        // nothing change
        //
        k = k + 1;
        athlete_exec(k, get_athlete);
      } else {
        return db_store(data);
      }
    });
  }

  athlete_exec(k, get_athlete);
};
