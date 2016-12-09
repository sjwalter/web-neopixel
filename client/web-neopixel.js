/**
 * TODO(sjwalter): Clean this up, make it readable, and make it actually configurable.
 * Web neopixel interface.
 */
function WebNeopixel(baseUrl, maxQps) {
  this.baseUrl_ = baseUrl || '/strips/';
  this.maxQps_ = maxQps || 10;
  this.minDelayBetweenCallsMs_ = 1 / this.maxQps_ * 1000;

  /**
   * Timestamp of most-recent request, just before sending. Used to implement
   * really hacky ratelimiting, because if you hit the endpoint too often it
   * crashes the GPIO pin somehow.
   * @private <number>
  */
  this.lastCallTimestampMs_ = 0;

  /**
   * Configuration of the strip under control.
   * @private <Object>
   */
  this.stripData_ = null;
}


/**
 * Initialize the library. Fetch strip data.
 * @param <Function> cb Callback for completion.
 * @param <Function> err Errback.
 */
WebNeopixel.prototype.initialize = function(cb, err) {
  jQuery.get(this.baseUrl_, (resp) => {
    // TODO(sjwalter): Fix this for when we support multiple strips.
    this.stripData_ = resp[0];
    this.setLedsUrl_ = resp[0].stripUrl + 'set-pixels';
    this.numLeds_ = resp[0].numLeds;
    cb();
  }, 'json');
};


/**
 * Make a request to the API server.
 * @param {string} url The url.
 * @param {object} data The data for the request.
 */
WebNeopixel.prototype.makeRequest_ = function(url, data) {
  var now = Date.now();
  if (now - this.lastCallTimestampMs_ > this.minDelayBetweenCallsMs_) {
    this.lastCallTimestampMs_ = now;
    console.log('Making query');
    jQuery.ajax({
      contentType: 'application/json',
      dataType: 'json',
      data: typeof data == 'string' ? data : JSON.stringify(data),
      type: 'POST',
      url: url
    });
  } else {
    console.log('Skipping query (out of capacity)');
  }
};


/**
 * Set a single pixel color.
 */
WebNeopixel.prototype.setLedColor = function(index, color) {
  color = WebNeopixel.normalizeColor(color);
  this.makeRequest_(this.setLedsUrl_, {
    mode: 'single',
    pixelData: [index, color]
  });
};


/**
 * Set some pixels. If a pixel's index is not present, then the color for that
 * pixel is left unchanged, unless background is provided.
 * @param {Array.<number>} pixelData The pixeldata to set.
 * @param {number=} background If set, the background color for not-present indices.
 */
WebNeopixel.prototype.setLeds = function(pixelData, background) {
  var data = {
    mode: 'indexed',
    pixelData: pixelData
  };
  if (background) {
    data['background'] = background;
  }
  this.makeRequest_(this.setLedsUrl_, data);
};


/**
 * Returns the number of LEDs in the strip.
 * @return <number> The number of leds.
 */
WebNeopixel.getNumLeds = function() {
  return this.numLeds_;
};


/**
 * Fill the strip with a single color.
 */
WebNeopixel.prototype.fill = function(color) {
  color = WebNeopixel.normalizeColor(color);
  var data = {
    mode: 'fill',
    pixelData: [color]
  };
  this.makeRequest_(this.setLedsUrl_, data);
};


/**
 * Clear the entire strip. Just fill(0).
 */
WebNeopixel.prototype.clear = function() {
  return this.fill(0);
};


/**
 * Utility for normalizing colors.
 */
WebNeopixel.normalizeColor = function(color) {
  if (typeof color == 'string') {
    if (color[0] == '#') {
      color = color.substr(1);
    }
    return parseInt(color, 16);
  }
  return color;
};
