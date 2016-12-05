from argparse import ArgumentParser
from neopixel import Adafruit_NeoPixel
from time import sleep

import logging

# We are sophisticated.
strip = None
logger = logging.getLogger()
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
logger.addHandler(ch)

def parseAndRunFile(fileContentsString):
  """
  Parse a stripfile. This defines a very simple, half-assed language for
  describing strip configurations. There are exactly two commands:
    - SET_LEDS
      takes an array of integers (even though only 24 bits are used) and
      sets each LED in order on the LED strip to that integer value.
    - DELAY
      takes an integer number of milliseconds to sleep.
  Comments begin with hash.
  """
  lines = [line.strip() for line in fileContentsString.split("\n")]
  for line in lines:
    if line == "" or line[0] == "#":
      # Blank line or comment
      continue
    if line.startswith("SET_LEDS"):
      # Execute the line. This blocks until the LED strip is show()n.
      ledStripData = parseSetLedsCommand(line)
      runSetLedsCommand(ledStripData)
    elif line.startswith("DELAY"):
      delayTimeMs = parseDelayCommand(line)
      runDelayCommand(delayTimeMs)
    else:
      logger.error("Error parsing line", line)
      exit(-1)

def parseSetLedsCommand(line):
  if not line.startswith("SET_LEDS "):
    logger.error("Error parsing line")
    exit(-1)
  line = line[8:]
  pixels = []
  for pixelString in line.split(' '):
    if pixelString == "":
      continue
    pixelValue = int(pixelString)
    if pixelValue > 16777215 or pixelValue < 0:
      logger.error("Found non-24 bit number in SET_LEDS")
      exit(-1)
    pixels.append(pixelValue)
  if len(pixels) > strip.numPixels():
    logger.error("Got too many pixels for this strip.")
    exit(-1)
  return pixels

def runSetLedsCommand(pixels):
  logger.debug("Setting LEDs")
  i = 0
  for pixel in pixels:
    strip.setPixelColor(i, pixel)
    i += 1
  strip.show()
  logger.debug("Done")

def parseDelayCommand(line):
  logger.debug("Delaying")
  if not line.startswith("DELAY "):
    logger.error("Error parsing line", line)
    exit(-1)
  line = line[6:]
  delayMs = int(line)
  if (delayMs < 0):
    logger.error("Found negative delay in DELAY")
    exit(-1)
  return delayMs

def runDelayCommand(delayMs):
  sleep(delayMs / 1000)

def parseArgs():
  parser = ArgumentParser(
      description = "Run a program on an LED light strip.")
  parser.add_argument("--gpio_pin", type=int, choices=range(1, 20),
      default=18, help="GPIO pin connected to leds.")
  parser.add_argument("--num_leds", type=int,
      default=600, help="Number of LEDs in the strip.")
  parser.add_argument("--brightness", type=int, choices=range(1, 255),
      default=200, help="Max brightness for the strip.")
  parser.add_argument("filename", help="The file to run.")
  args = parser.parse_args()
  return args

if __name__ == "__main__":
  args = parseArgs()
  LED_FREQ_HZ = 800000
  LED_DMA = 5
  LED_INVERT = False

  strip = Adafruit_NeoPixel(args.num_leds, args.gpio_pin,
      LED_FREQ_HZ, LED_DMA, LED_INVERT, args.brightness)
  strip.begin()
  inputFileLines = open(args.filename).read()
  parseAndRunFile(inputFileLines)
