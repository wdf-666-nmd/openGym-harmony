// AGC 7.5 整改：首次启动 / 注册登录界面必须显著提示用户阅读隐私政策。
// 驳回原文：「应用在首次启动、注册登录界面均未明确提示用户阅读隐私政策，不符合相关法律法规要求。」
// 这份测试钉住两件事：① 首启弹窗存在且能标记已读；② 首启页、登录页、注册页三处都有显著提示入口。
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'

vi.mock('../store/useStore.js', () => ({ useStore: Object.assign(() => ({}), { getState: () => ({}) }) }))
vi.mock('../store/useUI.js', () => ({ useUI: { getState: () => ({ openSheet: vi.fn(), toast: vi.fn() }) } }))
vi.mock('../lib/i18n.js', () => ({ t: (s, ...a) => a.length ? s.replace('{0}', a[0]) : s }))

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8')

describe('privacy policy notice (AGC 7.5)', () => {
  it('隐私政策组件导出首启弹窗与显著提示，且带一次性标记', async () => {
    const src = read('../components/PrivacyPolicy.jsx')
    expect(src).toMatch(/export function LegalNoticeDialog/)
    expect(src).toMatch(/export function LegalNotice/)
    // 首启只弹一次：写一次性 localStorage 标记
    expect(src).toContain("gym_legal_notice_v1")
    expect(src).toMatch(/localStorage\.setItem\(NOTICE_KEY/)
    // 走应用统一的 sheet 层级（kind:'center'），不是裸 .mback/.center
    expect(src).toMatch(/openSheet\([\s\S]*?kind:\s*'center'/)
  })

  it('首启弹窗挂在 App 根部（首次启动即弹）', async () => {
    const src = read('../App.jsx')
    expect(src).toMatch(/import\s*\{\s*LegalNoticeDialog\s*\}/)
    expect(src).toMatch(/<LegalNoticeDialog\s*\/>/)
  })

  it('首启页 MobileOnboarding 有隐私政策显著提示', async () => {
    const src = read('./MobileOnboarding.jsx')
    expect(src).toMatch(/import\s*\{\s*LegalNotice\s*\}/)
    expect(src).toMatch(/<LegalNotice\s*\/>/)
  })

  it('登录页与注册 sheet 都有隐私政策显著提示', async () => {
    const src = read('./Login.jsx')
    expect(src).toMatch(/import\s*\{\s*LegalNotice\s*\}/)
    // 两处：登录主界面一处 + 注册 sheet 一处
    const uses = src.match(/<LegalNotice\s*\/>/g) || []
    expect(uses.length).toBeGreaterThanOrEqual(2)
  })

  it('政策正文自带在应用内（单机应用不依赖外链可达性）', async () => {
    const src = read('../components/PrivacyPolicy.jsx')
    expect(src).toMatch(/export function PrivacyPolicySheet/)
    expect(src).toMatch(/export function TermsSheet/)
    // 不收集个人信息的核心承诺必须在正文里
    expect(src).toContain('does not collect, upload or share')
  })

  it('AGC 表单用的官方托管地址是 GitHub Pages（不是会乱码的 jsdelivr）', async () => {
    const src = read('../components/PrivacyPolicy.jsx')
    expect(src).toContain('PRIVACY_URL')
    expect(src).toMatch(/wdf-666-nmd\.github\.io\/opengym-legal\/privacy-policy\.html/)
    // jsdelivr 对 .html 返回 301 → raw.githubusercontent（text/plain），打开是乱码——不得再用
    expect(src).not.toMatch(/cdn\.jsdelivr\.net[^\s'"]*privacy-policy\.html/)
  })
})