//|-
//|- Customer Console Server
//|-


var http = require('http');


var express = require('express');
var app = express();
var path="/etc/opt/nyx_ui"
console.log("Path:"+path)
app.use(express.static(path));


//************** HTTP *************

var server = app.listen(7654, function () {

  var host = server.address().address
  host = '0.0.0.0'
  var port = server.address().port

  console.log("Front Server app listening at http://%s:%s", host, port)

})


console.log("Bye bye")
