var transform = require('./');
var fs = require('fs');

console.log(require('util').inspect(transform(require('./packages').packages), { depth: null, colors: false }));

console.log();
console.log();
console.log('length', transform(require('./packages').packages).length);