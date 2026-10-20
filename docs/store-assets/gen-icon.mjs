// 开练日记 · 自绘品牌图标生成器（纯代码，零外部素材，版权完全归属本项目）
// 概念：一本「训练日记」——左侧书脊 + 右侧翻开的书页，页面上排一列日程勾选格，
// 最后一格高亮「打卡完成」。健身房配色（黑底 + 荧光绿），极简扁平，小尺寸可辨。
// 产物：app-icon-1024.png（母图）→ 512 / 216 两档导出。
// 运行：node scripts/gen-icon.mjs（在 frontend 目录外亦可，路径以脚本内常量为准）
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = here;

const W = 1024, H = 1024;
const px = Buffer.alloc(W * H * 4);

// ---- 调色板（纯扁平色，无渐变无描边，儿童/无障碍场景也干净的对比度）----
const BG   = [12, 14, 18, 255];    // 近黑（#0c0e12，与 app theme-color 一致）
const BOOK = [240, 242, 245, 255]; // 书体暖白
const EDGE = [200, 204, 210, 255]; // 书脊阴影灰
const INK  = [26, 30, 36, 255];    // 页面墨色（勾选格描线）
const ACC  = [57, 220, 130, 255];  // 荧光绿高亮（打卡完成）

// ---- 像素画布 ----
function set(x, y, c) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 4;
  px[i] = c[0]; px[i+1] = c[1]; px[i+2] = c[2]; px[i+3] = c[3];
}
function rect(x0, y0, w, h, c) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, c);
}
function strokeRect(x0, y0, w, h, t, c) {
  rect(x0, y0, w, t, c); rect(x0, y0 + h - t, w, t, c);
  rect(x0, y0, t, h, c); rect(x0 + w - t, y0, t, h, c);
}
// 圆角矩形填充（逐像素距离判断，图标级精度足够）
function roundRect(x0, y0, w, h, r, c) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const dx = Math.max(x0 + r - x, x - (x0 + w - 1 - r), 0);
    const dy = Math.max(y0 + r - y, y - (y0 + h - 1 - r), 0);
    if (dx*dx + dy*dy <= r*r) set(x, y, c);
  }
}
// 勾选符号（折线，粗 t）
function checkmark(cx, cy, s, t, c) {
  for (let u = 0; u <= s; u++) {
    // 短臂：左下往中上
    for (let k = -t/2; k <= t/2; k++) set(cx - s + u, cy + s/2 - u + k, c);
    // 长臂：中上往右下
    for (let k = -t/2; k <= t/2; k++) set(cx + u, cy + s/2 - u - u/2 + k, c);
  }
}

// ---- 构图（1024 画布，安全区内布局；四周留 ~128 边距防止 AGC 圆角裁切吃内容）----
const M = 128;                        // 外边距
const bookX = M, bookY = M + 40;      // 书体左上
const bookW = W - 2 * M, bookH = H - 2 * M - 40;

// 1) 底色（AGC 透明背景兼容：实底，不靠 alpha）
rect(0, 0, W, H, BG);

// 2) 书脊（左侧竖条，视觉厚度）
roundRect(bookX, bookY, bookW, bookH, 48, EDGE);
// 3) 书体主体（右移留出书脊层次）
roundRect(bookX + 72, bookY, bookW - 72, bookH, 48, BOOK);

// 4) 日程勾选行（页面右侧 2/3 区域，4 行）
const pageX = bookX + 72 + 90, pageW = bookW - 72 - 2 * 90;
const rowH = 96, gap = 62;
const rows = Math.floor((bookH - 2 * 120) / (rowH + gap));
for (let i = 0; i < rows; i++) {
  const y = bookY + 120 + i * (rowH + gap);
  const isLast = i === rows - 1;
  const box = 96;
  // 勾选框（墨色描线；末行填充荧光绿）
  if (isLast) {
    roundRect(pageX, y + (rowH - box) / 2, box, box, 20, ACC);
    checkmark(pageX + box/2, y + rowH/2 - 10, 26, 14, INK);
  } else {
    strokeRect(pageX, y + (rowH - box) / 2, box, box, 12, INK);
    // 已勾行：框内小勾（墨色，弱化）
    if (i >= rows - 2) checkmark(pageX + box/2, y + rowH/2 - 10, 22, 12, INK);
  }
  // 行文字条（墨色实条示意日记文字，末行荧光绿）
  rect(pageX + box + 48, y + rowH/2 - 18, pageW - box - 48, 36, isLast ? ACC : INK);
}

// ---- PNG 编码（无依赖手写：IHDR/IDAT/IEND，RGBA8）----
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c;
    }
  }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8bit RGBA
  // 行滤波 + 压缩
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}
// 盒式缩放（512/216 直接整数步采样，不引入平滑假色）
function downscale(src, sw, sh, dw, dh) {
  const out = Buffer.alloc(dw * dh * 4);
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    const sx = Math.floor(x * sw / dw), sy = Math.floor(y * sh / dh);
    const si = (sy * sw + sx) * 4, di = (y * dw + x) * 4;
    out[di] = src[si]; out[di+1] = src[si+1]; out[di+2] = src[si+2]; out[di+3] = src[si+3];
  }
  return out;
}

// ---- 导出三档 ----
const png1024 = encodePNG(W, H, px);
writeFileSync(join(OUT_DIR, 'app-icon-1024.png'), png1024);
writeFileSync(join(OUT_DIR, 'app-icon-512.png'), encodePNG(512, 512, downscale(px, W, H, 512, 512)));
writeFileSync(join(OUT_DIR, 'app-icon-216.png'), encodePNG(216, 216, downscale(px, W, H, 216, 216)));
console.log('生成完成：app-icon-1024/512/216.png（开练日记 · 训练日记本+日程打卡）');
