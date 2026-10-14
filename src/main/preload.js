'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  // 诊断开关（--nofilter：禁用 SVG 滤镜）
  nofilters: process.argv.includes('--nofilter'),
  // 设置
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  resetSettings: () => ipcRenderer.invoke('settings:reset'),

  // 窗口
  moveWindow: (dx, dy) => ipcRenderer.send('win:move', { dx, dy }),
  moveTo: (x, y) => ipcRenderer.send('win:move-to', { x, y }),
  getWindowPos: () => ipcRenderer.invoke('win:get-pos'),
  getWorkArea: () => ipcRenderer.invoke('screen:work-area'),
  setIgnoreMouse: (ignore) => ipcRenderer.send('win:ignore-mouse', { ignore }),
  setAlwaysOnTop: (v) => ipcRenderer.send('win:topmost', { value: v }),
  setOpacity: (v) => ipcRenderer.send('win:opacity', { value: v }),
  hideWindow: () => ipcRenderer.send('win:hide'),
  openSettings: () => ipcRenderer.send('win:open-settings'),
  quit: () => ipcRenderer.send('app:quit'),

  // 托盘 / 菜单
  popMenu: (items) => ipcRenderer.invoke('menu:popup', items),

  // 事件
  on: (channel, cb) => {
    const allowed = ['command', 'settings:changed', 'app:quit-request'];
    if (!allowed.includes(channel)) return;
    ipcRenderer.on(channel, (_e, payload) => cb(payload));
  },
});
