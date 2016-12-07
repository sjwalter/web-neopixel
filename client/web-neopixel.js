/**
 * Web neopixel interface.
 */
function WebNeopixel(baseUrl) {
  this.baseUrl_ = baseUrl || '/strips/1';
  this.setPixelsUrl_ = this.baseUrl_ + '/set-pixels';
}


/**
 * Make a request to the API server.
 * @param {string} url The url.
 * @param {object} data The data for the request.
 */
WebNeopixel.prototype.makeRequest_ = function(url, data) {
  jQuery.ajax({
    contentType: 'application/json',
    dataType: 'json',
    data: typeof data == 'string' ? data : JSON.stringify(data),
    type: 'POST',
    url: url
  });
};


/**
 * Set a single pixel color.
 */
WebNeopixel.prototype.setPixelColor = function(index, color) {
  if (typeof color == 'string') {
    color = parseInt(color, 16);
  }
  this.makeRequest_(this.setPixelsUrl_, {
    mode: 'single',
    pixelData: [index, color]
  });
};


/**
 * Set some pixels. If a pixel's index is not present, then the color for that
 * pixel is left unchanged.
 * @param {Array.<number>} pixelData The pixeldata to set.
 * @param {number} background If set, the background color for not-present indices.
 */
WebNeopixel.prototype.setPixels = function(pixelData, background) {
  var data = {
    mode: 'indexed',
    pixelData: pixelData
  };
  if (background) {
    data['background'] = background;
  }
  this.makeRequest_(this.setPixelsUrl_, data);
};

