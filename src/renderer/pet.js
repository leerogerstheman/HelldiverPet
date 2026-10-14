/* ==========================================================================
   绝地潜兵桌宠 · 交互逻辑
   ========================================================================== */
(function () {
  'use strict';

  const { HELLDIVER_SVG } = window;
  const { QUOTES, KEYMAP, SKINS, WEAPONS, pickQuote, pickStratagem } = window.HD2;
  const { setEnabled, sfx } = window.SFX;
  const api = window.petAPI;

  const stage = document.getElementById('stage');
  const bubble = document.getElementById('bubble');
  const hintEl = document.getElementById('hint');
  const fx = document.getElementById('fx');
  const host = document.getElementById('diverHost');

  /* --------------------------------------------------------------- 状态 */

  let cfg = {
    scale: 1,
    alwaysOnTop: true,
    autoWander: true,
    wanderSpeed: 18,
    weapon: 'rifle',
    sound: true,
    quotes: true,
    quotesLang: 'cn',
    showBubble: true,
    opacity: 1,
  };

  let bubbleTimer = null;
  let clickTimer = null;
  let lastQuote = '';
  let lastStratagem = '';
  let clickCount = 0;
  let dragSaid = false;
  let hovering = false;
  let suppressHoverUntil = 0;

  /* 拖拽 */
  let drag = null;

  /* 巡逻 */
  let wander = { dir: -1, timer: null, lastStep: 0, enabled: false, pauseUntil: 0, acc: 0 };

  /* 闲置 */
  let idleTimer = null;
  const IDLE_MS = 45000;

  /* 提示条 */
  let hintTimer = null;

  /* ---------------------------------------------------------------- 初始化 */

  host.innerHTML = HELLDIVER_SVG;
  if (api.nofilters) {
    host.querySelectorAll('[filter]').forEach((el) => el.removeAttribute('filter'));
  }

  api.getSettings().then(applySettings);

  api.on('settings:changed', applySettings);
  api.on('command', (cmd) => {
    if (cmd && cmd.type) runCommand(cmd.type);
  });

  function applySettings(next) {
    cfg = Object.assign(cfg, next || {});
    document.documentElement.style.setProperty('--scale', cfg.scale);
    applySkin(cfg.skin);
    applyWeapon(cfg.weapon);
    setEnabled(cfg.sound);
    startWander();
    if (!cfg.showBubble) hideBubble();
  }

  /** 切换皮肤：换 class 即可，SVG 不需要重建 */
  function applySkin(id) {
    const skin = SKINS.some((s) => s.id === id) ? id : 'b01';
    cfg.skin = skin;
    SKINS.forEach((s) => stage.classList.toggle('skin-' + s.id, s.id === skin));
    const meta = SKINS.find((s) => s.id === skin);
    if (meta && !firstSkinApplied) {
      firstSkinApplied = true;
      showHint(`皮肤：${meta.name}`);
    }
  }

  /** 切换武器：同样是换 class */
  function applyWeapon(id) {
    const w = WEAPONS.some((x) => x.id === id) ? id : 'rifle';
    cfg.weapon = w;
    WEAPONS.forEach((x) => stage.classList.toggle('wep-' + x.id, x.id === w));
    const meta = WEAPONS.find((x) => x.id === w);
    if (meta) showHint(`武器：${meta.name}`, 1600);
  }

  let firstSkinApplied = false;

  /* ------------------------------------------------------- 鼠标穿透控制 */

  let ignoreState = true;
  function setIgnore(ignore) {
    if (ignore === ignoreState) return;
    ignoreState = ignore;
    api.setIgnoreMouse(ignore);
  }

  // 窗口默认 setIgnoreMouseEvents(true, {forward:true})，
  // 鼠标移动事件仍会送达渲染进程，据此判断是否落在实心部位上。
  window.addEventListener(
    'mousemove',
    (e) => {
      if (Date.now() < suppressHoverUntil) return;
      const el = e.target;
      const hit = !!(el && el.closest && el.closest('.part-body, .part-head, .bubble.show'));
      setIgnore(!hit);
      if (hit && !hovering) {
        hovering = true;
        stage.classList.add('is-hover');
      } else if (!hit && hovering) {
        hovering = false;
        stage.classList.remove('is-hover');
      }
    },
    { passive: true },
  );

  // 窗口整体 drag region 交给自己处理，避免 Chromium 的可拖拽区域抢事件
  document.addEventListener('dragstart', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  /* ---------------------------------------------------------------- 气泡 */

  function showBubble(text, { ms = 3600, emph = false } = {}) {
    if (!cfg.showBubble || !cfg.quotes || !text) return;
    bubble.textContent = text;
    bubble.classList.toggle('emph', !!emph);
    bubble.classList.add('show');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(hideBubble, ms);
  }

  function hideBubble() {
    bubble.classList.remove('show');
    clearTimeout(bubbleTimer);
  }

  bubble.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    hideBubble();
  });

  function randomQuote(pool) {
    return pickQuote(pool || QUOTES[cfg.quotesLang] || QUOTES.cn, lastQuote);
  }

  function say(pool, opts) {
    const q = randomQuote(pool);
    lastQuote = q;
    showBubble(q, opts);
    return q;
  }

  /* ------------------------------------------------------------- 状态类 */

  function setState(cls, ms = 0) {
    clearState();
    if (!cls) return;
    stage.classList.add(cls);
    if (ms > 0) {
      setTimeout(() => stage.classList.remove(cls), ms);
    }
  }

  function clearState() {
    stage.classList.remove(
      'is-salute', 'is-jump', 'is-cheer', 'is-drag', 'is-walk',
      'is-orbital', 'is-shock', 'is-rest',
    );
  }

  function bumpIdle() {
    clearTimeout(idleTimer);
    stage.classList.remove('is-rest');
    idleTimer = setTimeout(() => {
      if (!drag) {
        stage.classList.add('is-rest');
        say(Math.random() < 0.5 ? QUOTES.tired : QUOTES[cfg.quotesLang], { ms: 5200 });
      }
    }, IDLE_MS);
  }

  /* ---------------------------------------------------------------- 互动 */

  /** 单击：区分头部 / 身体 */
  function onPetClick(part) {
    const isHead = part === 'head';
    clickCount++;

    if (clickCount % 12 === 0) {
      dizzy();
      say(['……你没事吧，长官？', '别再戳了，我的头盔要散了。', 'Vote or die, buddy!'], { ms: 3000 });
      sfx.deny();
      return;
    }

    if (isHead) {
      setState('is-salute');
      setTimeout(() => stage.classList.remove('is-salute'), 1500);
      sfx.salute();
      say(QUOTES.head, { ms: 3200 });
    } else {
      setState('is-jump', 700);
      sfx.jump();
      setTimeout(() => sfx.land(), 480);
      sparkBurst(10);
      say(null, { ms: 3400 });
    }
    bumpIdle();
  }

  /** 双击：投送战略配备 */
  function onPetDouble() {
    // 偶发一次大特效，让双击不至于每次都一样
    if (Math.random() < 0.34) {
      const big = [
        ['eagle', eagleStrike],
        ['hmg', hmgBarrage],
        ['missile', missileRain],
      ];
      big[Math.floor(Math.random() * big.length)][1]();
    } else {
      throwStratagem();
    }
    bumpIdle();
  }

  /* -------------------------------------------------------- 战略配备投送 */

  function throwStratagem() {
    const s = pickStratagem(lastStratagem);
    lastStratagem = s.code;

    clearTimeout(clickTimer);
    hideBubble();
    setState('is-cheer', 1000);

    const pad = document.createElement('div');
    pad.className = 'code-pad';

    // 标准配备输入盘：上 / 左·下·右 / 下
    const CELLS = [
      [null, 'U', null],
      ['L', 'D', 'R'],
      [null, 'U', null],
    ];
    const keyEls = {};
    CELLS.forEach((row) => {
      row.forEach((ch) => {
        const d = document.createElement('div');
        d.className = 'key';
        if (ch) {
          d.textContent = KEYMAP[ch];
          keyEls[ch] = keyEls[ch] || [];
          keyEls[ch].push(d);
        }
        pad.appendChild(d);
      });
    });

    const label = document.createElement('div');
    label.className = 'code-label';
    pad.appendChild(label);

    fx.appendChild(pad);
    requestAnimationFrame(() => pad.classList.add('run'));

    // 依次点亮按键
    let upIdx = 0;
    const chars = s.code.split('');
    chars.forEach((ch, i) => {
      setTimeout(() => {
        let el;
        if (ch === 'U') {
          el = keyEls.U[upIdx % 2];
          upIdx++;
        } else {
          el = keyEls[ch][0];
        }
        if (el) {
          el.classList.add('hit');
          setTimeout(() => el.classList.remove('hit'), 110);
        }
        sfx.stratagemKey(i);
      }, 180 + i * 95);
    });

    setTimeout(() => {
      label.textContent = s.name;
      sfx.orbital();
      orbitalStrike();
    }, 260 + chars.length * 95);

    setTimeout(() => {
      pad.remove();
      say([`${s.name}已就位！`, `${s.name}，支持民主。`, `呼叫${s.name}！`], { ms: 2600 });
      sfx.reinforce();
    }, 1150 + chars.length * 95);

    setTimeout(() => stage.classList.remove('is-cheer'), 900);
  }

  /** 轨道打击特效 */
  function orbitalStrike() {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('class', 'orbital');
    el.setAttribute('viewBox', '0 0 150 150');
    el.innerHTML = `
      <circle class="reticle-dim" cx="75" cy="75" r="66" />
      <circle class="reticle" cx="75" cy="75" r="44" />
      <circle class="reticle-dim" cx="75" cy="75" r="26" />
      <path class="reticle" d="M75 4 L75 22 M75 128 L75 146 M4 75 L22 75 M128 75 L146 75" stroke-linecap="round"/>
      <line class="beam" x1="75" y1="0" x2="75" y2="150"/>
    `;
    fx.appendChild(el);
    requestAnimationFrame(() => el.classList.add('run'));

    setState('is-orbital', 520);
    stage.classList.add('shake');
    setTimeout(() => stage.classList.remove('shake'), 360);

    setTimeout(() => el.remove(), 1600);
    setTimeout(() => sparkBurst(14), 320);
  }

  /* -------------------------------------------------------- 新增大特效 */

  /** 鹰击空袭：一道影子横穿，落地爆炸 */
  function eagleStrike() {
    hideBubble();
    const el = document.createElement('div');
    el.className = 'eagle';
    el.innerHTML = `
      <svg viewBox="0 0 58 30">
        <path class="w" d="M2 15 Q10 4, 20 10 Q27 2, 34 9 Q44 6, 50 14 Q42 13, 38 19
                             Q32 15, 27 21 Q20 15, 14 21 Q8 16, 2 15 Z"/>
        <path class="w2" d="M20 10 Q27 4, 34 9 Q30 13, 26 14 Z"/>
      </svg>`;
    fx.appendChild(el);
    requestAnimationFrame(() => el.classList.add('run'));
    setTimeout(() => el.remove(), 1700);

    [640, 820, 1000].forEach((delay) => {
      setTimeout(() => {
        const b = document.createElement('div');
        b.className = 'blast';
        b.style.left = `${50 + (Math.random() * 46 - 23)}%`;
        fx.appendChild(b);
        requestAnimationFrame(() => b.classList.add('run'));
        setTimeout(() => b.remove(), 900);

        const r = document.createElement('div');
        r.className = 'shock';
        r.style.left = b.style.left;
        fx.appendChild(r);
        requestAnimationFrame(() => r.classList.add('run'));
        setTimeout(() => r.remove(), 850);

        sfx.orbital();
        sparkBurst(12);
      }, delay);
    });

    setTimeout(() => say(['鹰击空袭！别抬头！', '民主从天而降！', 'Target locked. Democracy inbound.'], {
      emph: true,
      ms: 2800,
    }), 980);
  }

  /** HMG 火力网：架起加特林转起来 */
  function hmgBarrage() {
    hideBubble();
    const el = document.createElement('div');
    el.className = 'hmg';
    el.innerHTML = `
      <svg viewBox="0 0 132 66">
        <path class="body" d="M18 34 L96 34 L96 50 L18 50 Z"/>
        <path class="body" d="M40 20 L78 20 L78 34 L40 34 Z"/>
        <path class="barrel" d="M96 28 L124 28 L124 40 L96 40 Z"/>
        <path class="body" d="M22 50 L40 50 L36 62 L20 62 Z"/>
        <path class="body" d="M74 50 L92 50 L96 62 L80 62 Z"/>
        <g class="spin">
          <rect class="barrel" x="2" y="14" width="26" height="4" rx="2"/>
          <rect class="barrel" x="2" y="22" width="26" height="4" rx="2"/>
          <rect class="barrel" x="2" y="30" width="26" height="4" rx="2"/>
          <rect class="barrel" x="2" y="38" width="26" height="4" rx="2"/>
        </g>
        <circle class="flash" cx="128" cy="34" r="9"/>
      </svg>`;
    fx.appendChild(el);
    requestAnimationFrame(() => el.classList.add('run'));
    sfx.hmg && sfx.hmg();
    sparkBurst(6);
    setTimeout(() => {
      say(['弹幕压制，别躲！', '火力就是民主！', 'Suppress fire! Democracy in motion.'], { emph: true });
    }, 500);
    setTimeout(() => el.remove(), 2700);
  }

  /** 导弹雨：一排火箭划出弧线砸下来 */
  function missileRain() {
    hideBubble();
    setState('is-shock', 400);
    for (let i = 0; i < 7; i++) {
      setTimeout(() => {
        const r = document.createElement('div');
        r.className = 'rocket';
        r.style.left = `${28 + i * 7 + Math.random() * 6}%`;
        r.style.setProperty('--rx', `${(Math.random() * 60 - 30).toFixed(1)}px`);
        r.style.setProperty('--rr', `${(Math.random() * 140 - 70).toFixed(0)}deg`);
        r.style.animationDuration = `${0.85 + Math.random() * 0.5}s`;
        fx.appendChild(r);
        requestAnimationFrame(() => r.classList.add('run'));
        setTimeout(() => {
          r.remove();
          const b = document.createElement('div');
          b.className = 'blast';
          b.style.left = r.style.left;
          b.style.animationDuration = '0.6s';
          fx.appendChild(b);
          requestAnimationFrame(() => b.classList.add('run'));
          setTimeout(() => b.remove(), 700);
          sfx.orbital();
        }, 900 + Math.random() * 300);
      }, i * 110);
    }
    setTimeout(() => say(['导弹饱和打击！', '把整片天都捅个对穿！', 'Missile saturation! For Earth.'], {
      emph: true,
    }), 420);
  }

  /** 晋升喝彩：撒纸屑 + 盖章 */
  function promotion() {
    hideBubble();
    setState('is-cheer', 1200);
    const stamp = document.createElement('div');
    stamp.className = 'stamp';
    stamp.textContent = 'PROMOTED';
    fx.appendChild(stamp);
    requestAnimationFrame(() => stamp.classList.add('run'));
    setTimeout(() => stamp.remove(), 2000);

    const COLORS = ['#f2c230', '#e2483f', '#4d9b6a', '#67e8f9', '#ffffff'];
    for (let i = 0; i < 26; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = `${30 + Math.random() * 40}%`;
      c.style.background = COLORS[i % COLORS.length];
      c.style.setProperty('--cx', `${(Math.random() * 190 - 95).toFixed(0)}px`);
      c.style.setProperty('--cy', `${(120 + Math.random() * 190).toFixed(0)}px`);
      c.style.setProperty('--cr', `${Math.round(Math.random() * 900 - 450)}deg`);
      c.style.animationDelay = `${(Math.random() * 0.35).toFixed(2)}s`;
      fx.appendChild(c);
      setTimeout(() => c.remove(), 2400);
    }
    requestAnimationFrame(() => fx.querySelectorAll('.confetti').forEach((n) => n.classList.add('run')));
    sfx.promote();
    setTimeout(() => say(QUOTES.promoted, { emph: true, ms: 3600 }), 420);
  }

  /** 护盾 / 提神剂 */
  function stimShield() {
    hideBubble();
    const el = document.createElement('div');
    el.className = 'shield';
    fx.appendChild(el);
    requestAnimationFrame(() => el.classList.add('run'));
    setTimeout(() => el.remove(), 2300);
    sfx.stim();
    say(['提神剂已注入，准备继续送死。', '感觉好多了…大概。', 'Stim injected. Back to work.']);
  }

  /* ------------------------------------------------------------ 粒子 / 星 */

  function sparkBurst(n = 8) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      s.className = 'spark';
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.6;
      const dist = 34 + Math.random() * 42;
      s.style.setProperty('--dx', `${Math.cos(a) * dist}px`);
      s.style.setProperty('--dy', `${-Math.abs(Math.sin(a)) * dist - 14}px`);
      s.style.background = Math.random() > 0.6 ? '#e2483f' : '#f2a63b';
      s.style.animationDelay = `${Math.random() * 0.08}s`;
      fx.appendChild(s);
      setTimeout(() => s.remove(), 760);
    }
  }

  function dizzy() {
    setState('is-shock', 520);
    const host0 = document.createElement('div');
    host0.style.cssText =
      'position:absolute;left:50%;bottom:250px;width:0;height:0;transform:translateX(-50%);';
    ['💫', '⭐', '💥'].forEach((e, i) => {
      const d = document.createElement('div');
      d.className = 'dizzy';
      d.textContent = e;
      d.style.animationDelay = `${i * 0.5}s`;
      host0.appendChild(d);
    });
    fx.appendChild(host0);
    setTimeout(() => host0.remove(), 1800);
  }

  /* ---------------------------------------------------------------- 拖拽 */

  let moveAccum = { x: 0, y: 0 };
  let moveRaf = null;

  function flushMove() {
    moveRaf = null;
    if (moveAccum.x || moveAccum.y) {
      api.moveWindow(moveAccum.x, moveAccum.y);
      moveAccum.x = 0;
      moveAccum.y = 0;
    }
  }

  function onPointerDown(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    hideBubble();
    setState('is-drag');
    clearState();
    stage.classList.add('is-drag');
    wander.pauseUntil = Date.now() + 2500;
    if (!dragSaid) {
      dragSaid = true;
      say(QUOTES.drag, { ms: 2200 });
    }
    try {
      e.target.setPointerCapture(e.pointerId);
    } catch (_) {}
    drag = { x: e.screenX, y: e.screenY, moved: 0, t: Date.now(), id: e.pointerId, part: hitPart(e) };
    bumpIdle();
  }

  /**
   * 记录按下的是头还是身体。
   * 必须在 pointerdown 时取：一旦 setPointerCapture，pointerup 的 target 会被
   * 重定向到捕获元素，判定就会飘。
   */
  function hitPart(e) {
    const el = e.target;
    return el && el.closest && el.closest('.part-head') ? 'head' : 'body';
  }

  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.screenX - drag.x;
    const dy = e.screenY - drag.y;
    drag.x = e.screenX;
    drag.y = e.screenY;
    drag.moved += Math.abs(dx) + Math.abs(dy);

    moveAccum.x += dx;
    moveAccum.y += dy;
    if (!moveRaf) moveRaf = requestAnimationFrame(flushMove);

    stage.style.setProperty(
      '--drag-tilt',
      `${Math.max(-16, Math.min(16, dx * 0.6))}deg`,
    );
  }

  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const wasDrag = drag.moved > 8;
    const dt = Date.now() - drag.t;
    const dragPart = drag.part;
    drag = null;
    setTimeout(() => { dragSaid = false; }, 6000);
    stage.classList.remove('is-drag');
    stage.style.removeProperty('--drag-tilt');
    bumpIdle();

    if (wasDrag) {
      sfx.land();
      stage.classList.add('is-jump');
      setTimeout(() => stage.classList.remove('is-jump'), 620);
      return;
    }
    if (dt < 700) scheduleClick(dragPart);
  }

  /** 延迟触发单击，以便识别双击 */
  function scheduleClick(part) {
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => onPetClick(part), 230);
  }

  /* ---------------------------------------------------------------- 滚轮 */

  let wheelTimer = null;
  window.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      const next = Math.min(2, Math.max(0.5, +(cfg.scale + delta).toFixed(2)));
      if (next === cfg.scale) return;
      cfg.scale = next;
      document.documentElement.style.setProperty('--scale', next);
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => api.setSettings({ scale: next }), 260);
      showHint(`缩放 ${Math.round(next * 100)}%`);
    },
    { passive: false },
  );

  /* ------------------------------------------------------------- 右键菜单 */

  async function openMenu() {
    const items = [
      { label: '敬礼', action: 'salute' },
      { label: '跳一下', action: 'jump' },
      { label: '投送战略配备', action: 'stratagem' },
      { label: '轨道炮击', action: 'orbital' },
      { separator: true },
      { label: '— 大场面 —', enabled: false },
      { label: '鹰击空袭', action: 'eagle' },
      { label: 'HMG 火力网', action: 'hmg' },
      { label: '导弹雨', action: 'missile' },
      { label: '申请晋升', action: 'promote' },
      { label: '注射提神剂', action: 'stim' },
      { separator: true },
      { label: `换皮肤：${currentSkinName()}`, action: 'cycle-skin' },
      {
        label: '皮肤',
        submenu: SKINS.map((s) => ({
          label: s.name,
          type: 'checkbox',
          checked: cfg.skin === s.id,
          action: 'skin:' + s.id,
        })),
      },
      { label: `换武器：${currentWeaponName()}`, action: 'cycle-weapon' },
      {
        label: '武器',
        submenu: WEAPONS.map((x) => ({
          label: x.name,
          type: 'checkbox',
          checked: cfg.weapon === x.id,
          action: 'weapon:' + x.id,
        })),
      },
      { separator: true },
      { label: '随便说句', action: 'talk' },
      { label: '始终置顶', type: 'checkbox', checked: !!cfg.alwaysOnTop, action: 'toggle-top' },
      { label: '自动巡逻', type: 'checkbox', checked: !!cfg.autoWander, action: 'toggle-wander' },
      { label: '显示台词气泡', type: 'checkbox', checked: !!cfg.showBubble, action: 'toggle-bubble' },
      { label: '音效', type: 'checkbox', checked: !!cfg.sound, action: 'toggle-sound' },
      { separator: true },
      { label: '放大', action: 'bigger' },
      { label: '缩小', action: 'smaller' },
      { label: '恢复默认缩放', action: 'reset-scale' },
      { separator: true },
      { label: '设置…', action: 'settings' },
      { label: '藏到托盘里', action: 'hide' },
      { label: '退出', action: 'quit' },
    ];
    try {
      await api.popMenu(items);
    } catch (_) {}
  }

  function currentSkinName() {
    const m = SKINS.find((s) => s.id === cfg.skin);
    return m ? m.name : SKINS[0].name;
  }

  function currentWeaponName() {
    const m = WEAPONS.find((x) => x.id === cfg.weapon);
    return m ? m.name : WEAPONS[0].name;
  }

  function runCommand(type) {
    if (typeof type === 'string' && type.startsWith('skin:')) {
      const id = type.slice(5);
      api.setSettings({ skin: id });
      sfx.click();
      const meta = SKINS.find((s) => s.id === id);
      if (meta) showHint(`皮肤：${meta.name} · ${meta.sub}`, 1800);
      bumpIdle();
      return;
    }
    if (typeof type === 'string' && type.startsWith('weapon:')) {
      const id = type.slice(7);
      api.setSettings({ weapon: id });
      sfx.click();
      bumpIdle();
      return;
    }
    switch (type) {
      case 'salute':
        setState('is-salute');
        setTimeout(() => stage.classList.remove('is-salute'), 1500);
        sfx.salute();
        say(QUOTES.head);
        break;
      case 'jump':
        setState('is-jump', 700);
        sfx.jump();
        setTimeout(() => sfx.land(), 480);
        sparkBurst(10);
        break;
      case 'stratagem':
        throwStratagem();
        break;
      case 'orbital':
        hideBubble();
        sfx.orbital();
        orbitalStrike();
        say(['民主的怒火，来了。', '轨道打击，一切异议无效。'], { emph: true });
        break;
      case 'eagle':
        eagleStrike();
        break;
      case 'hmg':
        hmgBarrage();
        break;
      case 'missile':
        missileRain();
        break;
      case 'promote':
        promotion();
        break;
      case 'stim':
        stimShield();
        break;
      case 'cycle-skin': {
        const i = SKINS.findIndex((s) => s.id === cfg.skin);
        const next = SKINS[(i + 1) % SKINS.length];
        api.setSettings({ skin: next.id });
        sfx.click();
        setTimeout(() => showHint(`皮肤：${next.name} · ${next.sub}`), 120);
        break;
      }
      case 'cycle-weapon': {
        const i = WEAPONS.findIndex((x) => x.id === cfg.weapon);
        const next = WEAPONS[(i + 1) % WEAPONS.length];
        api.setSettings({ weapon: next.id });
        sfx.click();
        showHint(`武器：${next.name} · ${next.sub}`, 1800);
        break;
      }
      case 'talk':
        say();
        sfx.click();
        break;
      case 'toggle-top':
        api.setSettings({ alwaysOnTop: !cfg.alwaysOnTop });
        break;
      case 'toggle-wander':
        api.setSettings({ autoWander: !cfg.autoWander });
        break;
      case 'toggle-bubble':
        api.setSettings({ showBubble: !cfg.showBubble });
        if (!cfg.showBubble) hideBubble();
        break;
      case 'toggle-sound':
        api.setSettings({ sound: !cfg.sound });
        break;
      case 'bigger':
      case 'smaller': {
        const d = type === 'bigger' ? 0.15 : -0.15;
        const next = Math.min(2, Math.max(0.5, +(cfg.scale + d).toFixed(2)));
        api.setSettings({ scale: next });
        showHint(`缩放 ${Math.round(next * 100)}%`);
        break;
      }
      case 'reset-scale':
        api.setSettings({ scale: 1 });
        showHint('缩放 100%');
        break;
      case 'settings':
        api.openSettings();
        break;
      case 'hide':
        api.hideWindow();
        break;
      case 'quit':
        api.quit();
        break;
    }
    bumpIdle();
  }

  /* ---------------------------------------------------------------- 提示 */

  function showHint(text, ms = 1400) {
    hintEl.textContent = text;
    hintEl.classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => hintEl.classList.remove('show'), ms);
  }

  /* ---------------------------------------------------------------- 巡逻 */

  let workArea = null;

  async function ensureWorkArea() {
    if (workArea) return workArea;
    try {
      workArea = await api.getWorkArea();
    } catch (_) {
      workArea = null;
    }
    return workArea;
  }

  function startWander() {
    clearInterval(wander.timer);
    wander.enabled = !!cfg.autoWander;
    if (!wander.enabled) {
      stage.classList.remove('is-walk', 'facing-left');
      return;
    }
    wander.lastStep = performance.now();
    wander.acc = 0;
    wander.timer = setInterval(wanderTick, 40);
  }

  let ticking = false;

  async function wanderTick() {
    // wanderTick 是 async 的，IPC 往返期间下一次 setInterval 可能已经触发；
    // 不加锁会堆积成倍的实际移动速度。
    if (ticking || !wander.enabled || drag) return;
    if (stage.classList.contains('is-rest')) return;
    if (Date.now() < wander.pauseUntil) return;

    ticking = true;
    try {
      const now = performance.now();
      const dt = Math.min(0.25, (now - wander.lastStep) / 1000);
      wander.lastStep = now;

      const pos = await api.getWindowPos();
      if (!pos) return;
      const wa = await ensureWorkArea();
      if (!wa) return;

      const speed = (cfg.wanderSpeed || 18) * cfg.scale;
      // 用小数累加器避免 Math.round 造成的系统性偏快
      wander.acc += speed * dt * wander.dir;
      const step = Math.trunc(wander.acc);
      if (step === 0) return;
      wander.acc -= step;

      let nextX = pos.x + step;
      const margin = 24;
      if (nextX <= wa.x + margin) {
        nextX = wa.x + margin;
        wander.dir = 1;
        onTurn();
      } else if (nextX + pos.width >= wa.x + wa.width - margin) {
        nextX = wa.x + wa.width - margin - pos.width;
        wander.dir = -1;
        onTurn();
      }

      api.moveWindow(nextX - pos.x, 0);
      stage.classList.toggle('facing-left', wander.dir < 0);
      stage.classList.toggle('facing-right', wander.dir >= 0);
      if (!stage.classList.contains('is-walk')) stage.classList.add('is-walk');
    } catch (_) {
      /* 单帧失败忽略，下一帧继续 */
    } finally {
      ticking = false;
    }
  }

  function onTurn() {
    stage.classList.remove('is-walk');
    setTimeout(() => {
      if (!drag && wander.enabled) stage.classList.add('is-walk');
    }, 80);
  }

  /* ------------------------------------------------------------- 事件绑定 */

  host.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  host.addEventListener('dblclick', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onPetDouble();
  });

  host.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    bumpIdle();
    openMenu();
  });

  // 拖拽时按住空格切换穿透，方便"抓不住"的情况
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideBubble();
  });

  /* --------------------------------------------------------------- 启动 */

  // 暴露给 --shot 调试模式调用各个特效，方便截图验证
  window.petFx = {
    eagle: eagleStrike,
    hmg: hmgBarrage,
    missile: missileRain,
    promote: promotion,
    stim: stimShield,
    stratagem: throwStratagem,
    orbital: orbitalStrike,
    skin: applySkin,
    weapon: applyWeapon,
  };

  ensureWorkArea();
  bumpIdle();

  // 首次使用打声招呼
  setTimeout(() => {
    setState('is-salute');
    setTimeout(() => stage.classList.remove('is-salute'), 1500);
    sfx.salute();
    say(['报到，长官！准备好执行任务了吗？', '为了民主！点击我试试。', '我在这儿待命，随时可以出发。'], {
      ms: 6000,
    });
  }, 900);

  // 防止鼠标一直"卡"在穿透状态
  window.addEventListener('mouseleave', () => setIgnore(true));
  window.addEventListener('mouseenter', () => {
    suppressHoverUntil = Date.now() + 80;
  });
})();
