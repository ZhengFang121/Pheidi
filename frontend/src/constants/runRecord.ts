export const RUN_LOCATION_OPTIONS = [
  {
    value: 'city',
    label: '城市',
  },
  {
    value: 'gym',
    label: '健身房',
  },
  {
    value: 'track',
    label: '操場',
  },
  {
    value: 'riverside',
    label: '河堤',
  },
  {
    value: 'mountain',
    label: '山區',
  },
  {
    value: 'park',
    label: '公園',
  },
  {
    value: 'other',
    label: '其他',
  },
] as const

export const RUN_MOOD_OPTIONS = [
  {
    value: 'great',
    label: '很棒',
  },
  {
    value: 'good',
    label: '不錯',
  },
  {
    value: 'okay',
    label: '普通',
  },
  {
    value: 'tired',
    label: '有點累',
  },
  {
    value: 'exhausted',
    label: '筋疲力盡',
  },
] as const

export const WEATHER_CONDITION_OPTIONS = [
  {
    value: 'sunny',
    label: '晴天',
  },
  {
    value: 'cloudy',
    label: '陰天',
  },
  {
    value: 'rainy',
    label: '雨天',
  },
] as const

export const WEATHER_SOURCES = [
  'current-location',
  'taipei-default',
  'manual',
] as const

export type RunLocationType =
  (typeof RUN_LOCATION_OPTIONS)[number]['value']

export type RunMood = (typeof RUN_MOOD_OPTIONS)[number]['value']

export type WeatherCondition =
  (typeof WEATHER_CONDITION_OPTIONS)[number]['value']

export type WeatherSource = (typeof WEATHER_SOURCES)[number]
