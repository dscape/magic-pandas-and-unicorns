var jsdom       = require('jsdom')
  , API         = 'http://www.thepowerof10.info/athletes/profile.aspx'
  ;

//
// returns an easy to use url
//
function formatted_url(athlete_id) {
  return API + '?athleteid=' + athlete_id;
}

//
// gets a time and splits
//
function get_time_struct(time) {
  var where = 'outdoors';
  
  //
  // if its indoors
  //
  if(/.*i/.test(time)) {
    time = time.split('i')[0];
    where = 'indoors';
  }
  
  //
  // return a json string
  //
  return {
    time: time,
    where: where
  };
}

//
// gets and stores information about a specific athlete
//
module.exports = { get: function getAthlete(id, next) {
  //
  // get the data from the official website
  //
  jsdom.env({
    url: formatted_url(id),
    scripts: ["http://code.jquery.com/jquery.js"],
    done: function (errors, window) {
      //
      // restart the script if there are errors
      //
      if(errors) {
        next(errors);
      }
      
      //
      // fixme: i need to be able to detect if the user doesnt exist
      // and go back to user `1`
      //
      
      //
      // get the dom tree
      //
      var $ = window.$;

      var errs = $('span[id=ctl00_cphBody_lblErrorMessage]').text().trim();

      var athlete =
        { id    : id
        , name  : $('h2').text().trim()
        };

      //
      // no such id
      //
      if(errs !== '') {
        athlete.found = false;
      }

      //
      // get the best performances for this athlete
      //
      $('div[id=ctl00_cphBody_pnlBestPerformances] table tr').each(
        function () {

          //
          // one record
          //

          //
          // get all the cells
          //
          var tds = $(this).find('td')
            , first_text = $(tds[0]).text()
            ;
          
          //
          // quick and dirty way of finding if this is something
          // we actually care about
          //
          // digits (one or more), HU, digits (one or more), M or W
          //
          if(!/^\d+(HU\d+(M|W))?$/.test(first_text)) {
            return;
          }

          //
          // for each of this ranges
          //
          // first is personal best
          // 2013, 2012, 2011, 2010, 2009
          //
          var current_evt;
          tds.each(function (i,tr) {
            var time = $(tr).text();
            //
            // creating the structure for the event
            //
            if(i===0) {
              current_evt = time;
              athlete[current_evt] = {};
            }

            //
            // pb
            //
            if(i===1 && time !== '') {
              athlete[current_evt].pb = get_time_struct(time);
            }

            //
            // 2013
            //
            if(i===2 && time !== '') {
              athlete[current_evt]["2013"] = get_time_struct(time);
            }
            
            //
            // 2012
            //
            if(i===3 && time !== '') {
              athlete[current_evt]["2012"] = get_time_struct(time);
            }
            
            //
            // 2011
            //
            if(i===4 && time !== '') {
              athlete[current_evt]["2011"] = get_time_struct(time);
            }

            //
            // 2010
            //
            if(i===5 && time !== '') {
              athlete[current_evt]["2010"] = get_time_struct(time);
            }

          });
        });
        next(null, athlete);
    }
  });
  }
};