/* 绝地潜兵桌宠 · 设置窗口逻辑 */
(function () {
  'use strict';

  const api = window.petAPI;
  const SKINS = (window.HD2 && window.HD2.SKINS) || [];
  const WEAPONS = (window.HD2 && window.HD2.WEAPONS) || [];
  const $ = (id) => document.getElementById(id);

  // 缩略图配色，和 pet.css 里各皮肤的 CSS 变量保持一致
  const THUMB = {
    b01:   { body: '#3a414c', trim: '#f2c230', helmet: '#4a525f' },
    b22:   { body: '#26292e', trim: '#b9c2cf', helmet: '#33373d' },
    sc34:  { body: '#7a7150', trim: '#e0c25a', helmet: '#8d8564' },
    fs23:  { body: '#3b4a3f', trim: '#d9a441', helmet: '#4c5d50' },
    a35:   { body: '#39412e', trim: '#e07a2c', helmet: '#47523a' },
    tr117: { body: '#3c6b3e', trim: '#e8e3c4', helmet: '#4b7d4d' },
    ce74:  { body: '#b3936a', trim: '#c9a227', helmet: '#8f8674' },
    cw22:  { body: '#5a6067', trim: '#ff6a52', helmet: '#6a707a' },
    cw4:   { body: '#33496a', trim: '#c9631f', helmet: '#3e5678' },
    cw9:   { body: '#cdc8b6', trim: '#b0392c', helmet: '#dcd7c6' },
  };

  // 武器缩略图：按各武器实际外形画简化剪影（比例取自 helldiver.js 里的坐标）
  const WTHUMB = {
    rifle:  { body: 44, barrel: 52, mag: 18, bipod: false },
    mg43:   { body: 40, barrel: 52, mag: 22, bipod: false },
    gr8:    { body: 52, barrel: 32, mag: 0,  bipod: false, drum: true },
    flam40: { body: 38, barrel: 66, mag: 0,  bipod: false, tank: true },
    gl21:   { body: 48, barrel: 34, mag: 0,  bipod: false, drum: true },
    apw1:   { body: 44, barrel: 68, mag: 0,  bipod: true },
  };

  /** 生成武器缩略图 SVG */
  function weaponThumb(id) {
    const t = WTHUMB[id] || WTHUMB.rifle;
    const cy = 16;
    const x = 3;
    let s = '';
    if (t.tank) s += `<rect x="${x - 6}" y="${cy - 4}" width="12" height="16" rx="3" class="w-b"/>`;
    s += `<rect x="${x}" y="${cy - 6}" width="${t.body}" height="12" rx="2" class="w-b"/>`;
    s += `<rect x="${x + t.body - 4}" y="${cy - 2.5}" width="${t.barrel}" height="5" rx="1.5" class="w-b"/>`;
    if (t.mag) s += `<rect x="${x + 9}" y="${cy + 6}" width="12" height="${t.mag}" rx="1.5" class="w-b"/>`;
    if (t.drum) s += `<circle cx="${x + 4}" cy="${cy - 12}" r="7" class="w-b"/>`;
    if (t.bipod) {
      const bx = x + t.body + t.barrel * 0.42;
      s += `<path d="M ${bx} ${cy + 4} l -3 10 M ${bx} ${cy + 4} l 4 10" stroke="currentColor" stroke-width="2" fill="none"/>`;
    }
    return `<svg viewBox="0 0 110 34" class="w-thumb">${s}</svg>`;
  }

  const els = {
    scale: $('scale'),
    opacity: $('opacity'),
    alwaysOnTop: $('alwaysOnTop'),
    autoWander: $('autoWander'),
    wanderSpeed: $('wanderSpeed'),
    showBubble: $('showBubble'),
    sound: $('sound'),
    autoLaunch: $('autoLaunch'),
    gaze: $('gaze'),
    physics: $('physics'),
    peek: $('peek'),
    mood: $('mood'),
    vScale: $('v-scale'),
    vOpacity: $('v-opacity'),
    vWander: $('v-wander'),
    vMood: $('v-mood'),
  };

  let current = {};

  function fill(s) {
    current = s;
    els.scale.value = Math.round(s.scale * 100);
    els.opacity.value = Math.round(s.opacity * 100);
    els.alwaysOnTop.checked = !!s.alwaysOnTop;
    els.autoWander.checked = !!s.autoWander;
    els.wanderSpeed.value = s.wanderSpeed || 18;
    els.showBubble.checked = !!s.showBubble;
    els.sound.checked = !!s.sound;
    els.autoLaunch.checked = !!s.autoLaunch;
    els.gaze.checked = s.gaze !== false;
    els.physics.checked = s.physics !== false;
    els.peek.checked = !!s.peek;
    els.mood.value = s.mood == null ? 70 : s.mood;
    syncLabels();
    syncLang(s.quotesLang);
    syncFocus(s);
    buildSkins(s.skin);
    buildWeapons(s.weapon);
  }

  /** 专注计时的分段按钮：按当前设置里的剩余时间反推选中项 */
  function syncFocus(s) {
    const min = s.focusMinutes || 0;
    const remain = s.focusEndAt ? Math.round((s.focusEndAt - Date.now()) / 60000) : 0;
    let sel = '0';
    if (min === 25 || remain === 25) sel = '25';
    else if (min === 50 || remain === 50) sel = '50';
    document.querySelectorAll('#focusSeg button').forEach((b) => {
      b.classList.toggle('on', b.dataset.min === sel);
    });
  }

  /* ------------------------------------------------------------ 皮肤列表 */

  function buildSkins(currentSkin) {
    const box = $('skins');
    if (!box) return;
    box.innerHTML = '';
    SKINS.forEach((s) => {
      const t = THUMB[s.id] || { body: '#3a414c', trim: '#f2c230', helmet: '#4a525f' };
      const card = document.createElement('div');
      card.className = 'skin-card' + (s.id === currentSkin ? ' on' : '');
      card.innerHTML =
        `<div class="thumb">` +
        `<i style="background:${t.helmet}"></i>` +
        `<i style="background:${t.trim}"></i>` +
        `<i style="background:${t.body}"></i>` +
        `</div>` +
        `<div class="skin-name">${s.name}</div>` +
        `<div class="skin-sub">${s.sub}</div>`;
      card.addEventListener('click', () => {
        box.querySelectorAll('.skin-card').forEach((n) => n.classList.remove('on'));
        card.classList.add('on');
        api.setSettings({ skin: s.id }); // 桌宠立刻换装
      });
      box.appendChild(card);
    });
  }

  function buildWeapons(currentWeapon) {
    const box = $('weapons');
    if (!box) return;
    box.innerHTML = '';
    WEAPONS.forEach((x) => {
      const card = document.createElement('div');
      card.className = 'skin-card' + (x.id === currentWeapon ? ' on' : '');
      card.innerHTML =
        weaponThumb(x.id) +
        `<div class="skin-name">${x.name}</div>` +
        `<div class="skin-sub">${x.sub}</div>`;
      card.addEventListener('click', () => {
        box.querySelectorAll('.skin-card').forEach((n) => n.classList.remove('on'));
        card.classList.add('on');
        api.setSettings({ weapon: x.id });
      });
      box.appendChild(card);
    });
  }

  function syncLabels() {
    els.vScale.textContent = `${els.scale.value}%`;
    els.vOpacity.textContent = `${els.opacity.value}%`;
    els.vWander.textContent = els.wanderSpeed.value;
    els.vMood.textContent = els.mood.value;
  }

  function syncLang(lang) {
    document.querySelectorAll('#langSeg button').forEach((b) => {
      b.classList.toggle('on', b.dataset.lang === (lang || 'cn'));
    });
  }

  let pending = {};
  let pendingTimer = null;

  function push(patch, immediate) {
    Object.assign(pending, patch);
    clearTimeout(pendingTimer);
    const run = () => {
      const p = pending;
      pending = {};
      api.setSettings(p);
    };
    if (immediate) run();
    else pendingTimer = setTimeout(run, 140);
  }

  /* ------------------------------------------------------------ 绑定 */

  els.scale.addEventListener('input', () => {
    syncLabels();
    push({ scale: Number(els.scale.value) / 100 });
  });

  els.opacity.addEventListener('input', () => {
    syncLabels();
    push({ opacity: Number(els.opacity.value) / 100 });
  });

  els.wanderSpeed.addEventListener('input', () => {
    syncLabels();
    push({ wanderSpeed: Number(els.wanderSpeed.value) });
  });

  els.alwaysOnTop.addEventListener('change', () =>
    push({ alwaysOnTop: els.alwaysOnTop.checked }, true),
  );
  els.autoWander.addEventListener('change', () =>
    push({ autoWander: els.autoWander.checked }, true),
  );
  els.showBubble.addEventListener('change', () =>
    push({ showBubble: els.showBubble.checked }, true),
  );
  els.sound.addEventListener('change', () => push({ sound: els.sound.checked }, true));
  els.autoLaunch.addEventListener('change', () =>
    push({ autoLaunch: els.autoLaunch.checked }, true),
  );
  els.gaze.addEventListener('change', () => push({ gaze: els.gaze.checked }, true));
  els.physics.addEventListener('change', () => push({ physics: els.physics.checked }, true));
  els.peek.addEventListener('change', () => push({ peek: els.peek.checked }, true));
  els.mood.addEventListener('input', () => {
    syncLabels();
    push({ mood: Number(els.mood.value) });
  });

  document.querySelectorAll('#focusSeg button').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#focusSeg button').forEach((n) => n.classList.remove('on'));
      b.classList.add('on');
      const min = Number(b.dataset.min) || 0;
      push(
        { focusMinutes: min, focusEndAt: min > 0 ? Date.now() + min * 60000 : 0 },
        true,
      );
    });
  });

  document.querySelectorAll('#langSeg button').forEach((b) => {
    b.addEventListener('click', () => {
      syncLang(b.dataset.lang);
      push({ quotesLang: b.dataset.lang }, true);
    });
  });

  $('btnReset').addEventListener('click', async () => {
    const s = await api.resetSettings();
    fill(s);
  });

  $('btnDone').addEventListener('click', () => window.close());

  /* ------------------------------------------------------------ 启动 */

  api.getSettings().then(fill);
})();
