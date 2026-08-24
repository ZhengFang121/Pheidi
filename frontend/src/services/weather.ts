import axios from 'axios'

interface OpenMeteoResponse {
  current: {
    temperature_2m: number
    apparent_temperature: number
    precipitation_probability: number
    weather_code: number
    wind_speed_10m: number
  }
}

export interface CurrentWeather {
  temperature: number
  apparentTemperature: number
  precipitationProbability: number
  weatherCode: number
  windSpeed: number
}

export async function getCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<CurrentWeather> {
  const response = await axios.get<OpenMeteoResponse>(
    'https://api.open-meteo.com/v1/forecast',
    {
      params: {
        latitude,
        longitude,
        current: [
          'temperature_2m',
          'apparent_temperature',
          'precipitation_probability',
          'weather_code',
          'wind_speed_10m',
        ].join(','),
        timezone: 'auto',
      },
    },
  )

  const current = response.data.current

  return {
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    precipitationProbability: current.precipitation_probability,
    weatherCode: current.weather_code,
    windSpeed: current.wind_speed_10m,
  }
}