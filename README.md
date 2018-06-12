# exposure-utility

![https://travis-ci.org/evanshortiss/exposure-utility](https://travis-ci.org/evanshortiss/exposure-utility.svg) [![npm version](https://badge.fury.io/js/exposure-utility.svg)](https://badge.fury.io/js/exposure-utility.svg) [![https://coveralls.io/repos/github/evanshortiss/exposure-utility](https://coveralls.io/repos/github/evanshortiss/exposure-utility/badge.svg?branch=master)](https://coveralls.io/github/evanshortiss/exposure-utility?branch=master)
[![TypeScript](https://badges.frapsoft.com/typescript/version/typescript-next.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

This code is a quick TypeScript port of some JavaScript code I had written for
this [Android application](http://evanshortiss.com/development/mobile/2014/05/11/android-application-exposure-calculator.html).

There's nothing particularly scientific or pretty about this module. It uses
predetermined tables and uses offsets to determine exposure settings that will
be familiar to most photographers and camera models as opposed to generated,
but potentially unfamiliar or unsupported values.

The implementation is simple and it won't error out in some areas that it
arguably should, e.g you pass a ⅓ stop value to an instance of
ExposureCalculator that is using full stops.

Enjoy! Feel free to contribute by opening a PR or Issue. Happy snapping  📷 👍

## Usage

* Tested with TypeScipt 2.9

### Node.js & ES5

```js
const Exposure = require('exposure-utility')
```

### TypeScript & ES6
```ts
import * as Exposure from 'exposure-utility'
```

### Example
```ts
// Create an exposure calculator that uses half stop incerments
const calculator = new Exposure.ExposureCalculator(
  Exposure.ExposureIncrements.Halves
)

const shutter = calculator.calculateNewShutterFromBaseExposure(
  // Our base exposure
  {
    iso: '1600',
    aperture: 'f/2.8',
    shutter: '1/4'
  },
  // The parts of our final exposure, minus the shutter since we
  // want that calculated for us
  {
    aperture: 'f/19',
    iso: '200'
  }
)

if (typeof shutter === 'string') {
  // This shutter speed result can be dialed in, e.g 30"
} else {
  // We received a shutter speed as a number of seconds, e.g 91 in this example
  // We need to use bulb mode on most cameras and manually time 91 seconds
}
```

## API

### new ExposureCalculator(increments)
Create an exposure calculator instance. The given instance will operate using
the given increments similar to a camera set to use full, half, or third stops.

```ts
const Exposure = require('exposure-utility')
const calculator = new Exposure.ExposureCalculator(
  Exposure.ExposureIncrements.Thirds
)
```

#### ExposureCalculator.getShutterSpeeds()
Returns all shutter speeds the given calculator supports. Support is determined
by the `increments` argument passed to the constructor for `ExposureCalculator`.

#### ExposureCalculator.getApertures()
Similar to `calculator.getShutterSpeeds()` but returns apertures.

#### ExposureCalculator.getIsos()
Similar to `calculator.getShutterSpeeds()` but returns ISO values.

#### ExposureCalculator.calculateNewShutterFromBaseExposure(base, final)
Given a base exposure and a partial final exposure calculate the necessary
shutter speed component for the `final` exposure.

```js
const base = {
  // Our base or test exposure we used to determine composition and exposure
  iso: '1600',
  aperture: 'f/2.8',
  shutter: '1/4'
}
const final = {
  // Our final exposure settings, minus the shutter since we need that
  // calculated for us to get an equivalent amount of light with our new ISO
  // and aperture value
  aperture: 'f/19',
  iso: '200'
}

// Result will be a number if the resulting shutter speed is greater than 30
// seconds, or a string from ExposureCalculator.getShutterSpeeds() if between
// 1/8000 or 30 seconds
const shutter = calculator.calculateNewShutterFromBaseExposure(
  base, final
)
```

#### ExposureCalculator.calculateNewApertureFromBaseExposure(base, final)
Similar to `calculateNewShutterFromBaseExposure` but instead calculates the
required aperture.

#### ExposureCalculator.calculateNewIsoFromBaseExposure(base, final)
Similar to `calculateNewShutterFromBaseExposure` but instead calculates the
required ISO.

#### ExposureCalculator.getDifferenceInStops(values, base, final)
Determines the stops separating a base value and final value. For example, the
number of stops between two shutter speeds:

```js
const increments = calculator.getIncrements()
const baseShutter = '1/200'
const finalShutter = '1/4'
const validShutters = calculator.getShutterSpeeds()

const stops = calculator.getDifferenceInStops(
  validShutters,
  baseShutter,
  finalShutter
)

console.log(`
  There is a difference of ${stops} ${increments} stops between
  ${baseShutter} and ${finalShutter}
`)

// Prints "There is a difference of 17 ⅓ stops between 1/200 and 1/4"
```

### getApertures(increments)
Similar to `getShutterSpeeds` but for aperture values.

### getIsos(increments)
Similar to `getShutterSpeeds` but for ISO values.


### shutterValues
A constant that contains all various shutter speeds for all stop/increments. It
has the following format:

```js
{
  '⅓': [
    '30"',
    '25"',
    '20"',
    '15"',
    '13"',
    // etc...
    '1/8000'
  ]
  '½': [
    '30"',
    '20"',
    '15"',
    '10"',
    '8"',
    // etc...
    '1/8000'
  ]
  'Full': [
    '30"',
    '15"',
    '8"',
    '4"',
    '2"',
    // etc...
    '1/8000'
  ]
}
```

### apertureValues
Identical structure to `shutterValues`, but instead contains apertures.

### isoValues
Identical structure to `shutterValues`, but instead contains ISOs.
