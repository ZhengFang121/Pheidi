export interface Coordinates {
  latitude: number
  longitude: number
}

const TAIPEI_COORDINATES: Coordinates = {
  latitude: 25.033,
  longitude: 121.5654,
}

export function getCurrentCoordinates(): Promise<Coordinates> {
  if (!navigator.geolocation) {
    return Promise.resolve(TAIPEI_COORDINATES)
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
        // 使用者拒絕定位或定位失敗時，以台北市作為預設值
        resolve(TAIPEI_COORDINATES)
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 10 * 60 * 1000,
      },
    )
  })
}