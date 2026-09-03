import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  canAccessAcademyCategory,
  getMinimumLevelForAcademyCategory,
  getUnlockedAcademyCategories,
} from '../src/constants/academyAccess.js'

describe('跑者學院分類權限', () => {
  it('各分類使用正確的最低解鎖等級', () => {
    assert.equal(getMinimumLevelForAcademyCategory('learning'), 1)
    assert.equal(getMinimumLevelForAcademyCategory('equipment'), 3)
    assert.equal(getMinimumLevelForAcademyCategory('nutrition'), 4)
    assert.equal(getMinimumLevelForAcademyCategory('events'), 5)
  })

  it('Lv.1 與 Lv.2 只解鎖學習分類', () => {
    assert.deepEqual(getUnlockedAcademyCategories(1), ['learning'])
    assert.deepEqual(getUnlockedAcademyCategories(2), ['learning'])
  })

  it('Lv.3 解鎖學習與裝備分類', () => {
    assert.deepEqual(getUnlockedAcademyCategories(3), ['learning', 'equipment'])
    assert.equal(canAccessAcademyCategory(3, 'nutrition'), false)
  })

  it('Lv.4 解鎖學習、裝備與補給分類', () => {
    assert.deepEqual(getUnlockedAcademyCategories(4), ['learning', 'equipment', 'nutrition'])
    assert.equal(canAccessAcademyCategory(4, 'events'), false)
  })

  it('Lv.5 解鎖全部分類', () => {
    assert.deepEqual(getUnlockedAcademyCategories(5), [
      'learning',
      'equipment',
      'nutrition',
      'events',
    ])
  })
})
