'use strict';

const path = require('path');
const fs = require('fs');
const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Menu,
  Tray,
  nativeImage,
  globalShortcut,
} = require('electron');

const settings = require('./settings');
const logger = require('./logger');

const DESIGN_W = 300;
const DESIGN_H = 400;

// 调试开关：排查窗口尺寸异常时打开，--trace 启动
const DEBUG_TRACE = process.argv.includes('--trace');
// 追踪额度要够大，不然会被巡逻的移动日志先吃光，看不到抛物飞行的轨迹
let moveTrace = DEBUG_TRACE ? 600 : 0;

// 可选皮肤，顺序即设置面板 / 菜单里的顺序；定义见 renderer/pet.css
const SKINS = ['b01', 'b22', 'sc34', 'fs23', 'a35', 'tr117', 'ce74', 'cw22', 'cw4', 'cw9'];
const WEAPONS = ['rifle', 'mg43', 'gr8', 'flam40', 'gl21', 'apw1'];

// 诊断用：不透明窗口（用来验证内容渲染，以及定位是否是透明合成导致崩溃）
const OPAQUE = process.argv.includes('--opaque');

let win = null;
let tray = null;
let settingsWin = null;
let quitting = false;

/* ------------------------------------------------------------------ utils */

function clampInt(n, min, max) {
  n = Math.round(Number(n) || 0);
  return Math.min(max, Math.max(min, n));
}

function windowSize(scale) {
  return {
    width: Math.round(DESIGN_W * scale),
    height: Math.round(DESIGN_H * scale),
  };
}

function defaultPosition() {
  const { workArea } = screen.getPrimaryDisplay();
  const scale = settings.get('scale');
  const size = windowSize(scale);
  return {
    // 让潜兵的「脚 + 影子」正好落在工作区底部，看起来像站在任务栏上
    x: workArea.x + workArea.width - size.width - 40,
    y: workArea.y + workArea.height - Math.round(384 * scale),
  };
}

function ensureVisible(x, y, w, h) {
  const display = screen.getDisplayNearestPoint({ x: Math.round(x), y: Math.round(y) });
  const wa = display.workArea;
  const width = Math.round(w || windowSize(settings.get('scale')).width);
  const height = Math.round(h || windowSize(settings.get('scale')).height);

  const margin = 40; // 保证至少有这么多露在屏幕里
  return {
    x: clampInt(x, wa.x - width + margin, wa.x + wa.width - margin),
    y: clampInt(y, wa.y - height + margin, wa.y + wa.height - margin),
    width,
    height,
  };
}

function applyWindowScale() {
  if (!win) return;
  const size = windowSize(settings.get('scale'));
  win.setMinimumSize(size.width, size.height);
  win.setMaximumSize(size.width, size.height);
  win.setBounds(ensureVisible(win.getBounds().x, win.getBounds().y, size.width, size.height));
  win.webContents.send('settings:changed', settings.load());
}

function loadTrayIcon() {
  const p = path.join(__dirname, '..', '..', 'build', 'tray.png');
  if (fs.existsSync(p)) {
    const img = nativeImage.createFromPath(p);
    if (!img.isEmpty()) return img.resize({ width: 16, height: 16 });
  }
  return nativeImage.createEmpty();
}

/* ------------------------------------------------------------------- 窗口 */

function createPetWindow() {
  const scale = settings.get('scale');
  const size = windowSize(scale);
  const start = ensureVisible(defaultPosition().x, defaultPosition().y, size.width, size.height);

  win = new BrowserWindow({
    ...start,
    transparent: !OPAQUE,
    frame: false,
    // 无边框窗口本身就没有拖拽手柄；保留 thickFrame 反而会留下一圈隐形缩放热区，
    // 所以这里显式关掉。resizable 必须为 true —— Electron 在 resizable:false 的
    // 窗口上重复调用 setPosition 会让宽度逐次累积变大（实测 300 → 1800）。
    resizable: true,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    thickFrame: false,
    alwaysOnTop: settings.get('alwaysOnTop'),
    backgroundColor: OPAQUE ? '#e8edf5' : '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  // 锁死尺寸，避免用户误操作改动
  win.setMinimumSize(size.width, size.height);
  win.setMaximumSize(size.width, size.height);

  win.setAlwaysOnTop(settings.get('alwaysOnTop'), 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setIgnoreMouseEvents(true, { forward: true }); // 默认穿透，鼠标进入宠物本体时再放开

  const opacity = Number(settings.get('opacity'));
  if (opacity > 0 && opacity < 1) win.setOpacity(opacity);

  // --html <路径>：改成加载任意本地页面再截图（做参考图拼版这类自测用）
  const htmlIdx = process.argv.indexOf('--html');
  const pageFile =
    htmlIdx !== -1 && process.argv[htmlIdx + 1]
      ? path.resolve(process.argv[htmlIdx + 1])
      : path.join(__dirname, '..', 'renderer', 'pet.html');

  win.loadFile(pageFile);

  // 把渲染进程的报错透出来，方便排查
  win.webContents.on('console-message', (...args) => {
    const m =
      typeof args[0] === 'object' && args[0] !== null && 'message' in args[0]
        ? args[0]
        : { level: args[1], message: args[2], lineNumber: args[3], sourceId: args[4] };
    logger.info(`[renderer:${m.level}] ${m.message} (${m.sourceId}:${m.lineNumber})`);
  });
  win.webContents.on('preload-error', (_e, p, err) => logger.error('[preload-error]', p, err));
  win.webContents.on('did-fail-load', (_e, code, desc) => logger.error('[did-fail-load]', code, desc));
  win.webContents.on('render-process-gone', (_e, d) => logger.error('[render-gone]', JSON.stringify(d)));
  if (DEBUG_TRACE) {
    win.webContents.once('did-finish-load', () => {
      logger.info(`[pet] did-finish-load bounds=${JSON.stringify(win.getBounds())} design=${JSON.stringify(windowSize(scale))}`);
    });
    [1000, 3000, 6000].forEach((ms) => {
      setTimeout(() => {
        if (win && !win.isDestroyed()) logger.info(`[pet] +${ms}ms bounds=${JSON.stringify(win.getBounds())}`);
      }, ms);
    });
  }

  // --shot：把渲染进程实际画出的内容导出成 PNG（自测用，不影响正常运行）
  // --shot <路径> <延迟ms> [要附加的 #stage 状态类]
  const shotIdx = process.argv.indexOf('--shot');
  if (shotIdx !== -1) {
    const out = process.argv[shotIdx + 1] || path.join(__dirname, '..', '..', '.preview', 'page.png');
    const delay = Number(process.argv[shotIdx + 2]) || 2500;
    const state = process.argv[shotIdx + 3] || '';
    const zoom = Number(process.argv[shotIdx + 4]) || 0;
    const skin = process.argv[shotIdx + 5] || '';
    const effect = process.argv[shotIdx + 6] || '';
    const weapon = process.argv[shotIdx + 7] || '';
    if (zoom > 0) {
      win.setMinimumSize(0, 0);
      win.setMaximumSize(10000, 10000);
      win.setBounds({ ...win.getBounds(), width: size.width * zoom, height: size.height * zoom });
    }
    win.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        try {
          if (zoom > 0 || skin || weapon) {
            await win.webContents.executeJavaScript(
              `var st1=document.getElementById('stage');
               if (${zoom} > 0 && window.petFx && window.petFx.zoom) { window.petFx.zoom(${zoom}); }
               ${
                 skin
                   ? `if(st1){st1.className=[...st1.classList].filter(function(c){return c.indexOf('skin-')!==0;}).join(' ');
                      st1.classList.add('skin-${skin.replace(/[^a-z0-9]/gi, '')}');}`
                   : ''
               }
               ${
                 weapon
                   ? `if(st1&&window.petFx){window.petFx.weapon('${weapon.replace(/[^a-z0-9]/gi, '')}');}`
                   : ''
               }
               true;`,
            );
          }
          if (state) {
            // 状态可以带空格分隔多个 class（classList.add 不接受含空格的单个 token，
            // 直接 add("a b") 会抛异常，截图就废了）
            const states = state
              .split(/\s+/)
              .filter(Boolean)
              .map((c) => JSON.stringify(c))
              .join(',');
            await win.webContents.executeJavaScript(
              `var st0=document.getElementById('stage');
               if(st0){[${states}].forEach(function(c){st0.classList.add(c);});st0.classList.remove('is-rest');}
               true;`,
            );
            await new Promise((r) => setTimeout(r, 500)); // 等动画过渡到位
          }
          if (effect) {
            await win.webContents.executeJavaScript(
              `if (window.petFx && window.petFx[${JSON.stringify(effect)}]) window.petFx[${JSON.stringify(effect)}]();true;`,
            );
            // 特效有过程，等它演到最精彩的一帧再截
            const at = { eagle: 900, hmg: 1100, missile: 1000, promote: 600, stim: 600, stratagem: 700, orbital: 400,
                         gaze: 350, gazeRight: 350, mood: 250, moodLow: 250, moodMid: 250,
                         focus: 1200, peek: 350, fling: 350 }[effect] || 800;
            await new Promise((r) => setTimeout(r, at));
          }
          // --html 加载的是任意页面（设置面板、参考图拼版等），
          // 窗口按内容高度自动撑开，否则只能截到首屏。
          if (htmlIdx !== -1) {
            const m = await win.webContents.executeJavaScript(
              'JSON.stringify({w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight})',
            );
            const dim = JSON.parse(m);
            logger.info(`[shot] 页面内容尺寸 ${dim.w}x${dim.h}，窗口 ${win.getBounds().width}x${win.getBounds().height}`);
            const b = win.getBounds();
            win.setBounds({
              x: b.x,
              y: b.y,
              width: Math.max(b.width, Math.min(1600, dim.w)),
              height: Math.max(b.height, Math.min(3000, dim.h)),
            });
            await new Promise((r) => setTimeout(r, 500));
          }
          const img = await win.webContents.capturePage();
          fs.mkdirSync(path.dirname(out), { recursive: true });
          fs.writeFileSync(out, img.toPNG());
          logger.info(`[shot] 已保存 ${out} state=${state} (${img.getSize().width}x${img.getSize().height})`);
        } catch (err) {
          logger.error('[shot] 失败:', err.message);
        }
        quitting = true;
        app.exit(0);
      }, delay);
    });
  }

  if (process.argv.includes('--dev')) win.webContents.openDevTools({ mode: 'detach' });

  win.on('close', (e) => {
    if (!quitting) {
      e.preventDefault();
      win.hide();
    }
  });

  win.on('closed', () => {
    win = null;
  });
}

function createSettingsWindow() {
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.focus();
    return;
  }
  settingsWin = new BrowserWindow({
    width: 420,
    height: 1420,
    title: '绝地潜兵桌宠 · 设置',
    resizable: false,
    minimizable: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', '..', 'build', 'icon-256.png'),
    backgroundColor: '#12161f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  settingsWin.loadFile(path.join(__dirname, '..', 'renderer', 'settings.html'));
  settingsWin.on('closed', () => {
    settingsWin = null;
  });
}

/* ------------------------------------------------------------------- 托盘 */

function buildTrayMenu() {
  const s = settings.load();
  return Menu.buildFromTemplate([
    { label: '绝地潜兵桌宠', enabled: false },
    { type: 'separator' },
    {
      label: '显示 / 隐藏',
      click: () => {
        if (!win) return;
        win.isVisible() ? win.hide() : win.show();
      },
    },
    { label: '设置…', click: () => createSettingsWindow() },
    {
      label: '随机巡逻',
      type: 'checkbox',
      checked: !!s.autoWander,
      click: (item) => {
        settings.save({ autoWander: item.checked });
        broadcastSettings();
      },
    },
    {
      label: '视线跟随',
      type: 'checkbox',
      checked: !!s.gaze,
      click: (item) => {
        settings.save({ gaze: item.checked });
        broadcastSettings();
      },
    },
    {
      label: '抛掷物理',
      type: 'checkbox',
      checked: !!s.physics,
      click: (item) => {
        settings.save({ physics: item.checked });
        broadcastSettings();
      },
    },
    {
      label: '屏幕边缘探头',
      type: 'checkbox',
      checked: !!s.peek,
      click: (item) => {
        settings.save({ peek: item.checked });
        broadcastSettings();
      },
    },
    {
      label: '专注计时',
      submenu: [
        {
          label: '25 分钟',
          click: () => {
            settings.save({ focusMinutes: 25, focusEndAt: Date.now() + 25 * 60000 });
            broadcastSettings();
          },
        },
        {
          label: '50 分钟',
          click: () => {
            settings.save({ focusMinutes: 50, focusEndAt: Date.now() + 50 * 60000 });
            broadcastSettings();
          },
        },
        { type: 'separator' },
        {
          label: '停止',
          click: () => {
            settings.save({ focusMinutes: 0, focusEndAt: 0 });
            broadcastSettings();
          },
        },
      ],
    },
    {
      label: '始终置顶',
      type: 'checkbox',
      checked: !!s.alwaysOnTop,
      click: (item) => {
        settings.save({ alwaysOnTop: item.checked });
        if (win) win.setAlwaysOnTop(item.checked, 'screen-saver');
        broadcastSettings();
      },
    },
    { type: 'separator' },
    {
      label: '开机自启',
      type: 'checkbox',
      checked: !!s.autoLaunch,
      click: (item) => setAutoLaunch(item.checked),
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        quitting = true;
        app.quit();
      },
    },
  ]);
}

function createTray() {
  try {
    tray = new Tray(loadTrayIcon());
    tray.setToolTip('绝地潜兵桌宠');
    tray.setContextMenu(buildTrayMenu());
    tray.on('click', () => {
      if (win) win.isVisible() ? win.hide() : win.show();
    });
  } catch (err) {
    logger.error('[tray] 创建失败:', err.message);
  }
}

function refreshTray() {
  if (tray && !tray.isDestroyed?.()) tray.setContextMenu(buildTrayMenu());
}

/* --------------------------------------------------------------- 开机自启 */

function setAutoLaunch(enable) {
  try {
    app.setLoginItemSettings({ openAtLogin: !!enable, args: [] });
    settings.save({ autoLaunch: !!enable });
  } catch (err) {
    logger.error('[autolaunch] 设置失败:', err.message);
  }
}

function syncAutoLaunch() {
  try {
    const actual = app.getLoginItemSettings().openAtLogin;
    if (actual !== !!settings.get('autoLaunch')) settings.save({ autoLaunch: actual });
  } catch (_) {}
}

/* -------------------------------------------------------------------- IPC */

function broadcastSettings() {
  const s = settings.load();
  if (win && !win.isDestroyed()) win.webContents.send('settings:changed', s);
  refreshTray();
}

ipcMain.handle('settings:get', () => settings.load());

ipcMain.handle('settings:set', (_e, patch) => {
  const p = patch || {};
  const next = {};

  if ('scale' in p) {
    next.scale = Math.min(2, Math.max(0.5, Number(p.scale) || 1));
  }
  if ('skin' in p) {
    const s = String(p.skin || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (SKINS.includes(s)) next.skin = s;
  }
  if ('weapon' in p) {
    const w = String(p.weapon || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (WEAPONS.includes(w)) next.weapon = w;
  }
  if ('opacity' in p) next.opacity = Math.min(1, Math.max(0.3, Number(p.opacity) || 1));
  if ('alwaysOnTop' in p) {
    next.alwaysOnTop = !!p.alwaysOnTop;
    if (win) win.setAlwaysOnTop(next.alwaysOnTop, 'screen-saver');
  }
  if ('autoWander' in p) next.autoWander = !!p.autoWander;
  if ('wanderSpeed' in p) next.wanderSpeed = clampInt(p.wanderSpeed, 4, 80);
  if ('sound' in p) next.sound = !!p.sound;
  if ('quotes' in p) next.quotes = !!p.quotes;
  if ('quotesLang' in p) next.quotesLang = p.quotesLang;
  if ('showBubble' in p) next.showBubble = !!p.showBubble;
  if ('autoLaunch' in p) setAutoLaunch(p.autoLaunch);
  // 拟人化相关：视线跟随 / 物理 / 探头 / 士气 / 专注计时
  // 注意：这个处理器是白名单式的，漏掉的字段会被静默丢弃（存不进 settings.json）
  if ('gaze' in p) next.gaze = !!p.gaze;
  if ('physics' in p) next.physics = !!p.physics;
  if ('peek' in p) next.peek = !!p.peek;
  if ('mood' in p) next.mood = clampInt(p.mood, 0, 100);
  if ('focusMinutes' in p) next.focusMinutes = clampInt(p.focusMinutes, 0, 600);
  if ('focusEndAt' in p) next.focusEndAt = Math.max(0, Math.round(Number(p.focusEndAt) || 0));

  settings.save(next);
  const out = settings.load();

  if (win && !win.isDestroyed()) {
    if ('scale' in p) applyWindowScale();
    if ('opacity' in p) win.setOpacity(out.opacity);
    win.webContents.send('settings:changed', out);
  }
  refreshTray();
  return out;
});

ipcMain.handle('settings:reset', () => {
  settings.reset();
  if (win) {
    applyWindowScale();
    win.setOpacity(1);
    win.setAlwaysOnTop(true, 'screen-saver');
    win.webContents.send('settings:changed', settings.load());
  }
  syncAutoLaunch();
  refreshTray();
  return settings.load();
});

ipcMain.on('win:move', (e, payload) => {
  if (!win) return;
  const dx = Math.round(Number(payload && payload.dx) || 0);
  const dy = Math.round(Number(payload && payload.dy) || 0);
  const b = win.getBounds();
  // 用 setBounds 并显式带上尺寸：只调用 setPosition 在部分 Windows 环境下
  // 会让无边框窗口的宽度逐次累积变大。
  const next = ensureVisible(b.x + dx, b.y + dy, b.width, b.height);
  win.setBounds(next);
  if (DEBUG_TRACE && moveTrace-- > 0) {
    logger.info(`[trace] move dx=${dx} dy=${dy} before=${JSON.stringify(b)} after=${JSON.stringify(win.getBounds())}`);
  }
});

ipcMain.on('win:move-to', (_e, payload) => {
  if (!win) return;
  const b = win.getBounds();
  const x = Math.round(Number(payload && payload.x) || 0);
  const y = Math.round(Number(payload && payload.y) || 0);
  win.setBounds(ensureVisible(x, y, b.width, b.height));
});

ipcMain.handle('win:get-pos', () => {
  if (!win) return null;
  // 注意：getPosition() 返回的是数组 [x, y]，要用 getBounds() 才能拿到 {x, y, width, height}
  const b = win.getBounds();
  return { x: b.x, y: b.y, width: b.width, height: b.height };
});


ipcMain.handle('screen:work-area', () => {
  const wa = screen.getPrimaryDisplay().workArea;
  return { x: wa.x, y: wa.y, width: wa.width, height: wa.height };
});

// 全局光标位置：视线跟随、屏幕边缘探头都要用
ipcMain.handle('screen:cursor', () => {
  const p = screen.getCursorScreenPoint();
  return { x: p.x, y: p.y };
});

// 所有显示器的可用区域，探头模式要把桌宠贴到屏幕边缘
ipcMain.handle('screen:displays', () => {
  return screen.getAllDisplays().map((d) => {
    const wa = d.workArea;
    return { x: wa.x, y: wa.y, width: wa.width, height: wa.height, scale: d.scaleFactor || 1 };
  });
});

ipcMain.on('win:open-settings', () => createSettingsWindow());


ipcMain.on('win:ignore-mouse', (_e, { ignore }) => {
  if (win) win.setIgnoreMouseEvents(!!ignore, { forward: true });
});

ipcMain.on('win:topmost', (_e, { value }) => {
  if (win) win.setAlwaysOnTop(!!value, 'screen-saver');
});

ipcMain.on('win:opacity', (_e, { value }) => {
  if (win) win.setOpacity(Math.min(1, Math.max(0.3, Number(value) || 1)));
});

ipcMain.on('win:hide', () => win && win.hide());
ipcMain.on('app:quit', () => {
  quitting = true;
  app.quit();
});

ipcMain.handle('menu:popup', (e, items) => {
  return new Promise((resolve) => {
    const winRef = BrowserWindow.fromWebContents(e.sender);
    if (!winRef) return resolve(null);

    const send = (action) => {
      if (winRef && !winRef.isDestroyed()) winRef.webContents.send('command', { type: action });
    };

    const build = (list) =>
      (list || []).map((it) => {
        if (it.separator) return { type: 'separator' };
        if (Array.isArray(it.submenu)) return { label: it.label, submenu: build(it.submenu) };
        return {
          label: it.label,
          type: it.type || 'normal',
          checked: it.checked,
          enabled: it.enabled,
          click: () => {
            menu.close();
            send(it.action);
            resolve(it.action);
          },
        };
      });

    const menu = Menu.buildFromTemplate(build(items));
    menu.popup({ window: winRef });
  });
});

/* ------------------------------------------------------------------ 启动 */

// 透明 + 置顶窗口在部分显卡 / 虚拟机环境下会触发 GPU 合成崩溃，
// 导致渲染进程反复重启、桌宠一片空白。这里走软件渲染：桌宠本身
// 没有重负载，帧率影响可以忽略。
if (!process.argv.includes('--gpu')) {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');
}

app.whenReady().then(() => {
  syncAutoLaunch();
  createPetWindow();
  createTray();

  globalShortcut.register('CommandOrControl+Shift+D', () => {
    if (!win) return;
    win.isVisible() ? win.hide() : win.show();
  });

  // 自测用：启动即打开设置窗口
  if (process.argv.includes('--settings')) createSettingsWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createPetWindow();
  });
});

app.on('window-all-closed', (e) => {
  // 桌宠常驻：除非用户主动退出，否则不结束进程
  e.preventDefault?.();
});

app.on('before-quit', () => {
  quitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  tray = null;
});
