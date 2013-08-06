var express = require('express'),
  qs = require('querystring'),
  app = express(),
  db = require('./lib/db')(),
  scraper = require('./lib/scraper');

//
// start scraping
//
scraper(db);
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
//
// investigate levelup (documentation) to find how to support this query
// give it back to the users
//
app.get('/:agegroup/:sex/:distance', function (req, res) {});
app.listen(process.env.PORT || 3000);
console.log('working in 3000');
