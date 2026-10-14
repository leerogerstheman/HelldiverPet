/**
 * 用 Web Audio 现场合成音效 —— 不依赖任何音频素材文件。
 * 所有声音都是短促的提示音，音量刻意压低，避免打扰。
 */

(function () {
let ctx = null;
let enabled = true;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function setEnabled(v) {
  enabled = !!v;
}

/** 单个音符 */
function tone({ freq = 440, dur = 0.12, type = 'square', gain = 0.06, delay = 0, slideTo = null, attack = 0.005 }) {
  if (!enabled) return;
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);

  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** 噪声脉冲（爆炸 / 落地） */
function noise({ dur = 0.3, gain = 0.09, delay = 0, lp = 900, hp = 40 }) {
  if (!enabled) return;
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const frames = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 2.2);
  }
  const src = c.createBufferSource();
  src.buffer = buf;

  const lpF = c.createBiquadFilter();
  lpF.type = 'lowpass';
  lpF.frequency.setValueAtTime(lp * 3, t0);
  lpF.frequency.exponentialRampToValueAtTime(lp, t0 + dur);

  const hpF = c.createBiquadFilter();
  hpF.type = 'highpass';
  hpF.frequency.value = hp;

  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  src.connect(hpF).connect(lpF).connect(g).connect(c.destination);
  src.start(t0);
}

/* ------------------------------------------------------------- 导出音效 */

const sfx = {
  /** 点击应答 */
  click() {
    tone({ freq: 620, dur: 0.06, gain: 0.045 });
    tone({ freq: 930, dur: 0.07, gain: 0.035, delay: 0.05 });
  },

  /** 敬礼 */
  salute() {
    tone({ freq: 520, dur: 0.07, gain: 0.045 });
    tone({ freq: 780, dur: 0.09, gain: 0.04, delay: 0.07 });
    tone({ freq: 1040, dur: 0.12, gain: 0.03, delay: 0.15 });
  },

  /** 跳跃 */
  jump() {
    tone({ freq: 320, dur: 0.16, gain: 0.05, type: 'sine', slideTo: 760 });
  },

  /** 落地 */
  land() {
    noise({ dur: 0.14, gain: 0.06, lp: 420 });
    tone({ freq: 150, dur: 0.1, gain: 0.04, type: 'sine', slideTo: 70 });
  },

  /** 战略配备输入提示音（每个按键一声） */
  stratagemKey(i) {
    tone({ freq: 700 + i * 55, dur: 0.045, gain: 0.032 });
  },

  /** 轨道炮击 */
  orbital() {
    tone({ freq: 120, dur: 0.6, gain: 0.09, type: 'sawtooth', slideTo: 42 });
    noise({ dur: 0.7, gain: 0.11, lp: 700 });
  },

  /** 呼叫增援 */
  reinforce() {
    tone({ freq: 440, dur: 0.1, gain: 0.05 });
    tone({ freq: 660, dur: 0.1, gain: 0.05, delay: 0.1 });
    tone({ freq: 880, dur: 0.18, gain: 0.05, delay: 0.2 });
  },

  /** 拒绝 / 错误 */
  deny() {
    tone({ freq: 220, dur: 0.14, gain: 0.05, type: 'sawtooth', slideTo: 140 });
  },

  /** 心情好（被夸） */
  happy() {
    [660, 880, 1100].forEach((f, i) => tone({ freq: f, dur: 0.1, gain: 0.04, delay: i * 0.07 }));
  },

  /** 加特林扫射：低频噪声 + 快速脉冲 */
  hmg() {
    if (!enabled) return;
    noise({ dur: 1.6, gain: 0.055, lp: 1400, hp: 90 });
    for (let i = 0; i < 9; i++) {
      tone({ freq: 90 + (i % 3) * 18, dur: 0.05, gain: 0.028, delay: i * 0.16, type: 'square' });
    }
  },

  /** 晋升：上行三连音 + 一记重音 */
  promote() {
    [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.14, gain: 0.05, delay: i * 0.1 }));
    noise({ dur: 0.3, gain: 0.05, lp: 1200, delay: 0.42 });
  },

  /** 提神剂：快速上滑 + 玻璃感的高频 */
  stim() {
    tone({ freq: 380, dur: 0.22, gain: 0.05, type: 'sine', slideTo: 1500 });
    tone({ freq: 2400, dur: 0.18, gain: 0.02, type: 'triangle', delay: 0.12, slideTo: 900 });
  },

  /** 拖着走：短促的摩擦声 */
  grab() {
    tone({ freq: 180, dur: 0.09, gain: 0.035, type: 'sawtooth', slideTo: 320 });
  },
};

// 首次交互解锁音频上下文（浏览器自动播放策略）
['pointerdown', 'keydown'].forEach((evt) =>
  window.addEventListener(evt, () => ac(), { once: true, passive: true }),
);

window.SFX = { setEnabled, sfx };
})();
