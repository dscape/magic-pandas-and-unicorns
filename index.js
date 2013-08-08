var express = require('express'),
  qs = require('querystring'),
  app = express(),
  db = require('./lib/db')(),
  scraper = require('./lib/scraper');

//
// start scraping
//
scraper(db);

//
// cors overides
//
app.use(express.methodOverride());
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if ('OPTIONS' == req.method) {
    res.send(200);
  } else {
    next();
  }
});

//
// log each request
//
app.use(function log(req, res, next) {
  console.log(req.method + ' ' + req.url);
  next();
});

//
// gets an athlete by id
//
app.get('/athlete/:id', function (req, res) {
  db.get(req.params.id, function (err, athlete) {
    if (err) {
      //
      // not found
      //
      res.json(404, {
        error: 'athlete not found'
      });
      return;
    }
    //
    // return from database
    //
    res.json(200, athlete);
  });
});

//
// Simple composable queries
// only for top level properties
//
// samples:
//
// curl localhost:3000/query?gender=Female\&id=1
// curl localhost:3000/query?gender=Female\&id=30
// curl localhost:3000/query?where=outdoors
// curl localhost:3000/query?id=1
//
app.get('/query', function (req, res) {
  db.query(req.query, function (err, results) {
    if (err) {
      return res.json(500, {
        error: 'Bad search'
      });
    }
    res.json(200, (results || []));
  });
});

app.listen(process.env.PORT || 3000);
console.log('working in 3000');
