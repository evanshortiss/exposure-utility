export type ISO = string
export type ShutterSpeed = string
export type Aperture = string
export type ExposureTriangleEntry = ISO | Aperture | ShutterSpeed

/**
 * Enum that contains valid values for exposure increment parameters
 */
export enum ExposureIncrements {
  Thirds = '⅓',
  Halves = '½',
  Full = 'Full'
}

export enum ExposurePropertyNames {
  ISO = 'ISO',
  Aperture = 'aperture',
  Shutter = 'shutter'
}

/**
 * Container for a set of exposure triangle variables
 */
export interface ExposureTriangleValues {
  iso: ISO
  aperture: Aperture
  shutter: ShutterSpeed
}

/**
 * Container for ISO, aperture, or shutter speed value lists.
 * Each list contains the values for the given increment value.
 */
export interface ExposureTriangleIncrements {
  [ExposureIncrements.Thirds]: ExposureTriangleEntry[]
  [ExposureIncrements.Halves]: ExposureTriangleEntry[]
  [ExposureIncrements.Full]: ExposureTriangleEntry[]
}

export interface ISOs extends ExposureTriangleIncrements {
  [ExposureIncrements.Thirds]: ISO[]
  [ExposureIncrements.Halves]: ISO[]
  [ExposureIncrements.Full]: ISO[]
}

export interface ShutterSpeeds extends ExposureTriangleIncrements {
  [ExposureIncrements.Thirds]: ShutterSpeed[]
  [ExposureIncrements.Halves]: ShutterSpeed[]
  [ExposureIncrements.Full]: ShutterSpeed[]
}

export interface Apertures extends ExposureTriangleIncrements {
  [ExposureIncrements.Thirds]: Aperture[]
  [ExposureIncrements.Halves]: Aperture[]
  [ExposureIncrements.Full]: Aperture[]
}

/**
 * This error will be thrown by calculateNewShutterFromBaseExposure etc. when
 * it's not possible to calculate new values without resulting in overexposure.
 */
export class OverexposedError extends Error {
  constructor(
    requiredIdx: number,
    values: ExposureTriangleEntry[],
    increments: ExposureIncrements
  ) {
    const msg = `The given parameters will result in an overexposed image. Using a value of ${
      values[values.length - 1]
    } will still result in overexposure by ${requiredIdx -
      values.length -
      1} ${increments} stops.`

    super(msg)
    this.name = 'OverexposedError'
    Object.setPrototypeOf(this, OverexposedError.prototype)
  }
}

/**
 * This error will be thrown by calculateNewShutterFromBaseExposure etc. when
 * it's not possible to calculate new values without resulting in underexposure.
 */
export class UnderexposedError extends Error {
  constructor(
    requiredIdx: number,
    baseIdx: number,
    values: ExposureTriangleEntry[],
    increments: ExposureIncrements
  ) {
    const msg = `The given parameters will result in an underexposed image. Using a value of ${
      values[0]
    } will still result in underexposure by ${Math.abs(
      baseIdx - requiredIdx
    )} ${increments} stops.`

    super(msg)
    this.name = 'UnderexposedError'
    // https://stackoverflow.com/questions/41102060/typescript-extending-error-class
    Object.setPrototypeOf(this, UnderexposedError.prototype)
  }
}

/**
 * Returns an exposure calculator instance that uses the specified exposure
 * increments in calculations
 */
export class ExposureCalculator {
  constructor (public increments: ExposureIncrements) {}

  /**
   * Returns the value required for an exposure calculation, or an error
   * describing why the exposure will be underexposed or overexposed.
   * @param values
   * @param baseIdx
   * @param idx
   */
  private pluckVariableFromValues(
    values: ExposureTriangleEntry[],
    baseIdx: number,
    idx: number
  ) {
    if (idx > values.length - 1) {
      throw new OverexposedError(idx, values, this.increments)
    } else if (idx < 0) {
      throw new UnderexposedError(idx, baseIdx, values, this.increments)
    } else {
      return values[idx]
    }
  }

  /**
   * Returns the exposure increments this calculator is using.
   */
  getIncrements() {
    return this.increments
  }

  /**
   * Returns an Array shutter values for the given increments this calculator
   * is using.
   */
  getShutterSpeeds() {
    return getShutterSpeeds(this.increments)
  }

  /**
   * Returns an Array of aperture values for the given increments this
   * calculator is using.
   */
  getApertures() {
    return getApertures(this.increments)
  }

  /**
   * Returns an Array of ISO values for the given increments this calculator
   * is using.
   */
  getIsos() {
    return getIsos(this.increments)
  }

  /**
   * Given a base exposure and a desired aperture and ISO for a new exposure
   * calculate the necessary shutter speed to cretae a new balanced exposure.
   *
   * This function can return either a string which will be the new shutter
   * speed, e.g "1/15" or a number of seconds
   *
   * ```ts
   *  const shutter = calculator.calculateNewShutterFromBaseExposure(
   *    {
   *      iso: '1600',
   *      aperture: 'f/2.8',
   *      shutter: '1/15'
   *    },
   *    {
   *      iso: '200',
   *      aperture: 'f/11'
   *    }
   *  )
   *
   *  if (typeof shutter === 'number') {
   *    // This exposure is greater than the typical camera maximum of 30
   *    // seconds, AKA the '30"' setting on most camreas.
   *  }
   * ```
   *
   * @param baseExposureSettings
   * @param aperture
   * @param iso
   */
  calculateNewShutterFromBaseExposure(
    baseExposureSettings: ExposureTriangleValues,
    finalExposureSettings: { aperture: Aperture; iso: ISO }
  ) {
    const values = this.getShutterSpeeds()
    const baseIdx = values.indexOf(baseExposureSettings.shutter)

    // Find the base shutter index then add/remove stops equivalent to the
    // changes in aperture and ISO to compensate
    const offsetInStops =
      baseIdx +
      this.getDifferenceInStops(
        this.getApertures(),
        baseExposureSettings.aperture,
        finalExposureSettings.aperture
      ) +
      this.getDifferenceInStops(
        this.getIsos(),
        baseExposureSettings.iso,
        finalExposureSettings.iso
      )

    if (offsetInStops < 0) {
      return this.calculateLongExposureShutterSpeed(
        offsetInStops,
        baseExposureSettings
      )
    } else {
      return this.pluckVariableFromValues(values, baseIdx, offsetInStops)
    }
  }

  /**
   * Given a base exposure and a desired shutter and ISO for a new exposure
   * calculate the necessary aperture to create a new balanced exposure.
   * @param baseExposureSettings
   * @param shutter
   * @param iso
   */
  calculateNewApertureFromBaseExposure(
    baseExposureSettings: ExposureTriangleValues,
    finalExposureSettings: { shutter: ShutterSpeed; iso: ISO }
  ) {
    const values = this.getApertures()
    const baseIdx = values.indexOf(baseExposureSettings.aperture)
    const offsetInStops =
      baseIdx +
      this.getDifferenceInStops(
        this.getShutterSpeeds(),
        baseExposureSettings.shutter,
        finalExposureSettings.shutter
      ) +
      this.getDifferenceInStops(
        this.getIsos(),
        baseExposureSettings.iso,
        finalExposureSettings.iso
      )

    return this.pluckVariableFromValues(values, baseIdx, offsetInStops)
  }

  /**
   * Given a base exposure and a desired aperture and shutter for a new exposure
   * calculate the necessary ISO speed to create a new balanced exposure.
   * @param baseExposureSettings
   * @param shutter
   * @param aperture
   */
  calculateNewIsoFromBaseExposure(
    baseExposureSettings: ExposureTriangleValues,
    finalExposureSettings: { aperture: Aperture; shutter: ShutterSpeed }
  ) {
    const values = this.getIsos()
    const baseIdx = values.indexOf(baseExposureSettings.iso)
    const offsetInStops =
      baseIdx +
      this.getDifferenceInStops(
        this.getShutterSpeeds(),
        baseExposureSettings.shutter,
        finalExposureSettings.shutter
      ) +
      this.getDifferenceInStops(
        this.getApertures(),
        baseExposureSettings.aperture,
        finalExposureSettings.aperture
      )

    return this.pluckVariableFromValues(values, baseIdx, offsetInStops)
  }

  /**
   * Given a list of exposure values, e.g shutter speeds find the number of
   * stops between two values in the list. This could be full, half, or third
   * stops depending on the increment value passed to the constructor of this
   * instance.
   *
   * The returned value can be positive, negative, or zero.
   *  * Zero means the same value is used for base and actual.
   *  * A positive value means more the final value is letting in more light.
   *  * A negative value means less light is being let in for the final exposure.
   *
   * @param values
   * @param base
   * @param actual
   */
  getDifferenceInStops(
    values: ExposureTriangleEntry[],
    base: ExposureTriangleEntry,
    final: ExposureTriangleEntry
  ) {
    const baseIdx = values.indexOf(base) // 15 seonds (idx 1 at full stops)
    const actualIdx = values.indexOf(final) // 30 seconds (idx 0 at full stops)

    // 1 - 0 = 1 meaning we're letting in 1 stop more light in the final exposure
    return baseIdx - actualIdx
  }

  /**
   * Calculate a shutter speed greater than the typical 30 second maximum.
   * @param offsetInStops
   * @param baseExposureSettings
   */
  private calculateLongExposureShutterSpeed(
    offsetInStops: number,
    baseExposureSettings: ExposureTriangleValues
  ) {
    const stops = getIncrementAsNumber(this.increments)
    const factor = Math.pow(2, stops)
    const baseShutterVal = baseExposureSettings.shutter
    const baseShutterIdx = this
      .getShutterSpeeds()
      .indexOf(baseShutterVal)

    // How many stops below 30 seconds are we...let's find out
    const offset = Math.abs(baseShutterIdx - offsetInStops)

    // Work out the new number of seconds we'll need to shoot for
    const seconds = Math.round(
      Math.pow(factor, offset) * shutterStringToDecimal(baseShutterVal)
    )

    return seconds
  }
}

/**
 * Converts an exposure increment enum to a float
 * @param increment
 */
function getIncrementAsNumber(increment: ExposureIncrements) {
  if (increment === ExposureIncrements.Full) {
    return 1
  } else if (increment === ExposureIncrements.Thirds) {
    return 1 / 3
  } else {
    return 1 / 2
  }
}

/**
 * Converts a shutter speed into a number representing a value in seconds
 * @param shutter
 */
function shutterStringToDecimal(shutter: ShutterSpeed) {
  // Variants of notation
  // 2"
  // 3.2
  // 0"3
  // 1/4

  if (shutter.indexOf('"') === shutter.length - 1) {
    // Example 2" -> 2
    return parseInt(shutter)
  } else if (shutter.indexOf('"') === (shutter.length - 1) / 2) {
    // Example 0"3 -> 1/3
    return 1 / parseInt(shutter[shutter.length - 1])
  } else if (shutter.indexOf('/') === 1) {
    // Example 1/4 -> 0.25
    return 1 / parseInt(shutter.split('/')[1])
  } else {
    // Example 3.2
    return parseFloat(shutter)
  }
}

/**
 * Returns a list of shutter speeds.
 *
 * If the increments aren't specified then 1/3 increments are returned, e.g
 * ```
 *  [f/2', 'f/2.2', 'f/2.5', 'f/2.8', 'f/3.2', 'f/3.6']
 * ```
 * @param increments
 */
export function getShutterSpeeds(increments: ExposureIncrements) {
  return shutterValues[increments]
}

/**
 * Returns a list of shutter speeds.
 *
 * If the increments aren't specified then 1/3 increments are returned, e.g
 * ```
 *  ['2.5"', '2"', '1.6"', '1.3"', '1"']
 * ```
 * @param increments
 */
export function getApertures(increments: ExposureIncrements) {
  return apertureValues[increments]
}

/**
 * Returns a list of ISO sensitivities.
 *
 * If the increments aren't specified then 1/3 increments are returned, e.g
 * ```
 *  [400', '320', '250', '200', '160', '125', '100']
 * ```
 * @param increments
 */
export function getIsos(increments: ExposureIncrements) {
  return isoValues[increments]
}

export const shutterValues: ShutterSpeeds = {
  [ExposureIncrements.Thirds]: [
    '30"',
    '25"',
    '20"',
    '15"',
    '13"',
    '10"',
    '8"',
    '6"',
    '5"',
    '4"',
    '3.2"',
    '2.5"',
    '2"',
    '1.6"',
    '1.3"',
    '1"',
    '0"8',
    '0"6',
    '0"5',
    '0"4',
    '0"3',
    '1/4',
    '1/5',
    '1/6',
    '1/8',
    '1/10',
    '1/13',
    '1/15',
    '1/20',
    '1/25',
    '1/30',
    '1/40',
    '1/50',
    '1/60',
    '1/80',
    '1/100',
    '1/125',
    '1/160',
    '1/200',
    '1/250',
    '1/320',
    '1/400',
    '1/500',
    '1/640',
    '1/800',
    '1/1000',
    '1/1250',
    '1/1600',
    '1/2000',
    '1/2500',
    '1/3200',
    '1/4000',
    '1/5000',
    '1/6400',
    '1/8000'
  ],
  [ExposureIncrements.Halves]: [
    '30"',
    '20"',
    '15"',
    '10"',
    '8"',
    '6"',
    '4"',
    '3"',
    '2"',
    '1.5"',
    '1"',
    '0"7',
    '0"5',
    '0"3',
    '1/4',
    '1/6',
    '1/8',
    '1/10',
    '1/15',
    '1/20',
    '1/30',
    '1/45',
    '1/60',
    '1/90',
    '1/125',
    '1/180',
    '1/250',
    '1/350',
    '1/500',
    '1/750',
    '1/1000',
    '1/1500',
    '1/2000',
    '1/3000',
    '1/4000',
    '1/6000',
    '1/8000'
  ],
  [ExposureIncrements.Full]: [
    '30"',
    '15"',
    '8"',
    '4"',
    '2"',
    '1"',
    '0"5',
    '1/4',
    '1/8',
    '1/15',
    '1/30',
    '1/60',
    '1/125',
    '1/250',
    '1/500',
    '1/1000',
    '1/2000',
    '1/4000',
    '1/8000'
  ]
}

export const isoValues: ISOs = {
  [ExposureIncrements.Thirds]: [
    '25600',
    '20000',
    '16000',
    '12800',
    '10000',
    '8000',
    '6400',
    '5000',
    '4000',
    '3200',
    '2500',
    '2000',
    '1600',
    '1250',
    '1000',
    '800',
    '640',
    '500',
    '400',
    '320',
    '250',
    '200',
    '160',
    '125',
    '100',
    '70',
    '50'
  ],
  [ExposureIncrements.Halves]: [
    '25600',
    '17600',
    '12800',
    '8800',
    '6400',
    '4400',
    '3600',
    '3200',
    '2200',
    '1600',
    '1100',
    '800',
    '560',
    '400',
    '280',
    '200',
    '140',
    '100',
    '70',
    '50'
  ],
  [ExposureIncrements.Full]: [
    '25600',
    '12800',
    '6400',
    '3200',
    '1600',
    '800',
    '400',
    '200',
    '100',
    '50'
  ]
}

export const apertureValues: Apertures = {
  [ExposureIncrements.Thirds]: [
    'f/1',
    'f/1.1',
    'f/1.3',
    'f/1.4',
    'f/1.6',
    'f/1.8',
    'f/2',
    'f/2.2',
    'f/2.5',
    'f/2.8',
    'f/3.2',
    'f/3.6',
    'f/4',
    'f/4.5',
    'f/5',
    'f/5.6',
    'f/6.3',
    'f/7.1',
    'f/8',
    'f/9',
    'f/10.1',
    'f/11',
    'f/12.7',
    'f/14.3',
    'f/16',
    'f/18',
    'f/20.2',
    'f/22',
    'f/25.4',
    'f/28.5',
    'f/32',
    'f/36',
    'f/40.3',
    'f/45',
    'f/50.8',
    'f/57',
    'f/64'
  ],
  [ExposureIncrements.Halves]: [
    'f/1',
    'f/1.2',
    'f/1.4',
    'f/2',
    'f/2.4',
    'f/2.8',
    'f/3.4',
    'f/4',
    'f/4.8',
    'f/5.6',
    'f/6.7',
    'f/8',
    'f/9.5',
    'f/11',
    'f/13.5',
    'f/16',
    'f/19',
    'f/22',
    'f/26.9',
    'f/32',
    'f/38.1',
    'f/45',
    'f/53.8',
    'f/64'
  ],
  [ExposureIncrements.Full]: [
    'f/1',
    'f/1.4',
    'f/2',
    'f/2.8',
    'f/4',
    'f/5.6',
    'f/8',
    'f/11',
    'f/16',
    'f/22',
    'f/32',
    'f/45',
    'f/64'
  ]
}
