import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import express, { Router } from 'express'
import type { PipelineStage } from 'mongoose'

import { registerAdminHandlers } from '../src/controllers/adminController.js'
import Article from '../src/models/Article.js'
import Comment from '../src/models/Comment.js'
import Post from '../src/models/Post.js'
import User from '../src/models/User.js'
import { resolveDashboardPeriod } from '../src/utils/dashboardPeriod.js'

describe('儀表板統計期間', () => {
  it('預設包含台灣今天及前 29 天，不受執行環境時區影響', () => {
    const period = resolveDashboardPeriod(undefined, new Date('2026-09-30T16:00:00Z'))
    assert.ok(period)
    assert.equal(period.start.toISOString(), '2026-09-01T16:00:00.000Z')
    assert.equal(period.end.toISOString(), '2026-10-01T16:00:00.000Z')
    assert.equal(period.dateKeys.length, 30)
    assert.equal(period.dateKeys[0], '2026-09-02')
    assert.equal(period.dateKeys.at(-1), '2026-10-01')
    assert.equal(period.metadata.key, 'recent-30-days')
    assert.deepEqual(
      period,
      resolveDashboardPeriod('recent-30-days', new Date('2026-10-01T00:00:00+08:00')),
    )
  })

  it('台灣午夜前仍以當天為最近 30 天的最後一天', () => {
    const period = resolveDashboardPeriod(undefined, new Date('2026-09-30T15:59:59.999Z'))
    assert.equal(period?.dateKeys.at(-1), '2026-09-30')
  })

  it('9 月起訖為台灣 9/1 00:00（含）至 10/1 00:00（不含）', () => {
    const period = resolveDashboardPeriod('2026-09')
    assert.ok(period)
    assert.equal(period.start.toISOString(), '2026-08-31T16:00:00.000Z')
    assert.equal(period.end.toISOString(), '2026-09-30T16:00:00.000Z')
    assert.equal(period.dateKeys.length, 30)
    assert.equal(period.dateKeys[0], '2026-09-01')
    assert.equal(period.dateKeys.at(-1), '2026-09-30')
    assert.deepEqual(period.metadata, {
      key: '2026-09',
      label: '2026 年 9 月',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      timeZone: 'Asia/Taipei',
    })
  })

  it('拒絕空值、不合法日期、不支援的月份、陣列及物件', () => {
    for (const value of [
      '',
      null,
      '2026-00',
      '2026-13',
      '2026-09-31',
      '2026-9',
      '2026-10',
      ['2026-09'],
      { $ne: null },
    ]) {
      assert.equal(resolveDashboardPeriod(value), null)
    }
  })
})

// 測試資料只存在記憶體中，測試不連線也不寫入 MongoDB。
interface TestRecord {
  createdAt: Date
  publishedAt: Date
  status: string
}
const records: TestRecord[] = [
  '2026-08-31T15:59:59.999Z', // 台灣 8 月最後一毫秒
  '2026-08-31T16:00:00.000Z', // 台灣 9 月第一筆
  '2026-09-30T15:59:59.999Z', // 台灣 9 月最後一毫秒
  '2026-09-30T16:00:00.000Z', // 台灣 10 月第一筆
].map((value) => ({
  createdAt: new Date(value),
  publishedAt: new Date(value),
  status: 'published',
}))
const pipelines: PipelineStage[][] = []
const countFilters: unknown[] = []

const requestDashboard = async (query = '') => {
  const app = express()
  const router = Router()
  registerAdminHandlers(router)
  app.use('/admin', router)
  const server = app.listen(0, '127.0.0.1')
  await new Promise<void>((resolve) => server.once('listening', resolve))

  try {
    const address = server.address()
    assert.ok(address && typeof address !== 'string')
    const response = await fetch(`http://127.0.0.1:${address.port}/admin/dashboard${query}`)
    return { status: response.status, body: await response.json() }
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
}

describe('/admin/dashboard 期間查詢', () => {
  beforeEach(() => {
    pipelines.length = 0
    countFilters.length = 0
    for (const model of [User, Article, Post, Comment]) {
      mock.method(model, 'countDocuments', async (filter?: unknown) => {
        countFilters.push(filter)
        return 42
      })
      mock.method(model, 'aggregate', async (pipeline: PipelineStage[]) => {
        pipelines.push(pipeline)
        const match = (pipeline[0] as PipelineStage.Match).$match
        const field = model === Article ? 'publishedAt' : 'createdAt'
        const range = match[field] as { $gte: Date; $lt: Date }
        const counts = new Map<string, number>()
        const candidates =
          model === Article ? [...records, { ...records[1]!, status: 'draft' }] : records
        for (const record of candidates) {
          if (record[field] < range.$gte || record[field] >= range.$lt) continue
          if (match.status && record.status !== match.status) continue
          const date = new Date(record[field].getTime() + 8 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10)
          counts.set(date, (counts.get(date) ?? 0) + 1)
        }
        return [...counts].map(([_id, count]) => ({ _id, count }))
      })
    }
    const query = {
      select: () => query,
      sort: () => query,
      limit: () => query,
      lean: async () => [],
    }
    mock.method(User, 'find', () => query)
  })

  afterEach(() => mock.restoreAll())

  it('四組趨勢使用相同月份界線、台灣日期分組，文章僅統計已發布資料', async () => {
    const { status, body } = await requestDashboard('?period=2026-09')
    assert.equal(status, 200)
    assert.equal(body.period.key, '2026-09')
    assert.equal(pipelines.length, 4)
    for (const pipeline of pipelines) {
      const match = (pipeline[0] as PipelineStage.Match).$match
      const range = (match.createdAt ?? match.publishedAt) as { $gte: Date; $lt: Date }
      assert.equal(range.$gte.toISOString(), '2026-08-31T16:00:00.000Z')
      assert.equal(range.$lt.toISOString(), '2026-09-30T16:00:00.000Z')
      const group = (pipeline[1] as PipelineStage.Group).$group
      assert.equal(group._id.$dateToString.timezone, 'Asia/Taipei')
    }
    assert.equal((pipelines[1]![0] as PipelineStage.Match).$match.status, 'published')
    for (const data of [body.trend.users, body.trend.articles]) {
      assert.equal(data.length, 30)
      assert.deepEqual(data[0], { date: '2026-09-01', count: 1 })
      assert.deepEqual(data[29], { date: '2026-09-30', count: 1 })
      assert.equal(
        data.reduce((sum: number, item: { count: number }) => sum + item.count, 0),
        2,
      )
      assert.equal(data[1].count, 0)
    }
    assert.equal(body.trend.plaza.length, 30)
    assert.deepEqual(body.trend.plaza[0], { date: '2026-09-01', posts: 1, comments: 1 })
    assert.deepEqual(body.trend.plaza[29], { date: '2026-09-30', posts: 1, comments: 1 })
  })

  it('省略參數保持最近 30 天，累積統計查詢不加入期間條件', async () => {
    const recent = await requestDashboard()
    assert.equal(recent.status, 200)
    assert.equal(recent.body.period.key, 'recent-30-days')
    assert.equal(recent.body.trend.users.length, 30)
    const recentFilters = countFilters.slice()
    const explicitRecent = await requestDashboard('?period=recent-30-days')
    assert.deepEqual(explicitRecent.body.trend, recent.body.trend)
    assert.deepEqual(explicitRecent.body.period, recent.body.period)
    countFilters.length = 0
    const september = await requestDashboard('?period=2026-09')
    assert.deepEqual(recent.body.statistics, september.body.statistics)
    // 原本近 7 天新增統計依即時時間查詢，其他累積查詢完全一致。
    assert.deepEqual(
      countFilters.filter((_, index) => index !== 3),
      recentFilters.filter((_, index) => index !== 3),
    )
    assert.ok(!JSON.stringify(countFilters).includes('2026-08-31'))
  })

  it('無效或重複期間回傳 400，且不執行資料庫查詢', async () => {
    for (const query of [
      '?period=',
      '?period=2026-13',
      '?period=2026-09-31',
      '?period=2026-09&period=recent-30-days',
    ]) {
      assert.equal((await requestDashboard(query)).status, 400, query)
    }
    assert.equal(pipelines.length, 0)
    assert.equal(countFilters.length, 0)
  })

  it('資料庫失敗時回傳 500 與可顯示的錯誤訊息', async () => {
    mock.method(User, 'aggregate', async () => {
      throw new Error('database unavailable')
    })
    mock.method(console, 'error', () => {})
    const { status, body } = await requestDashboard('?period=2026-09')
    assert.equal(status, 500)
    assert.equal(body.message, '取得管理員儀表板資料失敗')
  })
})
