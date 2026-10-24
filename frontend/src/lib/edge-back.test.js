// 边缘滑动=返回（AGC「自定义手势与系统手势冲突」整改）：WebView 把边缘横滑交给页面时，
// 页面自己把它当返回。这份测试钉住判定函数的边界。
import { describe, expect, it } from 'vitest'
import { isEdgeBackSwipe, EDGE_BACK_PX, EDGE_BACK_MIN_DX } from './mobile.js'

const W = 390   // 手机宽
const in_ = (x0, y0, x1, y1, over = {}) => isEdgeBackSwipe({ startX: x0, startY: y0, endX: x1, endY: y1, innerWidth: W, ...over })

describe('isEdgeBackSwipe (edge-swipe back)', () => {
  it('左缘起点、向右滑 → 返回', () => {
    expect(in_(8, 1200, 260, 1200)).toBe(true)
  })
  it('右缘起点、向左滑 → 返回', () => {
    expect(in_(384, 800, 120, 804)).toBe(true)
  })
  it('边缘起点但滑动太短 → 不是（留给行滑动/点按）', () => {
    expect(in_(8, 1200, 8 + EDGE_BACK_MIN_DX - 1, 1200)).toBe(false)
  })
  it('边缘起点但主要是纵向滚动 → 不是', () => {
    expect(in_(8, 400, 100, 1400)).toBe(false)
  })
  it('页面中部起点的横滑（行滑动）→ 永不劫持', () => {
    expect(in_(100, 800, 330, 802)).toBe(false)
    expect(in_(W - 100, 800, 60, 802)).toBe(false)
  })
  it('起点恰在阈值上仍算边缘；宽屏参数可覆盖', () => {
    expect(in_(EDGE_BACK_PX, 600, 260, 600)).toBe(true)
    expect(in_(30, 600, 260, 600, { edge: 32 })).toBe(true)
  })
})
