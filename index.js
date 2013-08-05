var athletes       = require('./athletes')
  , levelup        = require('levelup')
  , equal          = require('deep-equal')
  , express        = require('express')
  , db             = levelup('./leveldb', {encoding: 'json'})
  , app            = express()
  //
  // START=4 node index.js
  //
  , k              = +(process.env.START || 1)
  , how_many_errors_to_stop = 10
  , current_errors = 0
  ;

function get_athlete(err, data) {
  //
  // ignore errors
  //
  if(err) {
    console.log('err: ' + err.message);
  }

  //
  // we found everyone
  // restart
  //
  if(data.found === false) {
    current_errors++;

    k++;

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
      //
      // ALERT!
      //
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

athletes.get(k, get_athlete);

app.get('/athletes/:id', function(req, res) {
  db.get(req.params.id, function (err, athlete) {
    if(err) {
      //
      // not found
      //
      res.json(404, { error: 'Athlete not found' });
      return;
    }
    res.json(200, athlete);
  });
});

app.get('/ranking/:id', function(req, res) {
  //
  // 60 meters
  //
  // investigate levelup (documentation) to find how to support this query
  // give it back to the users
  //
});

app.listen(process.env.PORT || 3000);

console.log('working in 3000');