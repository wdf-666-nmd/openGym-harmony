// 隐私政策 / 用户协议（AGC 7.5 整改）
//
// 审核意见原文：「应用在首次启动、注册登录界面均未明确提示用户阅读隐私政策，不符合相关法律法规要求。
// 修改建议：请在应用首次启动时通过弹出隐私政策弹窗，或在应用注册、登录界面展示隐私政策等显著方式，
// 提示用户阅读隐私政策。」
//
// 做法：政策正文自带在应用内（本应用是单机应用，不依赖外网可达性——审核员的测试环境未必能打开外链），
// 首启弹出弹窗，并在首启页、登录页、注册页三处展示显著提示入口。恒定的官方托管地址另作常量导出，
// 供 AGC「隐私声明」表单与市场复核引用。
import { useEffect } from 'react'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { Button } from './ui.jsx'

// 首启弹窗只弹一次：审核要求「首次启动时通过弹出隐私政策弹窗」明确提示。
const NOTICE_KEY = 'gym_legal_notice_v1'
const noticeSeen = () => { try { return localStorage.getItem(NOTICE_KEY) === '1' } catch { return false } }
const markNoticeSeen = () => { try { localStorage.setItem(NOTICE_KEY, '1') } catch { /* 下次再弹 */ } }

// AGC「隐私声明 → 隐私政策网址」应填这两个地址。
// 用 GitHub Pages 直出（Content-Type: text/html）；jsdelivr 现对 .html 返回 301 跳转到
// raw.githubusercontent.com 并回 text/plain，浏览器打开是源码乱码——这是上一版被驳回的根因。
export const PRIVACY_URL = 'https://wdf-666-nmd.github.io/opengym-legal/privacy-policy.html'
export const TERMS_URL = 'https://wdf-666-nmd.github.io/opengym-legal/user-agreement.html'

export const openPrivacyPolicy = () => useUI.getState().openSheet(close => <PrivacyPolicySheet close={close} />)
export const openTerms = () => useUI.getState().openSheet(close => <TermsSheet close={close} />)

// 一处可点开的政策链接。用 role=link 而不是 href="#"：应用跑在 HashRouter 上，
// href="#" 会改写路由 hash 而不是打开页面。
function LegalLink({ onClick, children }) {
  return (
    <a role="link" tabIndex={0} style={{ color: 'var(--acc)', cursor: 'pointer', textDecoration: 'underline' }}
      onClick={e => { e.preventDefault(); onClick() }}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}>
      {children}
    </a>
  )
}

// 登录页 / 注册页 / 首启页底部共用的显著提示。
export function LegalNotice({ style }) {
  return (
    <div className="dim small" style={{ marginTop: 20, lineHeight: 1.6, ...style }}>
      <div>{t('Please read and agree to the following before using the app.')}</div>
      <div style={{ marginTop: 6 }}>
        <LegalLink onClick={openPrivacyPolicy}>{t('Privacy Policy')}</LegalLink>
        {' · '}
        <LegalLink onClick={openTerms}>{t('Terms of Service')}</LegalLink>
      </div>
    </div>
  )
}

function Clause({ heading, children }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 600 }}>{heading}</div>
      <div className="muted" style={{ marginTop: 2 }}>{children}</div>
    </div>
  )
}

export function PrivacyPolicySheet({ close }) {
  return (
    <>
      <h3>{t('Privacy Policy')}</h3>
      <div className="dim small" style={{ marginBottom: 12 }}>{t('Effective date: 21 October 2026')}</div>
      <div className="card small" style={{ textAlign: 'start', lineHeight: 1.7 }}>
        <p style={{ marginTop: 0, fontWeight: 600 }}>{t('This is an offline app. It does not collect, upload or share any of your personal information.')}</p>
        <p className="muted">{t('Everything you enter — training plans, workout logs, body weight — is stored only on this device.')}</p>
        <Clause heading={t('1. Information we collect')}>{t('None. No account, no ads, no third-party SDK, no analytics.')}</Clause>
        <Clause heading={t('2. Where your data lives')}>{t('In this app’s private storage on your device. It is deleted when you clear the app’s data or uninstall it.')}</Clause>
        <Clause heading={t('3. Permissions and their use')}>{t('Network: only when you choose to sync with a server you configured yourself. Vibration: feedback for training timers and reminders.')}</Clause>
        <Clause heading={t('4. Sharing with third parties')}>{t('None. Your data is never shared, sold or disclosed to anyone.')}</Clause>
        <Clause heading={t('5. Your rights')}>{t('You can export, edit or delete all of your data at any time from within the app.')}</Clause>
        <Clause heading={t('6. Minors')}>{t('The app is not directed at children and collects no one’s information.')}</Clause>
        <Clause heading={t('7. Changes')}>{t('Any change to this policy will be shown in the app and on the policy page, with a new effective date.')}</Clause>
        <Clause heading={t('8. Contact')}>{t('Questions or complaints: {0}', '911882832@qq.com')}</Clause>
        <div className="dim small" style={{ marginTop: 14 }}>{t('Developer: He Yisheng · App: 开练手账')}</div>
      </div>
      <div style={{ height: 12 }} />
      <Button variant="primary" onClick={close}>{t('I have read and agree')}</Button>
    </>
  )
}

export function TermsSheet({ close }) {
  return (
    <>
      <h3>{t('Terms of Service')}</h3>
      <div className="dim small" style={{ marginBottom: 12 }}>{t('Effective date: 17 October 2026')}</div>
      <div className="card small" style={{ textAlign: 'start', lineHeight: 1.7 }}>
        <p style={{ marginTop: 0 }}>{t('This app is an open-source workout tracker (AGPL-3.0). Using it means you accept these terms.')}</p>
        <Clause heading={t('1. The service')}>{t('Training plans, workout logging, an exercise library, statistics and reminders — all working offline on this device.')}</Clause>
        <Clause heading={t('2. Your responsibility')}>{t('Training content is for reference only and is not medical advice. Back up your data yourself; we cannot recover what we never held.')}</Clause>
        <Clause heading={t('3. Open-source licence')}>{t('Released under AGPL-3.0. The original openGym project keeps its copyright; this adaptation is licensed the same way.')}</Clause>
        <Clause heading={t('4. Disclaimer')}>{t('Provided “as is”, without warranty. The developer is not liable for any loss arising from use of the app.')}</Clause>
        <Clause heading={t('5. Contact')}>{t('Questions or complaints: {0}', '911882832@qq.com')}</Clause>
        <div className="dim small" style={{ marginTop: 14 }}>{t('Developer: He Yisheng · App: 开练手账')}</div>
      </div>
      <div style={{ height: 12 }} />
      <Button variant="primary" onClick={close}>{t('I have read and agree')}</Button>
    </>
  )
}
// 首次启动弹窗（AGC 7.5 整改）：应用加载时若从未同意过，弹中心对话框显著提示阅读隐私政策。
// 同意后写一次性标记，之后不再弹。开发期可用 localStorage.removeItem('gym_legal_notice_v1') 复位。
//
// 走 openSheet(kind:'center', locked) 而不是裸 .mback/.center：与全应用同一套 sheet 层级，
// 遮罩、back 键、滚动都继承；locked 让它只能由「同意并继续」关闭（审核要求的是明确同意）。
function WelcomeSheet({ close }) {
  const agree = () => { markNoticeSeen(); close() }
  return (
    <>
      <h3>{t('Welcome to 开练手账')}</h3>
      <div className="muted small" style={{ lineHeight: 1.7, textAlign: 'start' }}>
        {t('Before you start, please read and agree to our Privacy Policy and Terms of Service.')}
      </div>
      <div style={{ marginTop: 10, textAlign: 'start' }}>
        <LegalLink onClick={openPrivacyPolicy}>{t('Privacy Policy')}</LegalLink>
        {' · '}
        <LegalLink onClick={openTerms}>{t('Terms of Service')}</LegalLink>
      </div>
      <div style={{ height: 16 }} />
      <Button variant="primary" onClick={agree}>{t('Agree and continue')}</Button>
    </>
  )
}

// 挂在 App 根部；首次启动（从未同意过）时弹一次。
// 模块级去重：React StrictMode 在开发下会 effect→cleanup→effect 跑两遍，用 ref 会被 cleanup 干扰，
// 用模块级 flag 保证只开一个 sheet。
let dialogShown = false
export function LegalNoticeDialog() {
  useEffect(() => {
    if (dialogShown || noticeSeen()) return
    dialogShown = true
    useUI.getState().openSheet(close => <WelcomeSheet close={close} />, { kind: 'center', locked: true })
  }, [])
  return null
}
