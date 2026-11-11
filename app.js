//|-
//|- Customer Console Server
//|-


var express = require('express');
var app = express();
var path="/etc/opt/nyx_ui"
// BASE_PATH lets the console be served under a sub-path (/nyxv3/): the build files carry
// that prefix, so express has to expose them under it. Defaults to the root.
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
