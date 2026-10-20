// 探针测试：鸿蒙 v2 审核驳回 3.1 的语言缺陷——中文系统首启必须显示中文。
// 场景：审核员全新安装（无存档 state），系统语言 zh-CN，无 DEFAULT_LANG（mobile 离线版无 /api/config）。
// 预期：effectiveLang 返回 'zh'（界面中文）。
// v2 现状（RED 预期）：navigator.languages 在 WebView 里通常为空数组，browserLangs() 回落
// navigator.language——若 WebView 也给空，则 'en' 兜底 → 全英文界面 → 驳回。
import { describe, expect, it } from 'vitest'

import { matchLocale } from '../lib/default-lang.js'
import { effectiveLang } from '../lib/default-lang.js'

describe('harmony audit 3.1: fresh install follows system language (zh)', () => {
  it('matchLocale resolves zh-CN to zh', () => {
    expect(matchLocale('zh-CN')).toBe('zh')
    expect(matchLocale('zh-Hans-CN')).toBe('zh')
  })

  it('a fresh marked copy with a zh-CN navigator shows Chinese', () => {
    const S = { lang: 'en', langAuto: true }
    // 模拟鸿蒙 WebView：languages 数组存在且含 zh-CN
    const r = effectiveLang(S, { default_lang: undefined }, ['zh-CN', 'en'])
    expect(r).toBe('zh')
  })

  it('a fresh marked copy with only navigator.language zh shows Chinese', () => {
    const S = { lang: 'en', langAuto: true }
    // languages 为空时 browserLangs 回落 [navigator.language]——这里直接传 ['zh']
    const r = effectiveLang(S, null, ['zh'])
    expect(r).toBe('zh')
  })

  it('an unmarked copy (v2 存量档案) keeps its stored language — 修复不翻旧账', () => {
    const S = { lang: 'en' }   // v2 用户存档：langAuto 不存在
    const r = effectiveLang(S, null, ['zh-CN'])
    expect(r).toBe('en')
  })
})
