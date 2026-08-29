export const BADGE_CATEGORIES = [
  'milestone',
  'distance',
  'time',
  'location',
  'weather',
  'mood',
  'memory',
  'consistency',
] as const

export type BadgeCategory = (typeof BADGE_CATEGORIES)[number]

export const BADGE_DEFINITIONS = [
  {
    key: 'first_run',
    name: '啟程之印',
    description: '完成第 1 次跑步紀錄',
    category: 'milestone',
  },
  {
    key: 'single_run_3k',
    name: '三公里的約定',
    description: '完成單次距離至少 3 公里的跑步',
    category: 'distance',
  },
  {
    key: 'single_run_5k',
    name: '五公里遠征',
    description: '完成單次距離至少 5 公里的跑步',
    category: 'distance',
  },
  {
    key: 'dawn_runner',
    name: '破曉跑者',
    description: '於台灣時間 05:00–07:59 完成跑步',
    category: 'time',
  },
  {
    key: 'moonlight_runner',
    name: '逐月跑者',
    description: '於台灣時間 18:00–翌日 04:59 完成跑步',
    category: 'time',
  },
  {
    key: 'five_runs',
    name: '足跡漸深',
    description: '累積完成 5 次跑步',
    category: 'milestone',
  },
  {
    key: 'ten_runs',
    name: '步履成章',
    description: '累積完成 10 次跑步',
    category: 'milestone',
  },
  {
    key: 'total_distance_50k',
    name: '五十公里旅人',
    description: '累積跑步距離達 50 公里',
    category: 'distance',
  },
  {
    key: 'total_distance_100k',
    name: '百公里行者',
    description: '累積跑步距離達 100 公里',
    category: 'distance',
  },
  {
    key: 'city_runner',
    name: '城市遊走者',
    description: '在城市完成跑步',
    category: 'location',
  },
  {
    key: 'track_runner',
    name: '環道行者',
    description: '在操場完成跑步',
    category: 'location',
  },
  {
    key: 'mountain_runner',
    name: '山野冒險者',
    description: '在山野完成跑步',
    category: 'location',
  },
  {
    key: 'three_location_types',
    name: '足跡探險家',
    description: '累積跑過 3 種不同地點類型',
    category: 'location',
  },
  {
    key: 'five_location_types',
    name: '無界旅人',
    description: '累積跑過 5 種不同地點類型',
    category: 'location',
  },
  {
    key: 'rainy_run',
    name: '雨中跑者',
    description: '在雨天完成跑步',
    category: 'weather',
  },
  {
    key: 'all_weather_runner',
    name: '晴雨收藏家',
    description: '分別在晴天、陰天與雨天完成跑步',
    category: 'weather',
  },
  {
    key: 'tired_run',
    name: '再一步就好',
    description: '在感到疲累時仍完成跑步',
    category: 'mood',
  },
  {
    key: 'first_photo_run',
    name: '沿途拾光',
    description: '完成 1 筆附有照片的跑步紀錄',
    category: 'memory',
  },
  {
    key: 'five_photo_runs',
    name: '足跡收藏家',
    description: '累積完成 5 筆附有照片的跑步紀錄',
    category: 'memory',
  },
  {
    key: 'four_week_streak',
    name: '四週之約',
    description: '連續 4 週每週至少在 2 個不同日期完成跑步',
    category: 'consistency',
  },
] as const satisfies readonly {
  key: string
  name: string
  description: string
  category: BadgeCategory
}[]

export type BadgeDefinition = (typeof BADGE_DEFINITIONS)[number]
export type BadgeKey = BadgeDefinition['key']

export const BADGE_KEYS = BADGE_DEFINITIONS.map(({ key }) => key) as BadgeKey[]

export const BADGE_DEFINITION_BY_KEY = new Map<BadgeKey, BadgeDefinition>(
  BADGE_DEFINITIONS.map((definition) => [definition.key, definition]),
)
