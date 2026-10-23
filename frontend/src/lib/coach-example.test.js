// AGC 驳回（问题1）：审核员打开「设置 → AI 教练」需要 API 密钥才能体验，无法审核。
// 修法：加一个免密钥的只读示例屏 —— 复用已有 demo provider（lib/coach-demo.js）跑在
// 自包含的示例档案上，审核员不填任何 key 就能看到教练产出方案。
//
// 这份测试钉住三条契约：
//   ① 示例档案自带训练数据，构建不需要任何 API 密钥；
//   ② 点「看示例计划」能产出一份可读方案（provider 是假的，流程是真的）；
//   ③ 只读示例：模块不接触用户的 store —— 真实训练数据零污染。
import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { exampleState, samplePlan, sampleStatus, _resetExample } from './coach-example.js'

const wait = ms => new Promise(r => setTimeout(r, ms))

describe('Coach 免密钥示例（AGC 审核体验）', () => {
  beforeEach(() => { _resetExample() })

  it('示例档案自带训练数据，构建不依赖任何 API 密钥', async () => {
    const S = await exampleState()
    expect((S.routines || []).length).toBeGreaterThan(0)
    expect((S.workouts || []).length).toBeGreaterThan(0)
    // 示例档案是独立对象，不是任何外部引用
    expect(await exampleState()).toBe(S)   // 缓存：同一份，不重复构建
  })

  it('点「看示例计划」产出一份可读方案（假 provider，真流程）', async () => {
    const r = await samplePlan(null)
    expect(r?.job?.kind).toBe('create')
    // demo provider 有 2.2s 的"思考"延迟
    await wait(2800)
    const st = await sampleStatus()
    expect(st.pending?.kind).toBe('create')
    expect(String(st.pending?.summary || '').length).toBeGreaterThan(0)
    expect((st.pending?.bundle?.routines || []).length).toBeGreaterThan(0)
  })

  it('只读示例：模块不接触用户 store（真实数据零污染）', () => {
    const src = readFileSync(new URL('./coach-example.js', import.meta.url), 'utf8')
    // 不 import store ⇒ 不可能写入用户的 S
    expect(src).not.toMatch(/store\/useStore/)
  })
})