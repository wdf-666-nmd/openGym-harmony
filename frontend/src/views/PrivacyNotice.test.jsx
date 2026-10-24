// 隐私政策提示的两轮审核约束：
// v3 轮（AGC 7.5）：「应用在首次启动、注册登录界面均未明确提示用户阅读隐私政策」
//   → 首启页/登录页/注册页三处内联显著提示（LegalNotice）。
// v9 轮驳回：「应用出现两个隐私弹窗……您已接入平台隐私托管服务，建议您删除自行构建的
//   隐私声明弹窗」→ 自建首启弹窗（WelcomeSheet/LegalNoticeDialog）删除，首启只剩平台系统弹窗。
// 这份测试钉住：① 不再有任何自建首启隐私弹窗；② 三处内联显著提示仍在；③ 政策正文自带在应用内。
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8')

describe('privacy policy notice (AGC 7.5 + v9 双弹窗驳回)', () => {
  it('不再有自建首启隐私弹窗：无 LegalNoticeDialog / WelcomeSheet / 一次性标记', () => {
    const src = read('../components/PrivacyPolicy.jsx')
    expect(src).not.toMatch(/LegalNoticeDialog/)
    expect(src).not.toMatch(/WelcomeSheet/)
    expect(src).not.toMatch(/gym_legal_notice_v1/)
    // 组件不再自动开 sheet：无 mount 副作用；政策 sheet 只能由用户点链接打开（openPrivacyPolicy/openTerms）
    expect(src).not.toMatch(/useEffect/)
  })

  it('App 根部不再挂载任何隐私弹窗（首启只留平台系统弹窗）', () => {
    const src = read('../App.jsx')
    expect(src).not.toMatch(/LegalNoticeDialog/)
    expect(src).not.toMatch(/from '\.\/components\/PrivacyPolicy\.jsx'/)
  })

  it('首启页 MobileOnboarding 有隐私政策显著提示', () => {
    const src = read('./MobileOnboarding.jsx')
    expect(src).toMatch(/import\s*\{\s*LegalNotice\s*\}/)
    expect(src).toMatch(/<LegalNotice\s*\/>/)
  })

  it('登录页与注册 sheet 都有隐私政策显著提示', () => {
    const src = read('./Login.jsx')
    expect(src).toMatch(/import\s*\{\s*LegalNotice\s*\}/)
    // 两处：登录主界面一处 + 注册 sheet 一处
    const uses = src.match(/<LegalNotice\s*\/>/g) || []
    expect(uses.length).toBeGreaterThanOrEqual(2)
  })

  it('政策正文自带在应用内（单机应用不依赖外链可达性）', () => {
    const src = read('../components/PrivacyPolicy.jsx')
    expect(src).toMatch(/export function PrivacyPolicySheet/)
    expect(src).toMatch(/export function TermsSheet/)
    expect(src).toMatch(/export function LegalNotice\b/)
    // 不收集个人信息的核心承诺必须在正文里
    expect(src).toContain('does not collect, upload or share')
  })

  it('AGC 表单用的官方托管地址是 GitHub Pages（不是会乱码的 jsdelivr）', () => {
    const src = read('../components/PrivacyPolicy.jsx')
    expect(src).toContain('PRIVACY_URL')
    expect(src).toMatch(/wdf-666-nmd\.github\.io\/opengym-legal\/privacy-policy\.html/)
    // jsdelivr 对 .html 返回 301 → raw.githubusercontent（text/plain），打开是乱码——不得再用
    expect(src).not.toMatch(/cdn\.jsdelivr\.net[^\s'"]*privacy-policy\.html/)
  })
})
