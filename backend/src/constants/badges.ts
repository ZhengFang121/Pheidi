export const BADGE_CATEGORIES = ['first-experience', 'growth', 'special'] as const

export type BadgeCategory = (typeof BADGE_CATEGORIES)[number]

export const BADGE_DEFINITIONS = [
  {
    key: 'first-step',
    name: '啟程之印',
    description: '完成第 1 次跑步紀錄',
    category: 'first-experience',
    imagePath: '/images/badges/01-first-step.png',
  },
  {
    key: 'three-kilometer',
    name: '三公里約定',
    description: '完成第 1 次單次跑步距離 ≥ 3 km',
    category: 'first-experience',
    imagePath: '/images/badges/02-three-kilometer.png',
  },
  {
    key: 'five-kilometer',
    name: '五公里堅持',
    description: '完成第 1 次單次跑步距離 ≥ 5 km',
    category: 'first-experience',
    imagePath: '/images/badges/03-five-kilometer.png',
  },
  {
    key: 'dawn-runner',
    name: '破曉跑者',
    description: '完成第 1 次晨跑（台灣時間 05:00–07:59）',
    category: 'first-experience',
    imagePath: '/images/badges/04-dawn-runner.png',
  },
  {
    key: 'moonlight-runner',
    name: '逐月跑者',
    description: '完成第 1 次夜跑（台灣時間 18:00–翌日 04:59）',
    category: 'first-experience',
    imagePath: '/images/badges/05-moonlight-runner.png',
  },
  {
    key: 'city-runner',
    name: '城市行者',
    description: '完成第 1 次在城市的跑步紀錄',
    category: 'first-experience',
    imagePath: '/images/badges/06-city-runner.png',
  },
  {
    key: 'track-runner',
    name: '環道行者',
    description: '完成第 1 次在操場的跑步紀錄',
    category: 'first-experience',
    imagePath: '/images/badges/07-track-runner.png',
  },
  {
    key: 'trail-adventurer',
    name: '山野冒險者',
    description: '完成第 1 次在山野的跑步紀錄',
    category: 'first-experience',
    imagePath: '/images/badges/08-trail-adventurer.png',
  },
  {
    key: 'rain-runner',
    name: '雨中跑者',
    description: '完成第 1 次雨天跑步',
    category: 'first-experience',
    imagePath: '/images/badges/09-rain-runner.png',
  },
  {
    key: 'scenic-moments',
    name: '沿途拾光',
    description: '完成第 1 筆有上傳至少 1 張照片的跑步紀錄',
    category: 'first-experience',
    imagePath: '/images/badges/10-scenic-moments.png',
  },
  {
    key: 'run-count-5',
    name: '足跡漸深',
    description: '累積完成 ≥ 5 次跑步',
    category: 'growth',
    imagePath: '/images/badges/11-run-count-5.png',
  },
  {
    key: 'run-count-10',
    name: '旅途漸長',
    description: '累積完成 ≥ 10 次跑步',
    category: 'growth',
    imagePath: '/images/badges/12-run-count-10.png',
  },
  {
    key: 'distance-50k',
    name: '半百公里旅人',
    description: '累積跑步距離 ≥ 50 km',
    category: 'growth',
    imagePath: '/images/badges/13-distance-50k.png',
  },
  {
    key: 'distance-100k',
    name: '百公里征途',
    description: '累積跑步距離 ≥ 100 km',
    category: 'growth',
    imagePath: '/images/badges/14-distance-100k.png',
  },
  {
    key: 'location-explorer',
    name: '足跡探險家',
    description: '累積跑過 ≥ 3 種不同地點類型',
    category: 'growth',
    imagePath: '/images/badges/15-location-explorer.png',
  },
  {
    key: 'all-terrain-runner',
    name: '無界旅人',
    description: '累積跑過 ≥ 5 種不同地點類型',
    category: 'growth',
    imagePath: '/images/badges/16-all-terrain-runner.png',
  },
  {
    key: 'photo-collector',
    name: '足跡收藏家',
    description: '累積 ≥ 5 筆有上傳至少 1 張照片的跑步紀錄',
    category: 'growth',
    imagePath: '/images/badges/17-photo-collector.png',
  },
  {
    key: 'weather-collector',
    name: '晴雨收藏家',
    description: '曾分別在晴天、陰天與雨天各完成至少 1 次跑步',
    category: 'special',
    imagePath: '/images/badges/18-weather-collector.png',
  },
  {
    key: 'tired-runner',
    name: '一步之遙',
    description: '心情為疲憊時完成 ≥ 1 次跑步',
    category: 'special',
    imagePath: '/images/badges/19-tired-runner.png',
  },
  {
    key: 'four-week-streak',
    name: '四週之約',
    description: '連續 4 個自然週，每週至少在 2 個不同日期完成跑步',
    category: 'special',
    imagePath: '/images/badges/20-four-week-streak.png',
  },
] as const satisfies readonly {
  key: string
  name: string
  description: string
  category: BadgeCategory
  imagePath: string
}[]

export type BadgeDefinition = (typeof BADGE_DEFINITIONS)[number]
export type BadgeKey = BadgeDefinition['key']

export const BADGE_KEYS = BADGE_DEFINITIONS.map(({ key }) => key) as BadgeKey[]

export const LEGACY_BADGE_KEY_BY_KEY = {
  'first-step': 'first_run',
  'three-kilometer': 'single_run_3k',
  'five-kilometer': 'single_run_5k',
  'dawn-runner': 'dawn_runner',
  'moonlight-runner': 'moonlight_runner',
  'city-runner': 'city_runner',
  'track-runner': 'track_runner',
  'trail-adventurer': 'mountain_runner',
  'rain-runner': 'rainy_run',
  'scenic-moments': 'first_photo_run',
  'run-count-5': 'five_runs',
  'run-count-10': 'ten_runs',
  'distance-50k': 'total_distance_50k',
  'distance-100k': 'total_distance_100k',
  'location-explorer': 'three_location_types',
  'all-terrain-runner': 'five_location_types',
  'photo-collector': 'five_photo_runs',
  'weather-collector': 'all_weather_runner',
  'tired-runner': 'tired_run',
  'four-week-streak': 'four_week_streak',
} as const satisfies Record<BadgeKey, string>

export type LegacyBadgeKey = (typeof LEGACY_BADGE_KEY_BY_KEY)[BadgeKey]
export type BadgeStorageKey = BadgeKey | LegacyBadgeKey

export const BADGE_STORAGE_KEYS = [
  ...BADGE_KEYS,
  ...Object.values(LEGACY_BADGE_KEY_BY_KEY),
] as BadgeStorageKey[]

export const BADGE_DEFINITION_BY_KEY = new Map<BadgeKey, BadgeDefinition>(
  BADGE_DEFINITIONS.map((definition) => [definition.key, definition]),
)

const BADGE_KEY_BY_LEGACY_KEY = new Map<LegacyBadgeKey, BadgeKey>(
  Object.entries(LEGACY_BADGE_KEY_BY_KEY).map(([key, legacyKey]) => [legacyKey, key as BadgeKey]),
)

export const resolveBadgeKey = (key: string): BadgeKey | undefined => {
  if (BADGE_DEFINITION_BY_KEY.has(key as BadgeKey)) {
    return key as BadgeKey
  }

  return BADGE_KEY_BY_LEGACY_KEY.get(key as LegacyBadgeKey)
}

export const getBadgeStorageKeys = (key: BadgeKey): readonly BadgeStorageKey[] => {
  return [key, LEGACY_BADGE_KEY_BY_KEY[key]]
}
