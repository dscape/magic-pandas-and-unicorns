var express = require('express'),
  qs = require('querystring'),
  app = express(),
  db = require('./lib/db')(),
  scraper = require('./lib/scraper');

//
// start scraping
//
scraper(db);

app.use(express.methodOverride());

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.send(200);
  } else {
    next();
  }
});

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

app.get('/search', function (req, res) {
  db.range(req.query, function (err, results) {
    if (err) {
      return res.json(500, {
        error: 'Bad search'
      });
    }
    res.json(200, (results || []));
  });
});

//
// /u17/f/60
//
app.get('/:age_group/:gender/:distance', function (req, res) {
  db.range(req.params, function (err, results) {
    if (err) {
      return res.json(500, {
        error: 'Bad search'
      });
    }
    res.json(200, (results || []));
  });
});

//
// /u17/f/60/2009
//
app.get('/:age_group/:gender/:distance/:year', function (req, res) {
  db.range(req.params, function (err, results) {
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
