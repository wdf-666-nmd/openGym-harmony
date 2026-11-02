import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scanCode, importCodeFromImage } from './scan.js'

// In the test environment VITE_MOBILE is unset, so MOBILE is false — the same as a web build.
// The native ML Kit scanner must refuse to run there rather than reach for a plugin that isn't
// present; the view opens the browser camera sheet instead. (On-device decoding is exercised by
// hand; the browser decoder has its own round-trip test in scan-web.test.js.)

describe('scan off mobile', () => {
  it('scanCode rejects — the native scanner is app-only', async () => {
    await expect(scanCode()).rejects.toThrow(/only available in the app/)
  })

  it('importCodeFromImage takes the browser path and is a no-op without a file', async () => {
    expect(await importCodeFromImage(null)).toBeNull()
  })
})

// HarmonyOS regression (AGC audit on 1.0.9, Mate 80 RS / API 24): the mlkit plugin has no
// native build there, @capacitor/core falls back to its web JS whose isSupported() checks for
// BarcodeDetector (absent in ArkWeb), and every scan answered「此设备不支持扫描」. On HarmonyOS
// the scan must throw the `harmony-web-scan` marker (the view opens its web camera sheet) and
// photo import must decode with jsQR instead of touching the plugin.
describe('scan on HarmonyOS', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  async function asHarmony() {
    vi.doMock('./mobile.js', () => ({ MOBILE: true }))
    vi.doMock('@capacitor/core', () => ({
      Capacitor: { getPlatform: () => 'harmony' },
    }))
    return import('./scan.js')
  }

  it('scanCode throws harmony-web-scan (the view opens its web camera sheet)', async () => {
    const scan = await asHarmony()
    await expect(scan.scanCode()).rejects.toThrow('harmony-web-scan')
  })

  it('importCodeFromImage decodes via scan-web (jsQR), never touching mlkit', async () => {
    const web = { importCodeFromImageWeb: async () => ({ value: 'HTTP://GYM/42', fmt: 'qrcode' }) }
    vi.doMock('./mobile.js', () => ({ MOBILE: true }))
    vi.doMock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => 'harmony' } }))
    vi.doMock('./scan-web.js', () => web)
    let mlkitTouched = false
    vi.doMock('@capacitor-mlkit/barcode-scanning', () => {
      mlkitTouched = true
      return { BarcodeScanner: {} }
    })
    const scan = await import('./scan.js')
    const file = { name: 'card.jpg' }
    const out = await scan.importCodeFromImage(file)
    expect(mlkitTouched).toBe(false)
    expect(out).toEqual({ value: 'HTTP://GYM/42', fmt: 'qrcode' })
  })
})
