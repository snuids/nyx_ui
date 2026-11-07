//|-
//|- Customer Console Server
//|-


var express = require('express');
var app = express();
var path="/etc/opt/nyx_ui"
// BASE_PATH serves the console under a sub-path (/nyxv2/): the build's files carry that prefix,
// so express has to expose them there. Default is the root, which is what the release image uses.
var basePath = process.env.BASE_PATH || '/'
console.log("Path:"+path+" base:"+basePath)
app.use(basePath, express.static(path));


//************** HTTP *************

var server = app.listen(7654, function () {

  var host = server.address().address
  host = '0.0.0.0'
  var port = server.address().port

  console.log("Front Server app listening at http://%s:%s", host, port)

})


console.log("Bye bye")
