import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, it } from 'node:test'
import sanitizeHtml from 'sanitize-html'

import { sanitizeArticleContent } from '../src/controllers/articleController.js'
import { academyArticles } from '../src/data/academyArticles/index.js'

const coverRoot = fileURLToPath(new URL('../assets/academy-covers/', import.meta.url))

describe('跑者學院正式文章資料', () => {
  it('包含 27 篇唯一文章與正確分類數量', () => {
    assert.equal(academyArticles.length, 27)
    assert.equal(new Set(academyArticles.map(({ slug }) => slug)).size, 27)
    assert.equal(new Set(academyArticles.map(({ title }) => title)).size, 27)

    assert.deepEqual(
      Object.fromEntries(
        ['learning', 'equipment', 'nutrition', 'events'].map((category) => [
          category,
          academyArticles.filter((article) => article.category === category).length,
        ]),
      ),
      {
        learning: 9,
        equipment: 6,
        nutrition: 6,
        events: 6,
      },
    )
  })

  it('摘要、內文長度與 HTML 都符合正式內容規格', () => {
    for (const article of academyArticles) {
      assert.ok(article.summary.length >= 40 && article.summary.length <= 80, article.slug)

      const content = article.content.trim()
      const textLength = sanitizeHtml(content, { allowedTags: [] }).replace(/\s/g, '').length

      assert.ok(textLength >= 800 && textLength <= 1500, `${article.slug}: ${textLength}`)
      assert.equal(sanitizeArticleContent(content), content, article.slug)
    }
  })

  it('每篇文章都有對應的 16:9 本機封面來源檔', async () => {
    await Promise.all(
      academyArticles.map(({ category, slug }) =>
        access(path.join(coverRoot, category, `${slug}.jpg`)),
      ),
    )
  })
})
