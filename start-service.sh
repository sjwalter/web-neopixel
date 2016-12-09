#!/bin/bash

echo Starting strip-driver daemon...
python tools/strip-driver.py --num_leds 1200 --daemon true /tmp/web-neopixel.sock &

echo Starting web API FE...
node web-neopixel-server.js 
