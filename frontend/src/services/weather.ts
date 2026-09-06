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

export interface DailyWeatherForecast {
  date: string
  weatherCode: number
  temperatureMax: number
  temperatureMin: number
  precipitationProbability: number | null
}

export interface WeatherForecast {
  timezone: string
  days: DailyWeatherForecast[]
}

interface OpenMeteoDailyResponse {
  timezone: string
  daily: {
    time: string[]
    weather_code: (number | null)[]
    temperature_2m_max: (number | null)[]
    temperature_2m_min: (number | null)[]
    precipitation_probability_max: (number | null)[]
  }
}

export async function getWeatherForecast(
  latitude: number,
  longitude: number,
): Promise<WeatherForecast> {
  const { data } = await axios.get<OpenMeteoDailyResponse>(
    'https://api.open-meteo.com/v1/forecast',
    {
      params: {
        latitude,
        longitude,
        daily: [
          'weather_code',
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_probability_max',
        ].join(','),
        forecast_days: 5,
        timezone: 'auto',
      },
    },
  )

  if (data.daily?.time?.length !== 5 || !data.timezone) {
    throw new Error('五天天氣預報資料不完整')
  }

  const days = data.daily.time.map((date, index): DailyWeatherForecast => {
    const weatherCode = data.daily.weather_code?.[index]
    const temperatureMax = data.daily.temperature_2m_max?.[index]
    const temperatureMin = data.daily.temperature_2m_min?.[index]
    const probability = data.daily.precipitation_probability_max?.[index]

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      typeof weatherCode !== 'number' ||
      !Number.isFinite(weatherCode) ||
      typeof temperatureMax !== 'number' ||
      !Number.isFinite(temperatureMax) ||
      typeof temperatureMin !== 'number' ||
      !Number.isFinite(temperatureMin)
    ) {
      throw new Error('每日天氣預報資料不完整')
    }

    return {
      date,
      weatherCode,
      temperatureMax,
      temperatureMin,
      // 缺少降雨機率不代表不會下雨，保留 null 讓介面顯示缺值。
      precipitationProbability:
        typeof probability === 'number' && Number.isFinite(probability) ? probability : null,
    }
  })

  return { timezone: data.timezone, days }
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