import * as calculations from '../src/exposure-utilities'
import { ExposureIncrements } from '../src/exposure-utilities'

describe('calculations', () => {
  describe('#getExposureCalculator()', () => {
    const calc = new calculations.ExposureCalculator(ExposureIncrements.Thirds)

    it('should return a calculator instance', () => {
      expect(calc).toBeInstanceOf(Object)
    })

    describe('#getShutterSpeeds()', () => {
      it('should return an array', () => {
        expect(calc.getShutterSpeeds()).toBeInstanceOf(Array)
      })
    })

    describe('#getApertures()', () => {
      it('should return an array', () => {
        expect(calc.getApertures()).toBeInstanceOf(Array)
      })
    })

    describe('#getIncrements()', () => {
      it('should return thirds', () => {
        const calc = new calculations.ExposureCalculator(
          ExposureIncrements.Thirds
        )
        expect(calc.getIncrements()).toEqual(
          calculations.ExposureIncrements.Thirds
        )
      })
    })

    describe('#getIsos()', () => {
      it('should return an array', () => {
        expect(calc.getIsos()).toBeInstanceOf(Array)
      })
    })

    describe('#getDifferenceInStops()', () => {
      it('should return 1', () => {
        const offeset = calc.getDifferenceInStops(
          calc.getApertures(),
          calc.getApertures()[1],
          calc.getApertures()[0]
        )

        expect(offeset).toEqual(1)
      })
    })

    describe('#calculateNewApertureFromBaseExposure()', () => {
      it('should return a new aperture in range', () => {
        const aperture = calc.calculateNewApertureFromBaseExposure(
          {
            iso: '200',
            aperture: 'f/2.8',
            shutter: '1/15'
          },
          {
            shutter: '1"',
            iso: '200'
          }
        )

        expect(aperture).toEqual('f/11')
      })

      it('should throw an underexposore error for thirds', () => {
        const calc = new calculations.ExposureCalculator(
          ExposureIncrements.Thirds
        )

        expect(() => {
          calc.calculateNewApertureFromBaseExposure(
            {
              iso: '200',
              aperture: 'f/1',
              shutter: '30"'
            },
            {
              shutter: '30"',
              iso: '70'
            }
          )
        }).toThrow(
          'The given parameters will result in an underexposed image. Using a value of f/1 will still result in underexposure by 4 ⅓ stop increments (1.3 full stop(s))'
        )
      })

      it('should throw an underexposure error for half increments', () => {
        const calc = new calculations.ExposureCalculator(
          ExposureIncrements.Halves
        )

        expect(() => {
          calc.calculateNewApertureFromBaseExposure(
            {
              iso: '1600',
              aperture: 'f/2.8',
              shutter: '10"'
            },
            { shutter: '1"', iso: '100' }
          )
        }).toThrowError(
          'The given parameters will result in an underexposed image. Using a value of f/1 will still result in underexposure by 15 ½ stop increments (7.5 full stop(s)'
        )
      })

      it('should throw an overexposure error for full stops', () => {
        const calc = new calculations.ExposureCalculator(
          ExposureIncrements.Full
        )

        expect(() => {
          calc.calculateNewApertureFromBaseExposure(
            {
              iso: '1600',
              aperture: 'f/2.8',
              shutter: '15"'
            },
            { shutter: '1"', iso: '100' }
          )
        }).toThrowError(
          'he given parameters will result in an underexposed image. Using a value of f/1 will still result in underexposure by 8 stop(s)'
        )
      })

      it('should throw an underexposure error for full stops', () => {
        const calc = new calculations.ExposureCalculator(
          ExposureIncrements.Full
        )

        expect(() => {
          calc.calculateNewApertureFromBaseExposure(
            {
              iso: '1600',
              aperture: 'f/1',
              shutter: '1/4000'
            },
            { shutter: '1/8000', iso: '1600' }
          )
        }).toThrowError(
          'The given parameters will result in an underexposed image. Using a value of f/1 will still result in underexposure by 1 stop(s)'
        )
      })

      it('should throw an overexposure error for third stops (tests formatting for 1 full stop)', () => {
        const calc = new calculations.ExposureCalculator(
          ExposureIncrements.Thirds
        )

        expect(() => {
          calc.calculateNewApertureFromBaseExposure(
            {
              iso: '1600',
              aperture: 'f/64',
              shutter: '1/8000'
            },
            { shutter: '1/4000', iso: '1600' }
          )
        }).toThrowError(
          'The given parameters will result in an overexposed image. Using a value of f/64 will still result in overexposure by 3 ⅓ stop increments (1 full stop(s))'
        )
      })

      it('should throw an overexposure error for third stops (tests formatting for over 1 full stop)', () => {
        const calc = new calculations.ExposureCalculator(
          ExposureIncrements.Thirds
        )

        expect(() => {
          calc.calculateNewApertureFromBaseExposure(
            {
              iso: '1600',
              aperture: 'f/64',
              shutter: '1/8000'
            },
            { shutter: '1/2000', iso: '1600' }
          )
        }).toThrowError(
          'The given parameters will result in an overexposed image. Using a value of f/64 will still result in overexposure by 6 ⅓ stop increments (2 full stop(s))'
        )
      })
    })

    describe('#calculateNewIsoFromBaseExposure()', () => {
      it('should return a new ISO in range', () => {
        const shutter = calc.calculateNewIsoFromBaseExposure(
          {
            iso: '400',
            aperture: 'f/2.8',
            shutter: '1/15'
          },
          { shutter: '1/30', aperture: 'f/2.8' }
        )

        expect(shutter).toEqual('800')
      })

      it('should return a new ISO in range', () => {
        const shutter = calc.calculateNewIsoFromBaseExposure(
          {
            iso: '400',
            aperture: 'f/2.8',
            shutter: '1/30'
          },
          { shutter: '1/15', aperture: 'f/2.8' }
        )

        expect(shutter).toEqual('200')
      })
    })

    describe('#calculateNewShutterFromBaseExposure()', () => {
      it('should return a new shutter speed that is in range', () => {
        const shutter = calc.calculateNewShutterFromBaseExposure(
          {
            iso: '1600',
            aperture: 'f/2.8',
            shutter: '1/15'
          },
          { aperture: 'f/4', iso: '200' }
        )

        expect(shutter).toEqual('1"')
      })

      it('should return an out of range shutter as a number of seconds (1/3)', () => {
        const calc = new calculations.ExposureCalculator(
          ExposureIncrements.Thirds
        )
        const shutter = calc.calculateNewShutterFromBaseExposure(
          {
            iso: '1600',
            aperture: 'f/2.8',
            shutter: '15"'
          },
          { aperture: 'f/2.8', iso: '200' }
        )

        expect(shutter).toEqual(120)
      })

      it('should return an out of range shutter as a number of seconds (1/2)', () => {
        const calc = new calculations.ExposureCalculator(
          ExposureIncrements.Halves
        )
        const shutter = calc.calculateNewShutterFromBaseExposure(
          {
            iso: '1600',
            aperture: 'f/2.8',
            shutter: '15"'
          },
          { aperture: 'f/2.8', iso: '200' }
        )

        expect(shutter).toEqual(120)
      })

      it('should return an out of range shutter as a number of seconds (1/1)', () => {
        const calc = new calculations.ExposureCalculator(
          ExposureIncrements.Thirds
        )
        const shutter = calc.calculateNewShutterFromBaseExposure(
          {
            iso: '1600',
            aperture: 'f/2.8',
            shutter: '3.2'
          },
          { aperture: 'f/4', iso: '200' }
        )

        expect(shutter).toEqual(51)
      })

      it('should return an out of range shutter as a number of seconds (1/1)', () => {
        const calc = new calculations.ExposureCalculator(
          ExposureIncrements.Full
        )
        const shutter = calc.calculateNewShutterFromBaseExposure(
          {
            iso: '1600',
            aperture: 'f/2.8',
            shutter: '15"'
          },
          { aperture: 'f/4', iso: '200' }
        )

        expect(shutter).toEqual(240)
      })

      it('should return an out of range shutter as a number of seconds (1/1)', () => {
        const calc = new calculations.ExposureCalculator(
          ExposureIncrements.Full
        )
        const shutter = calc.calculateNewShutterFromBaseExposure(
          {
            iso: '1600',
            aperture: 'f/2.8',
            shutter: '1/4'
          },
          { aperture: 'f/11', iso: '50' }
        )

        expect(shutter).toEqual(128)
      })

      it('should return an out of range shutter as a number of seconds (1/1)', () => {
        const calc = new calculations.ExposureCalculator(
          ExposureIncrements.Full
        )
        const shutter = calc.calculateNewShutterFromBaseExposure(
          {
            iso: '1600',
            aperture: 'f/2.8',
            shutter: '0"5'
          },
          { aperture: 'f/11', iso: '50' }
        )

        expect(shutter).toEqual(102)
      })
    })
  })

  describe('#getShutterSpeeds()', () => {
    it('should return an array', () => {
      const shutters = calculations.getShutterSpeeds(ExposureIncrements.Thirds)
      expect(shutters).toBeInstanceOf(Array)
    })
  })

  describe('#getApertures()', () => {
    it('should return an array', () => {
      const apertures = calculations.getApertures(ExposureIncrements.Halves)
      expect(apertures).toBeInstanceOf(Array)
    })
  })

  describe('#getIsos()', () => {
    it('should return an array', () => {
      const isos = calculations.getIsos(ExposureIncrements.Full)
      expect(isos).toBeInstanceOf(Array)
    })
  })
})
