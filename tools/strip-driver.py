from argparse import ArgumentParser
from neopixel import Adafruit_NeoPixel
from neopixel import ws
from time import sleep

import logging

# We are sophisticated.
strip = None
logger = logging.getLogger()
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
logger.addHandler(ch)

def parseError(msg, line=None):
  if line == None and msg == None:
    logger.exception("Parse error.")
  else:
    logger.exception("Parse error: %s %s", str(msg), str(line))
  exit(-1)

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
    if line == '' or line[0] == '#':
      continue
    commandAndArgs = line.split(' ')
    command = commandAndArgs.pop(0)
    arguments = [int(arg) for arg in commandAndArgs]
    if command == "":
      # Blank line or comment
      continue
    if command =="SET_LEDS":
      # Execute the line. This blocks until the LED strip is show()n.
      runSetLedsCommand(arguments)
    elif command =="SET_SINGLE_LED":
      runSetSingleLedCommand(arguments)
    elif command =="SET_LEDS_INDEXED":
      runSetLedsIndexedCommand(arguments)
    elif command =="SET_LEDS_INDEXED_BACKGROUND":
      runSetLedsIndexedBackgroundCommand(arguments)
    elif command =="DELAY":
      runDelayCommand(arguments[0])
    else:
      parseError("Unknown command", line)

def assertValidIndex(index):
  if index >= 0 and index < strip.numPixels():
    return index
  parseError("Got invalid index", index)

def assertValidColor(color):
  if color > 16777215 or color < 0:
    parseError("Got invalid color", color)
  return color

def runSetSingleLedCommand(pixelValue):
  strip.setPixelColor(
      assertValidIndex(pixelValue[0]), assertValidColor(pixelValue[1]))
  strip.show()

def runSetLedsIndexedCommand(data):
  for index, color in zip(*[iter(data)] * 2):
    strip.setPixelColor(assertValidIndex(index), assertValidColor(color))
  strip.show()

def runSetLedsIndexedBackgroundCommand(data):
  backgroundColor = assertValidColor(data.pop(0))
  nextIndex = assertValidIndex(data.pop(0))
  nextColor = assertValidColor(data.pop(0))
  for i in range(0, strip.numPixels()):
    if nextIndex == i:
      strip.setPixelColor(nextIndex, nextColor)
      if len(data) > 1:
	nextIndex = assertValidIndex(data.pop(0))
	nextColor = assertValidColor(data.pop(0))
    else:
      strip.setPixelColor(i, backgroundColor)
  strip.show()

def runSetLedsCommand(pixels):
  i = 0
  for pixel in pixels:
    strip.setPixelColor(i, assertValidColor(pixel))
    i += 1
    if i > strip.numPixels():
      parseError("SET_LEDS too many LEDS!")
  strip.show()

def runDelayCommand(delayMs):
  if (delayMs < 0):
    parseError("Found negative delay in DELAY")
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
  parser.add_argument("--daemon", type=bool, default=False,
      help="Run in daemon mode, reading <filename> as it changes")
  parser.add_argument("filename", help="The file to run.")
  args = parser.parse_args()
  return args

if __name__ == "__main__":
  args = parseArgs()
  LED_FREQ_HZ = 800000
  LED_DMA = 5
  LED_INVERT = False

  strip = Adafruit_NeoPixel(args.num_leds, args.gpio_pin,
      LED_FREQ_HZ, LED_DMA, LED_INVERT, args.brightness,
      strip_type=ws.WS2811_STRIP_GRB)
  strip.begin()
  if not args.daemon:
    inputFileLines = open(args.filename).read()
    parseAndRunFile(inputFileLines)
  else:
    # TODO(daemon mode)
    # Open pipe file
    pass
