var config = require('./config');
var childProcess = require('child_process');
var express = require('express');
var fs = require('fs');

var app = express();
app.use(express.bodyParser());

function WebNeopixel() {
  this.programIsRunning = false;
  this.childProcess = null;
  this.tempDirPath = null;
  this.tempProgramIndex = 0;
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
  console.log(req);
  var mode = req.body.mode;
  console.log('mode is ' + mode)
  var program = '';
  if (mode == 'single') {
    program = 'SET_SINGLE_LED ' + req.body.pixelData;
  } else if (mode == 'all') {
    program = 'SET_LEDS ' + req.body.pixelData.join(' ');
  } else if (mode == 'indexed') {
    if (req.params.background) {
      program = 'SET_LEDS_INDEXED_BACKGROUND ' + req.body.background + 
	  ' ' + req.body.pixelData.join(' ');
    } else {
      program = 'SET_LEDS_INDEXED ' + req.body.pixelData.join(' ');
    }
  } else {
    res.status(405).send({error: 'Invalid mode'});
  }

  this.runProgram(program);
  res.send();
};


WebNeopixel.prototype.runProgram = function(program) {
  if (this.childProcess) {
    this.childProcess.kill();
  }
  var programPath = this.writeProgramToTemporaryFile(program);
  this.childProcess =
      childProcess.exec('./tools/strip-driver.py ' + programPath);
};


WebNeopixel.prototype.writeProgramToTemporaryFile = function(program) {
  if (!this.tempDirPath) {
    this.tempDirPath = fs.mkdtempSync('strip-programs');
  }
  var newFilePath = this.tempDirPath +
      'web-neopixel-' + this.tempProgramIndex + '.stripfile';
  this.tempProgramIndex += 1;
  fs.writeFileSync(newFilePath, program);
  return newFilePath;
};

var webneo = new WebNeopixel();
app.get('/strips', function(req, res) {
  console.log('List strips.');
});
app.post('/strips/:index/set-pixels', webneo.handleSetPixels.bind(webneo));

app.listen(config.httpPort, function() {
  console.log('Lights camera action on ' + config.httpPort);
});
