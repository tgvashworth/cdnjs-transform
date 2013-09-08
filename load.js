var transform = require('./');
var fs = require('fs');
var request = require('request');

request
  .get({
    url: 'https://cdnjs.com/packages.json',
    json:true
  }, function (err, res, body) {
    fs.writeFileSync('./packages.json', JSON.stringify(body, null, 2));
  });