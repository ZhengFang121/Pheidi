import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { sanitizeArticleContent } from '../src/controllers/articleController.js'

describe('文章 HTML sanitizer', () => {
  it('移除危險標籤與事件屬性', () => {
    assert.equal(sanitizeArticleContent('<script>alert(1)</script>'), '')
    assert.equal(sanitizeArticleContent('<img src=x onerror=alert(1)>'), '')
    assert.equal(sanitizeArticleContent('<svg onload=alert(1)></svg>'), '')
  })

  it('移除危險連結協定並保留安全的連結文字', () => {
    assert.equal(
      sanitizeArticleContent('<a href="javascript:alert(1)">test</a>'),
      '<a rel="noopener noreferrer">test</a>',
    )
    assert.equal(
      sanitizeArticleContent('<a href="data:text/html,bad">data</a>'),
      '<a rel="noopener noreferrer">data</a>',
    )
    assert.equal(
      sanitizeArticleContent('<a href="vbscript:msgbox(1)">vbscript</a>'),
      '<a rel="noopener noreferrer">vbscript</a>',
    )
  })

  it('保留允許的 rich text 與安全連結設定', () => {
    assert.equal(
      sanitizeArticleContent('<p>Hello <strong>runner</strong></p>'),
      '<p>Hello <strong>runner</strong></p>',
    )
    assert.equal(
      sanitizeArticleContent(
        '<a href="https://example.com" target="_blank" onclick="alert(1)" style="color:red">safe</a>',
      ),
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">safe</a>',
    )
  })
})
