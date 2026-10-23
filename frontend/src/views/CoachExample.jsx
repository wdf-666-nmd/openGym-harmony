// What the Coach does, without a key — a read-only sample for a reviewer, or anyone curious.
//
// AGC rejected the app because the Coach needs the user's own provider key, so a reviewer could
// not see it work. This screen answers that: it runs the real pipeline over a self-contained
// example profile (lib/coach-example.js) with a canned provider, and shows the result. Nothing
// here touches the user's own training log, and nothing is ever applied — it is a look, not a run.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { t } from '../lib/i18n.js'
import { fmtNum } from '../lib/format.js'
import { changeTitle, changeValues, exName } from '../lib/coach.js'
import { samplePlan, sampleReview, sampleStatus, exampleState } from '../lib/coach-example.js'
import Icon from '../components/Icon.jsx'
import { Button, Section, Row } from '../components/ui.jsx'
import '../coach.css'

// The canned provider takes a moment on purpose ("the Coach is thinking…"); this screen polls
// the same status shape a live run reports.
const POLL_MS = 700

export default function CoachExample() {
  const nav = useNavigate()
  const [S, setS] = useState(null)
  const [kind, setKind] = useState(null)       // 'create' | 'review' | null
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(null)
  const [error, setError] = useState(null)
  const poll = useRef(null)

  useEffect(() => { exampleState().then(setS).catch(() => {}) }, [])
  useEffect(() => () => clearTimeout(poll.current), [])

  const run = async which => {
    if (busy) return
    setBusy(true); setError(null); setPending(null); setKind(which)
    try {
      if (which === 'create') await samplePlan(null)
      else await sampleReview()
      // Poll until the canned job lands its proposal.
      const tick = async () => {
        let st = null
        try { st = await sampleStatus() } catch { /* keep polling */ }
        if (st?.pending) { setPending(st.pending); setBusy(false); return }
        if (st?.lastError) { setError(st.lastError.errorClass || 'internal'); setBusy(false); return }
        poll.current = setTimeout(tick, POLL_MS)
      }
      poll.current = setTimeout(tick, POLL_MS)
    } catch (e) {
      // A refused start (no routine to review, say) carries its own line.
      setError(e?.data?.code || e?.code || 'internal'); setBusy(false)
    }
  }

  const errorLine = cls => t(cls === 'noroutine'
    ? 'There’s no routine to review yet — the example profile has one, so this is unexpected.'
    : 'The example could not be built. Try again.')

  const plan = pending?.kind === 'create' ? pending : null
  const review = pending?.kind === 'review' ? pending : null

  return <div className="narrow">
    <div className="hdr">
      <button className="iconbtn" onClick={() => nav('/coach/setup')} aria-label={t('Back')}><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginInlineStart: 10 }}><h1>{t('See the Coach in action')}</h1></div>
    </div>

    <div className="card small muted" style={{ marginBottom: 14, lineHeight: 1.6 }}>
      {t('This runs the Coach on an example profile, with a built-in stand-in provider — no API key, no account, nothing sent anywhere. It is here so you can see what the Coach does before setting up your own key.')}
    </div>

    <Section title={t('Try it')}>
      <Button variant="primary" icon="sparkles" disabled={busy || !S} onClick={() => run('create')}>{busy && kind === 'create' ? t('Thinking…') : t('Show me a plan')}</Button>
      <div style={{ height: 10 }} />
      <Button icon="chartLine" disabled={busy || !S} onClick={() => run('review')}>{busy && kind === 'review' ? t('Thinking…') : t('Review my training')}</Button>
    </Section>

    {busy && <div className="card small muted"><Row icon="hourglass" iconTint="var(--acc)" title={t('The Coach is reading the example profile…')} /></div>}

    {error && <div className="card small" style={{ color: 'var(--red)' }}>{errorLine(error)}</div>}

    {plan && <Section title={t('A plan for the example profile')}>
      <div className="card small" style={{ textAlign: 'start', lineHeight: 1.6, marginBottom: 12 }}>{plan.summary}</div>
      {(plan.bundle?.routines || []).map(r => <Row key={r.id} icon="clipboard" iconTint="var(--green)" title={r.name}
        subtitle={(r.ex || []).map(e => exName(e.id)).join(' · ')} />)}
      <div className="dim small" style={{ marginTop: 8 }}>{t('In the app, one tap imports this into your plan. The example is read-only, so nothing is changed here.')}</div>
    </Section>}

    {review && <Section title={t('A review of the example training')}>
      <div className="card small" style={{ textAlign: 'start', lineHeight: 1.6, marginBottom: 12 }}>{review.summary}</div>
      {(review.changes || []).map(c => <Row key={c.id} icon="swap" iconTint="var(--blue)" title={changeTitle(c, S)} subtitle={changeValues(c, S)} />)}
      {(review.notes || []).map((n, i) => <div key={i} className="card small muted" style={{ marginTop: 8, textAlign: 'start', lineHeight: 1.6 }}>{n}</div>)}
    </Section>}

    {pending?.evidence && <div className="dim small" style={{ textAlign: 'center' }}>
      {t('Based on {0} example sessions.', fmtNum(pending.evidence.sessions || 0))}
    </div>}
  </div>
}