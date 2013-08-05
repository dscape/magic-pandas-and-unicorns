var levelup        = require('levelup')
  , db             = levelup('./poweroften', {encoding: 'json'})
  , id             = process.argv[2]
  ;

db.get(id, function (err, data) {
  if(err) {
    console.log('err: ' + id + ' not found');
    return;
  }
  console.log(data);
})