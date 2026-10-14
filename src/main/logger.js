'use strict';

/**
 * 极简文件日志。
 * 桌宠是 GUI 程序，stdout 往往连着一个已经被关闭的管道，直接 console.log
 * 会触发 EPIPE 并把主进程带崩，所以统一写文件。
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let file = null;

function target() {
  if (file) return file;
  try {
    const dir = app.getPath('logs') || path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(dir, { recursive: true });
    file = path.join(dir, 'helldiver-pet.log');
  } catch (_) {
    file = null;
  }
  return file;
}

function log(...args) {
  const f = target();
  if (!f) return;
  const line = args
    .map((a) => (typeof a === 'string' ? a : (() => { try { return JSON.stringify(a); } catch (_) { return String(a); } })()))
    .join(' ');
  try {
    // 只保留最近 1MB，避免日志无限增长
    try {
      if (fs.existsSync(f) && fs.statSync(f).size > 1024 * 1024) fs.writeFileSync(f, '');
    } catch (_) {
      /* 尺寸检查失败不影响写入 */
    }
    fs.appendFileSync(f, `[${new Date().toISOString()}] ${line}\n`);
  } catch (_) {
    /* 日志失败不影响主流程 */
  }
}

module.exports = {
  log,
  info: (...a) => log('INFO', ...a),
  warn: (...a) => log('WARN', ...a),
  error: (...a) => log('ERROR', ...a),
};
