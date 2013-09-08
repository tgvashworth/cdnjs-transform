var transform = require('./');
var fs = require('fs');

console.log(require('util').inspect(transform(require('./packages').packages), { depth: null, colors: false }));