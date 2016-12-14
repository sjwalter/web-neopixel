var config = require('./config');

var bodyParser = require('body-parser');
var express = require('express');
var fs = require('fs');
var net = require('net');

var app = express();
app.use(bodyParser.json());

function WebNeopixel() {
  this.programIsRunning = false;
  this.webneopixelStream = net.connect(config.socketPath);
  this.recordProgram_ = false;
  this.recordProgramFile_ = null;
}

 /**
  * Set pixels. POST params:
  *   - mode: 'single', 'all', 'indexed'.
      - pixelData: array or int
      - background: int (only used for 'indexed')
  * In single mode, a single 32-bit int is passed, the first 8 is the index
  * and the next 24 bits are the color.
  * In 'all' mode, an array of integers are passed in, each LED in order's color.
  * In 'indexed' mode, an array of integers (32-bit position + color) are passed in.
  * If in indexed mode 'background' is provided, it can be either a 24-bit color or
  * nothing if the unset pixels are to be left unchanged.
  */
WebNeopixel.prototype.handleSetPixels = function(req, res) {
  console.log('handleSetPixels');
  var mode = req.body.mode;
  var program = '';
  if (mode == 'single') {
    program = 'SET_SINGLE_LED ' + req.body.pixelData.join(' ');
  } else if (mode == 'all') {
    program = 'SET_LEDS ' + req.body.pixelData.join(' ');
  } else if (mode == 'indexed') {
    if (req.body.background || req.body.background === 0) {
      program = 'SET_LEDS_INDEXED_BACKGROUND ' + req.body.background + 
	  ' ' + req.body.pixelData.join(' ');
    } else {
      program = 'SET_LEDS_INDEXED ' + req.body.pixelData.join(' ');
    }
  } else if (mode == 'fill') {
    program = 'SET_LEDS_INDEXED_BACKGROUND ' + req.body.pixelData[0] +
	' 0 ' + req.body.pixelData[0];
  } else {
    res.status(405).send({error: 'Invalid mode'});
  }

  program = program + '\n';

  this.runProgram(program);
  res.send();
};


WebNeopixel.prototype.runProgram = function(program) {
  console.log('Running program.');
  this.webneopixelStream.write(program);
};


WebNeopixel.prototype.handleSaveLedLayout = function(req, res) {
  var filename = 'led-layout-' + req.params.index + new Date().toISOString();
  var fullFilePath = config.ledLayoutUploadPath + '/' + filename;
  fs.writeFile(fullFilePath, JSON.stringify(req.body.ledLayout), () => {
    res.send();
  });
};

var webneo = new WebNeopixel();
/**
 * Get the list of strips to interact with. This doesn't really do anything
 * useful right now because there's only ever one strip.
 * TODO(sjwalter): Make useful.
 */
app.get('/strips', function(req, res) {
  res.send([{
    stripUrl: '/strips/' + config.gpioPin + '/',
    gpioPin: config.gpioPin,
    numLeds: config.numLeds
  }]);
});
app.post('/strips/:index/set-pixels', webneo.handleSetPixels.bind(webneo));

app.listen(config.httpPort, function() {
  console.log('Lights camera action on ' + config.httpPort);
});

app.post('/strips/:index/save-led-layout',
    webneo.handleSaveLedLayout.bind(webneo));
