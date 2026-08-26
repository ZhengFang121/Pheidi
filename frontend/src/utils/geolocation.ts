export interface Coordinates {
  latitude: number
  longitude: number
}

export type RunRecordCoordinateSource =
  | 'current-location'
  | 'taipei-default'

export interface RunRecordCoordinates extends Coordinates {
  source: RunRecordCoordinateSource
}

const TAIPEI_XINYI_COORDINATES: Coordinates = {
  latitude: 25.033,
  longitude: 121.5654,
}

const requestCurrentCoordinates =
  (): Promise<Coordinates | null> => {
    if (!navigator.geolocation) {
      return Promise.resolve(null)
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        () => {
          resolve(null)
        },
        {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 10 * 60 * 1000,
        },
      )
    })
  }

export async function getCurrentCoordinates(): Promise<Coordinates> {
  const coordinates = await requestCurrentCoordinates()

  return coordinates ?? TAIPEI_XINYI_COORDINATES
}

export async function getRunRecordCoordinates(): Promise<RunRecordCoordinates> {
  const coordinates = await requestCurrentCoordinates()

  if (coordinates) {
    return {
      ...coordinates,
      source: 'current-location',
    }
  }

  return {
    ...TAIPEI_XINYI_COORDINATES,
    source: 'taipei-default',
  }
}