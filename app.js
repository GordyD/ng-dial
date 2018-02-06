var express = require('express'),
    http = require('http'),
    path = require('path');

var app = module.exports = express();
app.set('port', process.env.PORT || 3000);
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'src')));

// Development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());
}

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
