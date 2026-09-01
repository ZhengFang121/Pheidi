import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { BADGE_DEFINITIONS, getBadgeStorageKeys, resolveBadgeKey } from '../src/constants/badges.js'
import type { RunnerLevel } from '../src/constants/runnerLevels.js'
import UserBadge from '../src/models/UserBadge.js'
import { getEligibleBadgeKeys, hasFourWeekRunningStreak } from '../src/services/badgeService.js'
import {
  calculateHighestEligibleLevel,
  calculateLevelAfterRefresh,
  getNextLevelProgress,
  isPheidiMissionEligible,
} from '../src/services/runnerProgressService.js'
import type { ProgressRunRecord, RunnerStats } from '../src/types/runnerProgress.js'

const createRunRecord = (
  runDate: string,
  overrides: Partial<ProgressRunRecord> = {},
): ProgressRunRecord => ({
  runDate: new Date(runDate),
  distance: 1,
  locationType: 'park',
  mood: 'good',
  weather: {
    condition: 'sunny',
  },
  images: [],
  ...overrides,
})

const createStats = (overrides: Partial<RunnerStats> = {}): RunnerStats => ({
  runCount: 0,
  totalDistance: 0,
  distinctLocationCount: 0,
  badgeCount: 0,
  completedPheidiMissionCount: 0,
  ...overrides,
})

describe('徽章定義', () => {
  it('共有 20 枚定義且 key 不重複', () => {
    assert.equal(BADGE_DEFINITIONS.length, 20)
    assert.equal(new Set(BADGE_DEFINITIONS.map(({ key }) => key)).size, BADGE_DEFINITIONS.length)
  })

  it('20 枚定義依正式順序提供 canonical key 與 PNG 素材路徑', () => {
    assert.deepEqual(
      BADGE_DEFINITIONS.map(({ key }) => key),
      [
        'first-step',
        'three-kilometer',
        'five-kilometer',
        'dawn-runner',
        'moonlight-runner',
        'city-runner',
        'track-runner',
        'trail-adventurer',
        'rain-runner',
        'scenic-moments',
        'run-count-5',
        'run-count-10',
        'distance-50k',
        'distance-100k',
        'location-explorer',
        'all-terrain-runner',
        'photo-collector',
        'weather-collector',
        'tired-runner',
        'four-week-streak',
      ],
    )
    assert.ok(
      BADGE_DEFINITIONS.every(({ imagePath }) =>
        /^\/images\/badges\/\d{2}-[a-z0-9-]+\.png$/.test(imagePath),
      ),
    )
    assert.deepEqual(
      BADGE_DEFINITIONS.map(({ name }) => name),
      [
        '啟程之印',
        '三公里約定',
        '五公里堅持',
        '破曉跑者',
        '逐月跑者',
        '城市行者',
        '環道行者',
        '山野冒險者',
        '雨中跑者',
        '沿途拾光',
        '足跡漸深',
        '旅途漸長',
        '半百公里旅人',
        '百公里征途',
        '足跡探險家',
        '無界旅人',
        '足跡收藏家',
        '晴雨收藏家',
        '一步之遙',
        '四週之約',
      ],
    )
  })

  it('舊 badgeKey 可解析為正式 key，並保留為相容儲存值', () => {
    assert.equal(resolveBadgeKey('first_run'), 'first-step')
    assert.equal(resolveBadgeKey('mountain_runner'), 'trail-adventurer')
    assert.deepEqual(getBadgeStorageKeys('first-step'), ['first-step', 'first_run'])
  })

  it('UserBadge 以 user + badgeKey 建立 unique compound index', () => {
    const uniqueIndex = UserBadge.schema
      .indexes()
      .find(
        ([fields, options]) =>
          fields.user === 1 && fields.badgeKey === 1 && options.unique === true,
      )

    assert.ok(uniqueIndex)
  })
})

describe('單筆與累積徽章判定', () => {
  it('第一筆 5 公里紀錄可同時解鎖啟程、3k 與 5k 徽章', () => {
    const badgeKeys = getEligibleBadgeKeys([
      createRunRecord('2026-01-01T12:00:00+08:00', { distance: 5 }),
    ])

    assert.ok(badgeKeys.includes('first-step'))
    assert.ok(badgeKeys.includes('three-kilometer'))
    assert.ok(badgeKeys.includes('five-kilometer'))
  })

  it('使用台灣時間判定破曉與逐月跑者的邊界', () => {
    const badgeKeys = getEligibleBadgeKeys([
      createRunRecord('2026-01-01T05:00:00+08:00'),
      createRunRecord('2026-01-02T07:59:59+08:00'),
      createRunRecord('2026-01-03T18:00:00+08:00'),
      createRunRecord('2026-01-04T04:59:59+08:00'),
    ])

    assert.ok(badgeKeys.includes('dawn-runner'))
    assert.ok(badgeKeys.includes('moonlight-runner'))
  })

  it('不會把台灣時間 08:00–17:59 誤判為時段徽章', () => {
    const badgeKeys = getEligibleBadgeKeys([
      createRunRecord('2026-01-01T08:00:00+08:00'),
      createRunRecord('2026-01-01T17:59:59+08:00'),
    ])

    assert.ok(!badgeKeys.includes('dawn-runner'))
    assert.ok(!badgeKeys.includes('moonlight-runner'))
  })

  it('判定雨天、三種天氣、疲累心情與照片徽章', () => {
    const records = [
      createRunRecord('2026-01-01T12:00:00+08:00', {
        mood: 'tired',
        images: ['https://example.com/1.jpg'],
      }),
      createRunRecord('2026-01-02T12:00:00+08:00', {
        weather: { condition: 'cloudy' },
        images: ['https://example.com/2.jpg'],
      }),
      createRunRecord('2026-01-03T12:00:00+08:00', {
        weather: { condition: 'rainy' },
        images: ['https://example.com/3.jpg'],
      }),
      createRunRecord('2026-01-04T12:00:00+08:00', {
        images: ['https://example.com/4.jpg'],
      }),
      createRunRecord('2026-01-05T12:00:00+08:00', {
        images: ['https://example.com/5.jpg'],
      }),
    ]
    const badgeKeys = getEligibleBadgeKeys(records)

    assert.ok(badgeKeys.includes('rain-runner'))
    assert.ok(badgeKeys.includes('weather-collector'))
    assert.ok(badgeKeys.includes('tired-runner'))
    assert.ok(badgeKeys.includes('scenic-moments'))
    assert.ok(badgeKeys.includes('photo-collector'))
  })

  it('分別判定 city、track、mountain 與 3／5 種地點', () => {
    const records = ['city', 'track', 'mountain', 'gym', 'riverside'].map((locationType, index) =>
      createRunRecord(`2026-01-${String(index + 1).padStart(2, '0')}T12:00:00+08:00`, {
        locationType: locationType as ProgressRunRecord['locationType'],
      }),
    )
    const badgeKeys = getEligibleBadgeKeys(records)

    assert.ok(badgeKeys.includes('city-runner'))
    assert.ok(badgeKeys.includes('track-runner'))
    assert.ok(badgeKeys.includes('trail-adventurer'))
    assert.ok(badgeKeys.includes('location-explorer'))
    assert.ok(badgeKeys.includes('all-terrain-runner'))
  })
})

describe('四週之約', () => {
  const fourQualifiedWeeks = [5, 12, 19, 26].flatMap((mondayDay) => [
    createRunRecord(`2026-01-${String(mondayDay).padStart(2, '0')}T21:00:00+08:00`),
    createRunRecord(`2026-01-${String(mondayDay + 1).padStart(2, '0')}T06:00:00+08:00`),
  ])

  it('以週一為每週起點，連續四週每週兩日時解鎖', () => {
    assert.equal(hasFourWeekRunningStreak(fourQualifiedWeeks), true)
    assert.ok(getEligibleBadgeKeys(fourQualifiedWeeks).includes('four-week-streak'))
  })

  it('同一天多筆只算一個跑步日', () => {
    const sameDayDuplicates = [5, 12, 19, 26].flatMap((mondayDay) => [
      createRunRecord(`2026-01-${String(mondayDay).padStart(2, '0')}T06:00:00+08:00`),
      createRunRecord(`2026-01-${String(mondayDay).padStart(2, '0')}T20:00:00+08:00`),
    ])

    assert.equal(hasFourWeekRunningStreak(sameDayDuplicates), false)
  })

  it('依 runDate 計算，因此舊日期的補登紀錄可參與連續週', () => {
    const backfilledRecord = createRunRecord('2026-01-27T06:00:00+08:00')
    const withoutFourthWeekSecondDay = fourQualifiedWeeks.filter(
      ({ runDate }) => runDate.toISOString() !== backfilledRecord.runDate.toISOString(),
    )

    assert.equal(hasFourWeekRunningStreak(withoutFourthWeekSecondDay), false)
    assert.equal(hasFourWeekRunningStreak([...withoutFourthWeekSecondDay, backfilledRecord]), true)
  })
})

describe('等級與 Lv.5 解鎖資格', () => {
  it('依關卡條件計算最高可自動升等級', () => {
    assert.equal(calculateHighestEligibleLevel(createStats({ runCount: 5, totalDistance: 10 })), 2)
    assert.equal(
      calculateHighestEligibleLevel(
        createStats({
          runCount: 10,
          totalDistance: 30,
          distinctLocationCount: 3,
        }),
      ),
      3,
    )
    assert.equal(
      calculateHighestEligibleLevel(
        createStats({ runCount: 25, totalDistance: 100, badgeCount: 10 }),
      ),
      4,
    )
  })

  it('已經升到 Lv.4 後，統計下降仍保留 Lv.4', () => {
    assert.equal(calculateLevelAfterRefresh(4, createStats()), 4)
  })

  it('50 次 + 250 公里會解鎖任務資格，但完成任務前最高仍為 Lv.4', () => {
    const stats = createStats({
      runCount: 50,
      totalDistance: 250,
      distinctLocationCount: 5,
      badgeCount: 20,
    })

    assert.equal(isPheidiMissionEligible(stats), true)
    assert.equal(calculateHighestEligibleLevel(stats), 4)
    assert.equal(calculateLevelAfterRefresh(1, stats), 4 as RunnerLevel)
  })

  it('50 次 + 250 公里並完成菲迪限定任務後升至 Lv.5', () => {
    const stats = createStats({
      runCount: 50,
      totalDistance: 250,
      distinctLocationCount: 5,
      badgeCount: 20,
      completedPheidiMissionCount: 1,
    })

    assert.equal(calculateHighestEligibleLevel(stats), 5)
    assert.equal(calculateLevelAfterRefresh(4, stats), 5 as RunnerLevel)
  })

  it('Lv.4 的下一階段進度會回傳實際限定任務完成數', () => {
    const nextLevel = getNextLevelProgress(
      4,
      createStats({ runCount: 50, totalDistance: 250, completedPheidiMissionCount: 2 }),
    )

    assert.deepEqual(nextLevel?.requirements.pheidiMission, {
      current: 2,
      required: 1,
      isMet: true,
    })
  })
})
