'use strict';

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DEFAULTS = {
  // 外观
  scale: 1.0, // 0.5 ~ 2.0
  skin: 'b01', // 见 renderer/pet.css 里的皮肤定义
  weapon: 'rifle', // 见 renderer/quotes.js 的 WEAPONS
  alwaysOnTop: true,
  // 行为
  autoWander: true, // 随机在屏幕底部巡逻
  wanderSpeed: 18, // 像素 / 秒
  sound: true, // 合成音效
  // 台词
  quotes: true,
  quotesLang: 'cn', // cn | en | both
  // 系统
  autoLaunch: false,
  // 内部
  opacity: 1.0,
  showBubble: true,
};

let cached = null;

function filePath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function load() {
  if (cached) return cached;
  try {
    const raw = fs.readFileSync(filePath(), 'utf8');
    cached = Object.assign({}, DEFAULTS, JSON.parse(raw));
  } catch (_) {
    cached = Object.assign({}, DEFAULTS);
  }
  return cached;
}

function save(patch) {
  const next = Object.assign(load(), patch || {});
  cached = next;
  try {
    fs.mkdirSync(path.dirname(filePath()), { recursive: true });
    fs.writeFileSync(filePath(), JSON.stringify(next, null, 2), 'utf8');
  } catch (err) {
    const logger = require('./logger');
    logger.error('[settings] 保存失败:', err.message);
  }
  return cached;
}

function get(key) {
  return load()[key];
}

function reset() {
  cached = Object.assign({}, DEFAULTS);
  try {
    fs.writeFileSync(filePath(), JSON.stringify(cached, null, 2), 'utf8');
  } catch (_) {}
  return cached;
}

module.exports = { DEFAULTS, load, save, get, reset };
