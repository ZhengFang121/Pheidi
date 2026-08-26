import axios from 'axios'

import type { WeatherCondition } from '@/constants/runRecord'

interface OpenMeteoCurrentResponse {
  current: {
    temperature_2m: number
    apparent_temperature: number
    precipitation_probability: number
    weather_code: number
    wind_speed_10m: number
  }
}

interface OpenMeteoHourlyResponse {
  utc_offset_seconds: number
  hourly: {
    time: string[]
    weather_code: number[]
  }
}

export interface CurrentWeather {
  temperature: number
  apparentTemperature: number
  precipitationProbability: number
  weatherCode: number
  windSpeed: number
}

const recentWeatherRangeInMilliseconds =
  7 * 24 * 60 * 60 * 1000

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const getWeatherConditionFromCode = (
  weatherCode: number,
): WeatherCondition => {
  if (weatherCode === 0) {
    return 'sunny'
  }

  if (weatherCode >= 51) {
    return 'rainy'
  }

  return 'cloudy'
}

export async function getCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<CurrentWeather> {
  const response = await axios.get<OpenMeteoCurrentResponse>(
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

export async function getWeatherConditionForDate(
  latitude: number,
  longitude: number,
  runDate: Date,
): Promise<WeatherCondition> {
  const selectedDate = formatLocalDate(runDate)
  const isRecentDate =
    runDate.getTime() >=
    Date.now() - recentWeatherRangeInMilliseconds

  const endpoint = isRecentDate
    ? 'https://api.open-meteo.com/v1/forecast'
    : 'https://historical-forecast-api.open-meteo.com/v1/forecast'

  const response = await axios.get<OpenMeteoHourlyResponse>(
    endpoint,
    {
      params: {
        latitude,
        longitude,
        start_date: selectedDate,
        end_date: selectedDate,
        hourly: 'weather_code',
        timezone: 'auto',
      },
    },
  )

  const targetLocalTime = new Date(
    runDate.getTime() +
      response.data.utc_offset_seconds * 1000,
  )

  const targetHour =
    `${targetLocalTime.toISOString().slice(0, 13)}:00`

  const weatherIndex =
    response.data.hourly.time.indexOf(targetHour)

  const weatherCode =
    response.data.hourly.weather_code[weatherIndex]

  if (weatherIndex === -1 || typeof weatherCode !== 'number') {
    throw new Error('找不到指定時間的天氣資料')
  }

  return getWeatherConditionFromCode(weatherCode)
}