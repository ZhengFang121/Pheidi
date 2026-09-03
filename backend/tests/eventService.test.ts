import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { resolveEventStatus, validateEventFormData } from '../src/services/eventService.js'

const now = new Date('2026-09-03T12:00:00+08:00')

const validPayload = {
  title: '週末河濱練跑',
  summary: '一起用舒服的速度完成週末練跑。',
  location: '大佳河濱公園',
  startAt: '2026-09-06T06:30:00+08:00',
  endAt: '2026-09-06T08:00:00+08:00',
  distance: '5K',
  capacity: 20,
  notes: ['請攜帶飲水'],
}

describe('活動公開狀態', () => {
  it('活動結束時間已過時回傳 ended', () => {
    assert.equal(
      resolveEventStatus(
        {
          endAt: new Date('2026-09-03T11:59:59+08:00'),
          participantCount: 3,
        },
        now,
      ),
      'ended',
    )
  })

  it('參加人數到達上限時回傳 full', () => {
    assert.equal(
      resolveEventStatus(
        {
          endAt: new Date('2026-09-06T08:00:00+08:00'),
          capacity: 3,
          participantCount: 3,
        },
        now,
      ),
      'full',
    )
  })

  it('活動未結束且未額滿時回傳 available', () => {
    assert.equal(
      resolveEventStatus(
        {
          endAt: new Date('2026-09-06T08:00:00+08:00'),
          capacity: 3,
          participantCount: 2,
        },
        now,
      ),
      'available',
    )
  })
})

describe('活動資料驗證', () => {
  it('接受完整且有效的未來活動', () => {
    const result = validateEventFormData(validPayload, {
      requireFutureStart: true,
      now,
    })

    assert.equal(result.isValid, true)
  })

  it('拒絕晚於結束時間的開始時間', () => {
    const result = validateEventFormData(
      {
        ...validPayload,
        startAt: '2026-09-06T09:00:00+08:00',
      },
      { requireFutureStart: true, now },
    )

    assert.deepEqual(result, {
      isValid: false,
      message: '活動結束時間必須晚於開始時間',
    })
  })

  it('拒絕已經開始的活動與不合法人數上限', () => {
    const pastResult = validateEventFormData(
      {
        ...validPayload,
        startAt: '2026-09-03T11:00:00+08:00',
        endAt: '2026-09-03T13:00:00+08:00',
      },
      { requireFutureStart: true, now },
    )
    const capacityResult = validateEventFormData(
      { ...validPayload, capacity: 1.5 },
      { requireFutureStart: true, now },
    )

    assert.equal(pastResult.isValid, false)
    assert.deepEqual(capacityResult, {
      isValid: false,
      message: '參加人數上限必須是大於 0 的整數',
    })
  })

  it('移除文字欄位中的 HTML', () => {
    const result = validateEventFormData(
      {
        ...validPayload,
        title: '<strong>晨光練跑</strong>',
        notes: ['<em>記得飲水</em>'],
      },
      { requireFutureStart: true, now },
    )

    assert.equal(result.isValid, true)

    if (result.isValid) {
      assert.equal(result.data.title, '晨光練跑')
      assert.deepEqual(result.data.notes, ['記得飲水'])
    }
  })
})
