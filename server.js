const express = require('express');
const path = require('path');
var cors = require('cors');

const app = express();

// Serve only the static files from the dist directory
app.use(express.static(__dirname + '/dist/my-app'));

// CORS config
var corsOptions = {
  'origin': 'https://indoor-plants-nz-assets.s3.ap-southeast-2.amazonaws.com',
  'optionsSuccessStatus': 200,
  'credentials': true,
  'methods': ['GET', 'POST', 'PUT', 'DELETE'],
  'allowedHeaders': ['Content-Type', 'x-access-token', 'Authorization']
};
app.use(cors(corsOptions));

app.get('/*', function(req, res) {
  res.sendFile(path.join(__dirname + '/dist/my-app/index.html'));
});

app.listen(process.env.PORT || 8080);
