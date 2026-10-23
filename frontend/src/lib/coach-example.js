// The Coach, with no API key — what a reviewer (or a curious user) can try before configuring anything.
//
// Why this exists: AppGallery review rejected the app because the Coach, the most interesting
// thing it does, needs the user's own provider key — so a reviewer had no way to see it run.
// The GitHub Pages demo build already answers the Coach's calls from a canned provider
// (lib/coach-demo.js); this reuses exactly that, over a self-contained example profile
// (lib/demoSeed.js), so the whole pipeline is real and only the provider is faked.
//
// Two promises this module keeps:
//   1. It never touches the store. The example profile is built here and kept here, so trying
//      the Coach can never read, write or dirty the user's own training log.
//   2. Nothing AI-shaped loads until the screen asks for an example — demoSeed and coach-demo
//      are both dynamic imports.

// The handful of display fields the canned provider reads off S (lib/coach-demo.js reads
// S.routines, S.workouts, S.unit, S.coach.profile). Kept inline so this module imports no
// store — that is what makes "the example never dirties your log" true by construction.
const BASE = { unit: 'kg', lang: null }

let state = null
let demo = null

/** The example profile the Coach runs against. Independent of the user's store. */
export async function exampleState() {
  if (state) return state
  const { buildDemoState } = await import('./demoSeed.js')
  state = {
    ...BASE,
    ...buildDemoState(),
    coach: {
      consent: { agreedAt: Date.now(), version: 2 },
      profile: { goal: 'build muscle', experience: 'intermediate', daysPerWeek: 3, sessionMin: 60, preferredDays: [1, 3, 5], equipment: [] }
    }
  }
  return state
}

async function demoMod() {
  demo = demo || await import('./coach-demo.js')
  return demo
}

/**
 * A plan, a review, or a debrief — one call, no key, no server. The provider is the canned one;
 * every step downstream (payload, prompt, validator, the proposal shape) is what a real run uses.
 */
export async function sampleStatus() { return (await demoMod()).demoStatus() }
export async function samplePlan(intake) { const S = await exampleState(); return (await demoMod()).demoPlan(S, intake) }
export async function sampleReview() { const S = await exampleState(); return (await demoMod()).demoReview(S) }
export async function sampleDebrief(workoutId) { const S = await exampleState(); return (await demoMod()).demoDebrief(S, workoutId) }
export async function sampleResolve() { return (await demoMod()).demoResolve() }

// Test seam.
export function _resetExample() { state = null; demo = null }