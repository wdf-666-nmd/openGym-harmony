// AGC 9.5 整改：应用内容里的品牌名必须与提交名称一致（驳回原文："请务必同步更新应用介绍、应用内容及应用安装包的名称配置"）。
// 这里钉住首启页：大标题 = 开练手账；可见文案里不再出现 openGym 品牌名（自托管服务器描述属技术指代，保留）。
import { describe, expect, it, vi } from 'vitest'

vi.mock('../lib/api.js', () => ({ api: vi.fn() }))
vi.mock('./useUI.js', () => ({ useUI: { getState: () => ({ toast: vi.fn(), openSheet: vi.fn() }) } }))

describe('MobileOnboarding brand name (AGC 9.5)', () => {
  it('大标题显示提交名称「开练手账」，不是 openGym', async () => {
    const src = await import('node:fs').then(fs =>
      fs.readFileSync(new URL('./MobileOnboarding.jsx', import.meta.url), 'utf8'))
    // 首启页大标题那一段不得再是裸的 openGym
    const h1 = src.match(/<h1[^>]*>([^<]*)<\/h1>/)
    expect(h1, '首启页应有一个 h1 大标题').toBeTruthy()
    expect(h1[1]).not.toBe('openGym')
    expect(h1[1]).toContain('开练手账')
  })

  it('首启页可见文案不含 openGym 品牌名（除自托管服务器技术指代）', async () => {
    const src = await import('node:fs').then(fs =>
      fs.readFileSync(new URL('./MobileOnboarding.jsx', import.meta.url), 'utf8'))
    const tCalls = [...src.matchAll(/t\('([^']+)'\)/g)].map(m => m[1])
    const brandHits = tCalls.filter(s => /openGym/.test(s))
    // 允许保留：指用户自己的 openGym 服务器（技术描述）
    const offenders = brandHits.filter(s => !/openGym (site|server)/.test(s))
    expect(offenders, '这些文案仍含 openGym 品牌名：' + JSON.stringify(offenders)).toEqual([])
  })

  it('首页顶部标题：无用户时显示「开练手账」，不是 openGym', async () => {
    const src = await import('node:fs').then(fs =>
      fs.readFileSync(new URL('./Home.jsx', import.meta.url), 'utf8'))
    expect(src, '首页 h1 仍硬编码 openGym 品牌名').not.toMatch(/\?\s*t\('Hi \{0\}',\s*user\.name\)\s*:\s*'openGym'/)
    expect(src).toContain(": t('开练手账')")
  })

  it('登录页大标题显示「开练手账」，不是 openGym', async () => {
    const src = await import('node:fs').then(fs =>
      fs.readFileSync(new URL('./Login.jsx', import.meta.url), 'utf8'))
    const h1 = src.match(/<h1[^>]*>([^<]*)<\/h1>/)
    expect(h1, '登录页应有 h1 大标题').toBeTruthy()
    expect(h1[1]).not.toBe('openGym')
    expect(h1[1]).toContain('开练手账')
  })

  it('分享图的默认标题用「开练手账」，不是 openGym', async () => {
    const src = await import('node:fs').then(fs =>
      fs.readFileSync(new URL('../sheets.jsx', import.meta.url), 'utf8'))
    expect(src, '分享默认名仍含 openGym 品牌名').not.toMatch(/w\.name\s*\|\|\s*'openGym'/)
  })

  it('设置页底部署名用「开练手账 v…」，不是 openGym v…', async () => {
    const src = await import('node:fs').then(fs =>
      fs.readFileSync(new URL('./Settings.jsx', import.meta.url), 'utf8'))
    expect(src, '设置页署名仍含 openGym 品牌名').not.toMatch(/sp-version">openGym v/)
  })
})
