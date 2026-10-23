// 桌面名守卫（防 AGC 1.20/9.5 品牌回退）
//
// 背景：capacitor-harmony 的 `cap sync` 会用 capacitor.config.json 的 harmony.appLabel
// （缺省回退 appName）覆写 harmony 工程里的桌面名（configure.js:67,81-84）。
// 曾出现 appLabel 仍是旧值 openGym → 每次 build:harmony 都把桌面名覆写回 openGym，
// 导致包内桌面名与市场名「开练手账」不一致（HANDOFF 记载 v4 包就是这么坏过一次）。
//
// 这份测试不跑 cap sync，只钉住两处「真相源」一致：配置文件与工程内 string.json。
// 一旦谁被改回，这里先红。
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const BRAND = '开练手账'
const read = p => readFileSync(new URL(p, import.meta.url), 'utf8')

describe('harmony 桌面名与市场名一致（开练手账）', () => {
  it('capacitor.config.json 的 harmony.appLabel 就是品牌名（cap sync 覆写的源头）', () => {
    const cfg = JSON.parse(read('../capacitor.config.json'))
    // appLabel 缺省回退 appName，但显式写错会覆盖——必须与 appName 同为一个品牌名
    expect(cfg.harmony?.appLabel).toBe(BRAND)
    expect(cfg.appName).toBe(BRAND)
  })

  it('AppScope string.json 的 app_name 是品牌名', () => {
    const j = JSON.parse(read('../harmony/AppScope/resources/base/element/string.json'))
    const appName = j.string.find(s => s.name === 'app_name')
    expect(appName?.value).toBe(BRAND)
  })

  it('entry string.json 的 EntryAbility_label 与 app_name 都是品牌名', () => {
    const j = JSON.parse(read('../harmony/entry/src/main/resources/base/element/string.json'))
    const map = Object.fromEntries(j.string.map(s => [s.name, s.value]))
    expect(map.EntryAbility_label).toBe(BRAND)
    expect(map.app_name).toBe(BRAND)
    // 不得残留旧品牌名
    expect(Object.values(map).some(v => /openGym/.test(v))).toBe(false)
  })

  it('版本号已递增到 1.0.5(1000005)', () => {
    const j = read('../harmony/AppScope/app.json5')
    expect(j).toMatch(/"versionCode":\s*1000005/)
    expect(j).toMatch(/"versionName":\s*"1\.0\.5"/)
  })
})