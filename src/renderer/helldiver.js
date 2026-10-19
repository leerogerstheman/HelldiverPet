/**
 * 绝地潜兵矢量形象（B-01 Tactical v4 为基准）
 * ---------------------------------------------------------------------------
 * 造型对照 Helldivers Wiki 的官方渲染图，本地存于 .ref/（仅参考，不分发）：
 *   helmet-v4.png   B-01_Tactical_v4_Helmet_Render.png   头盔 3/4 视角
 *   body-v4.png     B-01_Tactical_v4_Armor_Render.png     身体 3/4 视角
 *   set1.png        B-01_Tactical_Armor_Set_Image.png     **正面视角**
 *
 * 从正面图里读到的、之前画错的关键结构：
 *   · 头盔顶部是一整条**很宽的亮黄色横带**（不是两根细线）
 *   · 面罩底边是**带 V 形缺口的锐角折线**，不是平滑弧带
 *   · 面罩下方是**呼吸罩**，两侧各一个**黄色框内的银白竖向格栅**
 *   · 胸口：两条**黄色斜带**从肩部向内下收成 V，中间是**银色翼形徽记**
 *   · 腰带下方垂着一块**裙甲**，四周有**很亮的黄色描边**并在正中开叉
 *   · 膝甲、小腿各有**黄色环带**
 *
 * 配色全部走语义 class（.pa / .pt / .pv …），由 pet.css 的皮肤通过
 * CSS 变量注入 —— 换皮肤不用重建 SVG。
 *
 * 坐标：单 group 的局部坐标以双脚站立点为原点 (0,0)，向上为负 y。
 * 整体高度约 256，落在 300×400 的舞台里。
 *   头 -256..-186 · 躯干 -180..-116 · 裙甲 -104..-76 · 膝 -36..-20 · 靴 0
 */

const STAR =
  'M0 -1 L0.2245 -0.309 L0.9511 -0.309 L0.3633 -0.021 L0.5878 0.809 L0 0.3827 ' +
  'L-0.5878 0.809 L-0.3633 -0.021 L-0.9511 -0.309 L-0.2245 -0.309 Z';

function star(cx, cy, r, cls, opacity = 0.9) {
  return `<path d="${STAR}" transform="translate(${cx} ${cy}) scale(${r})" class="${cls}" opacity="${opacity}"/>`;
}

/**
 * Super Earth 骷髅徽（几何化版）
 * ------------------------------------------------------------------
 * 照着官方符号图 .ref/se-symbol.png 逐顶点量出来的，不是手画的。
 * 量法：先取黄色像素包围盒，再按 0.1 归一化网格读坐标，最后把归一化
 * 坐标映射到本地空间（本地以 0,0 为中心，符号宽 14 / 高 14.5，对应原图
 * 1854×1920 的比例）。
 *
 * 特征（和常见卡通骷髅完全不同）：
 *   · 顶是个**平的多边形**山尖，不是圆头
 *   · 两侧在眼窝高度各伸出一个**尖刺**（翼状面颊板）
 *   · 眼窝是**正圆**
 *   · 下方一个**带缺口的小三角**当作鼻部
 */
function skull(cx, cy, s, cls) {
  return `
  <g class="${cls}" transform="translate(${cx} ${cy}) scale(${s})">
    <path d="M 0 -7.25 L 4.06 -5.95 L 4.48 0.15 L 7 2.47 L 4.97 4.28 L 3.85 3.99
             L 3.43 6.24 L 1.82 7.11 L -1.82 7.11 L -3.43 6.24 L -3.85 3.99
             L -4.97 4.28 L -7 2.47 L -4.48 0.15 L -4.06 -5.95 Z"/>
    <circle cx="-1.89" cy="0.65" r="1.5" class="sk-cut"/>
    <circle cx="1.89" cy="0.65" r="1.5" class="sk-cut"/>
    <path d="M -0.91 2.83 L 0.91 2.83 L 0.63 4.57 L 0 3.99 L -0.63 4.57 Z" class="sk-cut"/>
  </g>`;
}

/**
 * 胸口胸徽：Super Earth「飞行员翼章」
 * ------------------------------------------------------------------
 * 坐标单位 = 正面原图 set1.png 的像素，原点取骷髅中心。
 * 量法见 .ref/wing-zoom.png（set1.png 裁 x=156,y=163,w=48,h=28 放大 22 倍）。
 * 关键：翅膀是**两片平行的羽**（一片长主羽 + 一片短副羽），不是三片扇形 ——
 * 我先前按三片扇形画错了。
 */
function wingBadge(cx, cy, s, cls) {
  return `
  <g class="${cls}" transform="translate(${cx} ${cy}) scale(${s})">
    <!-- 中央骷髅（Super Earth 几何徽） -->
    ${skull(0, 1, 0.72, cls)}
    <!-- 左侧：长主羽 -->
    <path d="M -8.5 -3.0 L -40 -1.9 L -39.3 -0.5 L -8.5 0.9 Z"/>
    <!-- 左侧：短副羽（与主羽平行） -->
    <path d="M -9.5 2.0 L -22 1.55 L -21.7 3.55 L -9.5 4.0 Z"/>
    <!-- 右侧镜像 -->
    <path d="M 8.5 -3.0 L 40 -1.9 L 39.3 -0.5 L 8.5 0.9 Z"/>
    <path d="M 9.5 2.0 L 22 1.55 L 21.7 3.55 L 9.5 4.0 Z"/>
    <!-- 下方横条 -->
    <path d="M -13 6.8 L 13 6.8 L 13 8.5 L -13 8.5 Z"/>
  </g>`;
}

/** 披风图案：按皮肤切换 */
const CAPE_MARKS = {
  plain: '',
  stars: [
    [-42, -140, 2.6, 0.45], [-30, -118, 2.0, 0.35], [-48, -106, 2.2, 0.4],
    [-20, -96, 2.4, 0.45], [-34, -80, 1.8, 0.3], [-10, -122, 2.2, 0.35],
    [-12, -80, 2.3, 0.4], [-50, -84, 1.7, 0.3], [10, -122, 2.2, 0.35],
    [20, -96, 2.4, 0.45], [30, -118, 2.0, 0.35], [42, -140, 2.6, 0.45],
    [48, -106, 2.2, 0.4], [12, -80, 2.3, 0.4], [34, -80, 1.8, 0.3],
  ].map(([x, y, r, o]) => star(x, y, r, 'pm', o)).join(''),
  stripes: `
    <g class="pm" opacity="0.32">
      <rect x="-48" y="-156" width="96" height="6" rx="2"/>
      <rect x="-52" y="-138" width="104" height="7" rx="2"/>
      <rect x="-50" y="-118" width="100" height="6" rx="2"/>
      <rect x="-52" y="-98" width="104" height="7" rx="2"/>
      <rect x="-46" y="-80" width="92" height="6" rx="2"/>
    </g>`,
  eagle: `
    <g class="pm" opacity="0.38">${wingBadge(0, -124, 0.34, 'pm')}</g>
    <g class="pm" opacity="0.24">${wingBadge(-34, -90, 0.22, 'pm')}${wingBadge(34, -90, 0.22, 'pm')}</g>`,
  skull: `
    <g class="pm" opacity="0.4">${skull(0, -120, 1.15, 'pm')}</g>
    <g class="pm" opacity="0.26">${skull(-34, -88, 0.7, 'pm')}${skull(34, -88, 0.7, 'pm')}</g>`,
};

/** 呼吸罩格栅：黄色边框 + 银白百叶叶片 */
function louver(cx, cy, frameCls, slatCls) {
  return `
  <g>
    <rect x="${cx - 7.5}" y="${cy - 9}" width="15" height="18" rx="2.5"
          class="${frameCls}" fill="none" stroke-width="1.6" opacity="0.9"/>
    <path d="M ${cx - 5.2} ${cy - 5} L ${cx + 5.2} ${cy - 5}
             M ${cx - 5.2} ${cy} L ${cx + 5.2} ${cy}
             M ${cx - 5.2} ${cy + 5} L ${cx + 5.2} ${cy + 5}"
          class="${slatCls}" stroke-width="3.2" stroke-linecap="round" fill="none"/>
  </g>`;
}

/**
 * 武器库
 * ---------------------------------------------------------------------------
 * 剪影对照 wiki 上的战略配备图标（本地 .ref/ic-*.svg，由官方图标
 * Stratagem Icon Background 渲染而成）：
 *   MG-43 通用机枪   直筒 + 机身下方直线弹匣，水平感强
 *   GR-8 无后坐力炮  机身厚重方块，炮管短而粗
 *   FLAM-40 火焰喷射器  极细长喷管 + 身后燃料罐，纤细
 *   GL-21 榴弹发射器  短粗炮管，整枪敦实
 *   APW-1 反器材步枪  超长细枪管 + 两脚架 + 大瞄准镜
 *
 * 所有武器画在同一套本地坐标里：枪口朝 +x，握把在原点附近，
 * 外层共用同一个 transform，只靠 CSS 切换显示哪一个。
 */
const WEAPONS = {
  rifle: `
    <path class="wg3" d="M -40 -7 L -10 -7 L -10 8 L -40 8 Z"/>
    <path class="wg1" d="M -12 -10 L 36 -10 L 36 11 L -12 11 Z"/>
    <path class="wg3" d="M 34 -4 L 74 -4 L 74 5 L 34 5 Z"/>
    <path class="wg1" d="M 70 -8 L 84 -8 L 84 9 L 70 9 Z"/>
    <path class="wg3" d="M 4 -19 L 28 -19 L 28 -9 L 4 -9 Z"/>
    <path class="wg3" d="M 0 11 L 14 11 L 11 32 L 3 32 Z"/>
    <path class="wg3" d="M -14 11 L -1 11 L 0 24 L -12 24 Z"/>
    <path class="wg5" d="M -22 -10 L -22 11" stroke-width="2.4" fill="none" opacity="0.55"/>
    <path class="wg4" d="M 12 -8 L 22 -8 L 22 -4 L 12 -4 Z" opacity="0.8"/>`,

  mg43: `
    <!-- 直筒枪托 -->
    <path class="wg1" d="M -42 -7 L -16 -7 L -16 8 L -42 8 Z"/>
    <path class="wg2" d="M -42 -7 L -34 -7 L -34 8 L -42 8 Z"/>
    <!-- 机身 -->
    <path class="wg1" d="M -18 -11 L 22 -11 L 22 10 L -18 10 Z"/>
    <path class="wg2" d="M -18 -11 L 22 -11 L 22 -5 L -18 -5 Z"/>
    <!-- 长枪管 -->
    <path class="wg2" d="M 20 -3.5 L 68 -3.5 L 68 3.5 L 20 3.5 Z"/>
    <path class="wg1" d="M 64 -6 L 76 -6 L 76 6 L 64 6 Z"/>
    <!-- 顶部导轨 -->
    <path class="wg2" d="M -12 -14 L 30 -14 L 30 -10 L -12 -10 Z"/>
    <rect class="wg1" x="2" y="-18" width="16" height="5" rx="1.5"/>
    <!-- 直线弹匣（这是 MG-43 的辨识特征） -->
    <path class="wg2" d="M -2 10 L 16 10 L 13 34 L 1 34 Z"/>
    <path class="wg4" d="M -1 16 L 15 16 M 0 24 L 14 24" stroke-width="1.8" fill="none" opacity="0.5"/>
    <!-- 握把 -->
    <path class="wg2" d="M -14 10 L -2 10 L -1 24 L -13 24 Z"/>`,

  gr8: `
    <!-- 厚枪托 -->
    <path class="wg1" d="M -40 -8 L -18 -8 L -18 9 L -40 9 Z"/>
    <!-- 厚重机身（GR-8 的辨识特征：整块方砖） -->
    <path class="wg1" d="M -20 -15 L 26 -15 L 26 12 L -20 12 Z"/>
    <path class="wg2" d="M -20 4 L 26 4 L 26 12 L -20 12 Z"/>
    <!-- 顶部弹鼓 -->
    <circle class="wg2" cx="4" cy="-21" r="9"/>
    <circle class="wg4" cx="4" cy="-21" r="3.4" fill="none" stroke-width="1.8" opacity="0.6"/>
    <!-- 短粗炮管 -->
    <path class="wg2" d="M 24 -7 L 58 -7 L 58 7 L 24 7 Z"/>
    <path class="wg1" d="M 54 -10 L 68 -10 L 68 10 L 54 10 Z"/>
    <path class="wg4" d="M 57 -8 L 57 8 M 62 -8 L 62 8" stroke-width="1.8" fill="none" opacity="0.55"/>
    <!-- 握把 -->
    <path class="wg2" d="M -16 12 L -4 12 L -3 28 L -15 28 Z"/>`,

  flam40: `
    <!-- 燃料罐（FLAM-40 的辨识特征：身后一只罐子） -->
    <path class="wg1" d="M -40 -9 L -14 -9 L -14 13 L -40 13 Z"/>
    <path class="wg2" d="M -40 -9 L -40 13 L -46 13 L -46 -9 Z"/>
    <path class="wg4" d="M -37 -4 L -17 -4" stroke-width="2.2" fill="none" opacity="0.6"/>
    <!-- 机身 -->
    <path class="wg1" d="M -16 -7 L 18 -7 L 18 8 L -16 8 Z"/>
    <!-- 点火罐 -->
    <rect class="wg2" x="-2" y="-13" width="16" height="7" rx="2"/>
    <!-- 极细长喷管 -->
    <path class="wg2" d="M 16 -2.2 L 78 -2.2 L 78 2.2 L 16 2.2 Z"/>
    <path class="wg1" d="M 74 -3.6 L 84 -3.6 L 84 3.6 L 74 3.6 Z"/>
    <!-- 握把 -->
    <path class="wg2" d="M -12 8 L 0 8 L 1 24 L -11 24 Z"/>`,

  gl21: `
    <!-- 枪托 -->
    <path class="wg1" d="M -38 -9 L -16 -9 L -16 10 L -38 10 Z"/>
    <!-- 短粗炮管（GL-21 的辨识特征：又粗又短） -->
    <path class="wg1" d="M 18 -10 L 52 -10 L 52 10 L 18 10 Z"/>
    <path class="wg2" d="M 48 -13 L 62 -13 L 62 13 L 48 13 Z"/>
    <path class="wg4" d="M 52 -11 L 52 11 M 57 -11 L 57 11" stroke-width="2" fill="none" opacity="0.55"/>
    <!-- 弹鼓 -->
    <circle class="wg2" cx="0" cy="-1" r="12"/>
    <circle class="wg4" cx="0" cy="-1" r="4" fill="none" stroke-width="2" opacity="0.6"/>
    <path class="wg1" d="M -16 -11 L -8 -11 L -8 11 L -16 11 Z"/>
    <!-- 握把 -->
    <path class="wg2" d="M -12 11 L 0 11 L 1 27 L -11 27 Z"/>`,

  apw1: `
    <!-- 枪托 -->
    <path class="wg1" d="M -44 -7 L -16 -7 L -16 9 L -44 9 Z"/>
    <!-- 机身 -->
    <path class="wg1" d="M -18 -9 L 20 -9 L 20 9 L -18 9 Z"/>
    <path class="wg2" d="M -18 -9 L 20 -9 L 20 -3 L -18 -3 Z"/>
    <!-- 超长细枪管（APW-1 的辨识特征） -->
    <path class="wg2" d="M 18 -2.6 L 88 -2.6 L 88 2.6 L 18 2.6 Z"/>
    <!-- 消焰器 -->
    <path class="wg1" d="M 84 -5 L 98 -5 L 98 5 L 84 5 Z"/>
    <path class="wg4" d="M 88 -4 L 88 4 M 93 -4 L 93 4" stroke-width="1.8" fill="none" opacity="0.6"/>
    <!-- 大瞄准镜 -->
    <rect class="wg2" x="-6" y="-17" width="28" height="8" rx="2"/>
    <rect class="wg4" x="18" y="-16" width="6" height="6" rx="1"/>
    <!-- 两脚架 -->
    <path class="wg3" d="M 44 3 L 50 3 L 44 26 L 40 26 Z"/>
    <path class="wg3" d="M 54 3 L 58 3 L 58 26 L 54 26 Z"/>
    <!-- 握把 -->
    <path class="wg2" d="M -14 9 L -2 9 L -1 24 L -13 24 Z"/>`,
};

window.HELLDIVER_SVG = `
<svg class="diver-svg" viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="gShadow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%"   stop-color="rgba(0,0,0,0.40)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>

    <!-- 面罩：镜面反射渐变，颜色由 CSS 变量驱动 -->
    <linearGradient id="gVisor" x1="0.12" y1="0" x2="0.6" y2="1">
      <stop id="vHi" offset="0%"   stop-color="#ffffff"/>
      <stop id="vMid" offset="40%"  stop-color="#c6cfda"/>
      <stop id="vLo" offset="100%" stop-color="#7d8794"/>
    </linearGradient>
    <!-- 盔壳：深色金属，主光来自左上 -->
    <linearGradient id="gShell" x1="0.18" y1="0" x2="0.78" y2="1">
      <stop id="sHi" offset="0%"   stop-color="#5c646e"/>
      <stop id="sMid" offset="50%"  stop-color="#3a4048"/>
      <stop id="sLo" offset="100%" stop-color="#24282e"/>
    </linearGradient>
    <!-- 风衣 / 战术服：哑光织物 -->
    <linearGradient id="gCoat" x1="0.12" y1="0" x2="0.88" y2="1">
      <stop id="cHi" offset="0%"   stop-color="#4a5058"/>
      <stop id="cMid" offset="42%"  stop-color="#2f343b"/>
      <stop id="cLo" offset="100%" stop-color="#191c21"/>
    </linearGradient>
    <!-- 金属护片：胫甲 / 前臂护具 -->
    <linearGradient id="gMetal" x1="0.14" y1="0" x2="0.82" y2="1">
      <stop id="mHi" offset="0%"   stop-color="#98a1ab"/>
      <stop id="mMid" offset="48%"  stop-color="#6b737d"/>
      <stop id="mLo" offset="100%" stop-color="#3d434b"/>
    </linearGradient>
    <!-- 橡胶 / 塑料：面罩胶条、呼吸面甲 -->
    <linearGradient id="gRubber" x1="0.2" y1="0" x2="0.72" y2="1">
      <stop id="rHi" offset="0%"   stop-color="#474d55"/>
      <stop id="rMid" offset="54%"  stop-color="#2a2e34"/>
      <stop id="rLo" offset="100%" stop-color="#15171b"/>
    </linearGradient>
    <!-- 黄色涂装：有漆面高光，不是平涂 -->
    <linearGradient id="gTrim" x1="0.1" y1="0" x2="0.65" y2="1">
      <stop id="tHi" offset="0%"   stop-color="#ffe694"/>
      <stop id="tMid" offset="46%"  stop-color="#f2c230"/>
      <stop id="tLo" offset="100%" stop-color="#a87615"/>
    </linearGradient>
    <!-- 披风的编织网纹 -->
    <pattern id="pMesh" width="5" height="5" patternUnits="userSpaceOnUse">
      <path d="M0 0 L5 5 M5 0 L0 5" stroke="#ffffff" stroke-width="0.5" opacity="0.055"/>
    </pattern>

    <clipPath id="helmetClip">
      <path d="M -16 -240 Q -16.4 -254 0 -256.5 Q 16.4 -254 16 -240
               L 14 -225 Q 12.4 -214 6.8 -212.4 L -6.8 -212.4 Q -12.4 -214 -14 -225 Z"/>
    </clipPath>
    <clipPath id="visorClip">
      <path d="M -14.4 -235.2 Q 0 -238.2 14.4 -235.2 L 13.8 -225.2 L 7.8 -220.8 L 0 -223.2
               L -7.8 -220.8 L -13.8 -225.2 Z"/>
    </clipPath>
    <clipPath id="capeClip">
      <path d="M -26 -196 C -44 -156, -50 -100, -44 -56 C -28 -66, -12 -70, 0 -70
               C 12 -70, 28 -66, 44 -56 C 50 -100, 44 -156, 26 -196 Z"/>
    </clipPath>
  </defs>

  <g transform="translate(150 384)">
  <g id="diver">

    <!-- 投影 -->
    <ellipse id="shadow" cx="0" cy="4" rx="46" ry="9" fill="url(#gShadow)" pointer-events="none"/>

    <!-- ================= 披风（织网质感，最靠里层） ================= -->
    <g id="cape" pointer-events="none">
      <path class="pc" d="M -26 -196 C -44 -156, -50 -100, -44 -56 C -28 -66, -12 -70, 0 -70
                           C 12 -70, 28 -66, 44 -56 C 50 -100, 44 -156, 26 -196 Z"/>
      <g clip-path="url(#capeClip)">
        <rect x="-52" y="-200" width="104" height="150" fill="url(#pMesh)"/>
        <g class="cape-marks cm-plain"></g>
        <g class="cape-marks cm-stars">${CAPE_MARKS.stars}</g>
        <g class="cape-marks cm-stripes">${CAPE_MARKS.stripes}</g>
        <g class="cape-marks cm-eagle">${CAPE_MARKS.eagle}</g>
        <g class="cape-marks cm-skull">${CAPE_MARKS.skull}</g>
      </g>
      <!-- 左缘冷光边（主光在左上） -->
      <path class="prim" d="M -26 -196 C -40 -162, -47 -116, -45 -74" fill="none" stroke-width="1.6" opacity="0.5"/>
      <path class="pcline" d="M 26 -196 C 42 -164, 49 -150, 51 -136" fill="none" stroke-width="1.6"/>
    </g>

    <!-- ================= 腿 =================
         比例按官方正面图量：靴 -30..0 · 胫甲 -64..-30 · 膝 -80..-62 · 大腿 -120..-78 -->
    <g id="legs" pointer-events="none">
      <g id="leg-l">
        <!-- 大腿：官方正面图上大腿约 17 单位宽，不是细棍 -->
        <path class="pcoat" d="M -19 -113 L -2 -113 L -2.5 -74 L -20 -74 Z"/>
        <path class="pcoat2" d="M -19 -113 L -12 -113 L -12.5 -74 L -20 -74 Z" opacity="0.5"/>
        <!-- 大腿绑带扣 -->
        <rect class="pbb" x="-19.5" y="-99" width="9" height="5.4" rx="1.3" transform="rotate(-5 -15 -96.3)"/>
        <!-- 膝盖护片：亮面圆顶 -->
        <path class="pkneem" d="M -20 -72 Q -11 -78.5 -2 -72 L -2.5 -58 Q -11 -52 -21 -58 Z"/>
        <path class="prim" d="M -18.4 -71 Q -11 -75.4 -5 -71" fill="none" stroke-width="1.5" opacity="0.55"/>
        <!-- 膝盖黄弧（压在护片上沿） -->
        <path class="pt" d="M -21.6 -72.4 Q -11 -79.8 -0.4 -72.8 L -0.4 -68.6 Q -11 -75.2 -21.6 -68.2 Z"/>
        <!-- 胫甲 -->
        <path class="pmetal" d="M -20.5 -58 L -2.5 -58 L -3 -28 L -21 -28 Z"/>
        <path class="pmetaledge" d="M -2.5 -58 L -3 -28 L -6.6 -28 L -6 -58 Z" opacity="0.55"/>
        <!-- 靴子 -->
        <path class="pboot" d="M -21 -28 L -3 -28 L -3.6 -8 L 5.4 -8 L 6 0 L -22 0 Z"/>
        <path class="psole" d="M -22 0 L 6 0 L 5.4 3.2 L -22.6 3.2 Z"/>
        <path class="prim" d="M -20.4 -26 L -3 -26" fill="none" stroke-width="1.3" opacity="0.4"/>
      </g>
      <g id="leg-r">
        <path class="pcoat" d="M 2 -113 L 19 -113 L 20 -74 L 2.5 -74 Z"/>
        <path class="pcoat2" d="M 12 -113 L 19 -113 L 20 -74 L 12.5 -74 Z" opacity="0.5"/>
        <rect class="pbb" x="10.5" y="-99" width="9" height="5.4" rx="1.3" transform="rotate(5 15 -96.3)"/>
        <path class="pkneem" d="M 2 -72 Q 11 -78.5 20 -72 L 21 -58 Q 11 -52 2.5 -58 Z"/>
        <path class="prim" d="M 5 -71 Q 11 -75.4 17 -71" fill="none" stroke-width="1.5" opacity="0.55"/>
        <path class="pt" d="M 0.4 -72.8 Q 11 -79.8 21.6 -72.4 L 21.6 -68.2 Q 11 -75.2 0.4 -68.6 Z"/>
        <path class="pmetal" d="M 2.5 -58 L 20.5 -58 L 21 -28 L 3 -28 Z"/>
        <path class="pmetaledge" d="M 6 -58 L 6.6 -28 L 3 -28 L 2.5 -58 Z" opacity="0.55"/>
        <path class="pboot" d="M 3 -28 L 21 -28 L 22 0 L 6 0 L 5.4 -8 L 3 -28 Z"/>
        <path class="psole" d="M 6 0 L 22.6 3.2 L 22 0 Z"/>
      </g>
    </g>

    <!-- ================= 身体 ================= -->
    <g class="part-body">

      <g class="torso">
        <!-- 外层风衣（躯干主体） -->
        <path class="pcoat" d="M -23 -203 Q -28 -184, -24.5 -158 L -22.5 -130 Q -23.5 -116, -24.5 -106
                              L 24.5 -106 Q 23.5 -116, 22.5 -130 L 24.5 -158 Q 28 -184, 23 -203 Z"/>
        <path class="pcoat2" d="M 16 -160 Q 20 -130, 21 -106 L 24.5 -106 Q 23.5 -116, 22.5 -130 L 24.5 -158 Z" opacity="0.6"/>
        <path class="pao" d="M -3.4 -156 L 3.4 -156 L 4.6 -106 L -4.6 -106 Z" opacity="0.6"/>
        <!-- 前襟黄边：腰带扣往下，再左右分叉（官方图就是这样） -->
        <path class="ptl" d="M 0 -150 L 0 -134 L -5 -126 L -23 -117" stroke-width="2.3" opacity="0.95"/>
        <path class="ptl" d="M 0 -150 L 0 -134 L 6 -127 L 23 -118" stroke-width="2.3" opacity="0.95"/>
        <!-- 下摆黄边 -->
        <path class="ptl" d="M -24.5 -108 Q 0 -103.4 24.5 -108" stroke-width="1.9" opacity="0.9"/>

        <!-- 胸口护板 -->
        <path class="pa" d="M -22 -202 L 22 -202 L 24 -181 Q 0 -175, -24 -181 Z"/>
        <path class="prim" d="M 22 -201 L 23.6 -181.6" fill="none" stroke-width="1.3" opacity="0.4"/>
        <!-- 黄色 V 形胸带：肩部向内下收成 V（官方图最显眼的结构） -->
        <path class="pt" d="M -30 -199 L -24.5 -201.5 L -3.5 -182 L -9.5 -178.5 Z"/>
        <path class="pt" d="M 30 -199 L 24.5 -201.5 L 3.5 -182 L 9.5 -178.5 Z"/>
        <!-- 横向黄带 -->
        <path class="pt" d="M -19.5 -177.5 L 19.5 -177.5 L 19 -171.5 L -19 -171.5 Z"/>
        <rect class="pbb" x="-5" y="-178" width="10" height="7.5" rx="1.5"/>
        <!-- 飞行员翼章（Super Earth） -->
        ${wingBadge(0, -190, 0.33, 'peagle')}

        <!-- 肩甲：多边形板件，外缘比躯干还宽（官方图肩甲伸到 x≈±46） -->
        <path class="pa" d="M -21 -203 Q -36 -206.5, -46 -196 Q -50.5 -184, -44 -173.5
                             L -26 -169 Q -21.5 -185, -21 -203 Z"/>
        <path class="pa" d="M 21 -203 Q 36 -206.5, 46 -196 Q 50.5 -184, 44 -173.5
                           L 26 -169 Q 21.5 -185, 21 -203 Z"/>
        <!-- 肩甲上的黄色折角 -->
        <path class="pt" d="M -43 -196 L -36.5 -200 L -31 -185 L -38 -181.5 Z"/>
        <path class="pt" d="M 43 -196 L 36.5 -200 L 31 -185 L 38 -181.5 Z"/>
        <!-- 肩甲边缘高光 -->
        <path class="ptl" d="M -44 -194 Q -34 -203, -22 -201.5" stroke-width="1.7" stroke-linecap="round" opacity="0.65"/>
        <path class="ptl" d="M 44 -194 Q 34 -203, 22 -201.5" stroke-width="1.7" stroke-linecap="round" opacity="0.65"/>
        ${skull(-39, -188, 0.44, 'pt')}
        ${skull(39, -188, 0.44, 'pt')}

        <!-- 腰带 -->
        <path class="pc" d="M -20 -158 L 20 -158 L 19.5 -147.5 Q 0 -144.5, -19.5 -147.5 Z"/>
        <path class="plabel" d="M -15 -155 L -8 -155 L -8 -149.5 L -15 -149.5 Z" opacity="0.85"/>
        <!-- 骷髅扣 -->
        <rect class="pbb" x="-5" y="-159" width="10" height="12" rx="2.5"/>
        ${skull(0, -153, 0.46, 'pt')}
      </g>

      <!-- 敬礼臂：两段式骨骼，锚点在肩 -->
      <g transform="translate(-33 -196)">
        <g class="upper">
          <path class="pstroked" d="M 0 0 L -2 26" stroke-width="22" stroke-linecap="round"/>
          <path class="pstroke" d="M 0 0 L -2 26" stroke-width="19" stroke-linecap="round"/>
          <path class="pstrokeh" d="M -4 1 L -6 25" stroke-width="5" stroke-linecap="round"/>
          <path class="ptarm" d="M -9 -8 L 2 -12" stroke-width="5.5" stroke-linecap="round" opacity="0.95"/>
          <g transform="translate(-2 26)">
            <g class="forearm">
              <path class="pstroked" d="M 0 0 L 1 24" stroke-width="18" stroke-linecap="round"/>
              <path class="pstroke" d="M 0 0 L 1 24" stroke-width="15" stroke-linecap="round"/>
              <path class="pstrokeh" d="M -4 1 L -3 23" stroke-width="4" stroke-linecap="round"/>
              <circle class="ph" cx="2" cy="29" r="8"/>
              <circle class="phs" cx="2" cy="29" r="8" fill="none" stroke-width="1.2"/>
              <path class="ptl" d="M -2 25 L 6 25" stroke-width="1.9" stroke-linecap="round" opacity="0.8"/>
            </g>
          </g>
        </g>
      </g>
    </g>

    <!-- ================= 武器 =================
         六款共用一个挂点，靠 CSS 显示当前选中的那一款 -->
    <g transform="translate(36 -142) rotate(-30) scale(0.72)" pointer-events="none">
      ${Object.keys(WEAPONS)
        .map((k) => `<g id="gun-${k}" class="wep wep-${k}">${WEAPONS[k]}</g>`)
        .join('\n      ')}
    </g>

    <!-- 持枪臂：画在枪之后，手才像是握着枪 -->
    <g transform="translate(33 -182)">
      <g id="arm-gun">
        <path class="pstroked" d="M 0 0 L 5 26 L -4 44" stroke-width="22"
              stroke-linecap="round" stroke-linejoin="round"/>
        <path class="pstroke" d="M 0 0 L 5 26 L -4 44" stroke-width="19"
              stroke-linecap="round" stroke-linejoin="round"/>
        <path class="pstrokeh" d="M -4 1 L 1 25 L -8 42" stroke-width="5"
              stroke-linecap="round" stroke-linejoin="round"/>
        <path class="ptarm" d="M -1 -8 L 10 -12" stroke-width="5.5" stroke-linecap="round" opacity="0.95"/>
        <circle class="ph" cx="-4" cy="48" r="8"/>
        <circle class="phs" cx="-4" cy="48" r="8" fill="none" stroke-width="1.2"/>
        <path class="ptl" d="M -9 44 L 1 44" stroke-width="1.9" stroke-linecap="round" opacity="0.8"/>
      </g>
    </g>

    <!-- ================= 头盔 =================
         官方正面图上头盔接近正圆（宽 29 / 高 32 个局部单位），
         之前拉成 31×45 的长条，看起来就像「小脑袋长脖子」。 -->
    <g id="head" class="part-head">
      <!-- 颈圈（织物质感） -->
      <path class="pcollar" d="M -16 -218 L 16 -218 L 15.2 -206 Q 0 -202.6, -15.2 -206 Z"/>
      <path class="pcollar2" d="M -16 -217 L -13 -218.2 L -12.4 -207 L -15 -207.4 Z" opacity="0.55"/>

      <!-- 盔壳 -->
      <path class="pshell" d="M -16 -240 Q -16.4 -254 0 -256.5 Q 16.4 -254 16 -240
                              L 14 -225 Q 12.4 -214 6.8 -212.4 L -6.8 -212.4
                              Q -12.4 -214 -14 -225 Z"/>
      <!-- 盔顶那条很宽的亮黄横带 -->
      <path class="pstripe2" d="M -16.1 -239.5 Q -16.4 -254.2 0 -256.6 Q 16.4 -254.2 16.1 -239.5
                              L 10.2 -239 Q 10.7 -250 0 -251.6 Q -10.7 -250 -10.2 -239 Z"/>
      <!-- 盔顶主光高光 -->
      <path class="pspec" d="M -12.8 -245 Q -10.8 -252.8 -2 -254.6 Q -8.2 -251.8 -10.8 -243.2 Z" opacity="0.4"/>
      <!-- 盔壳下缘的环境遮蔽 -->
      <path class="pao" d="M -13.8 -225 Q 0 -213.6 13.8 -225 Q 12.4 -214 6.8 -212.6 L -6.8 -212.6 Q -12.4 -214 -13.8 -225 Z" opacity="0.5"/>

      <!-- 眉沿（面罩上方的凸起边框） -->
      <path class="pshell2" d="M -14.8 -236.6 Q 0 -240 14.8 -236.6 L 14.2 -233 Q 0 -236.4 -14.2 -233 Z" opacity="0.5"/>

      <!-- 面罩胶条（黑色橡胶边框） -->
      <path class="pgask" d="M -15.6 -236.2 Q 0 -239.8 15.6 -236.2 L 15 -224 L 8.4 -218.8
                             L 0 -221.6 L -8.4 -218.8 L -15 -224 Z"/>
      <!-- 镜面银色面罩：底边是带 V 形缺口的锐角折线 -->
      <path class="pv" d="M -14.4 -235.2 Q 0 -238.2 14.4 -235.2 L 13.8 -225.2 L 7.8 -220.8
                          L 0 -223.2 L -7.8 -220.8 L -13.8 -225.2 Z"/>
      <!-- 面罩上的镜面反光：两道竖直亮带，是「看起来很精致」的关键 -->
      <g clip-path="url(#visorClip)">
        <path class="pgloss" d="M -11.8 -234.6 Q -6.8 -236 -5.2 -235 L -8 -221.6 L -12.6 -222.8 Z" opacity="0.6"/>
        <path class="pgloss" d="M 6.8 -235.4 Q 10.8 -234.5 11.4 -233 L 9.6 -220.8 L 5.6 -222 Z" opacity="0.4"/>
      </g>

      <!-- 防毒面具版面罩（CE-74 Breaker 用：圆护目镜 + 滤罐） -->
      <g class="alt-face" pointer-events="none">
        <path class="pbreath" d="M -13.6 -224 Q 0 -218, 13.6 -224 L 11.8 -215 Q 6.6 -211 0 -211 Q -6.6 -211 -11.8 -215 Z"/>
        <circle class="pmask" cx="-7.8" cy="-217" r="4.4"/>
        <circle class="pmask" cx="7.8" cy="-217" r="4.4"/>
        <circle class="pmaskin" cx="-7.8" cy="-217" r="2.7"/>
        <circle class="pmaskin" cx="7.8" cy="-217" r="2.7"/>
        <path class="pbreath2" d="M -3.2 -218 L 3.2 -218 L 2.6 -209.4 L -2.6 -209.4 Z"/>
        <rect class="pmask" x="-2.2" y="-209" width="4.4" height="4.6" rx="1"/>
      </g>

      <!-- 呼吸面甲（哑光橡胶） -->
      <path class="prubber" d="M -13.8 -224 L 13.8 -224 L 12 -215 Q 6.6 -211 0 -211
                               Q -6.6 -211 -12 -215 Z"/>
      <!-- 面甲中央凸脊 -->
      <path class="prubber2" d="M -2.6 -222.2 L 2.6 -222.2 L 3 -212.2 L -3 -212.2 Z" opacity="0.75"/>
      <!-- 面甲竖向凹槽 -->
      <path class="pao" d="M -0.9 -221 L 0.9 -221 L 1.1 -212.8 L -1.1 -212.8 Z" opacity="0.55"/>
      <!-- 两侧银白竖栅（黄色框内） -->
      <rect class="pt" x="-13.2" y="-221.6" width="7.4" height="9.6" rx="1.5"/>
      <rect class="pvl" x="-12" y="-220.4" width="5" height="7.2" rx="0.7"/>
      <rect class="pt" x="5.8" y="-221.6" width="7.4" height="9.6" rx="1.5"/>
      <rect class="pvl" x="7" y="-220.4" width="5" height="7.2" rx="0.7"/>

      <!-- 侧面：浅灰盾形骷髅标（官方图是浅色盾牌贴花，不是黄骷髅） -->
      <g transform="translate(-10 -241) scale(0.48)">
        <path class="pshield" d="M 0 -8 L 5.6 -5.2 L 5.6 1.6 Q 5.6 6.2 0 8.4 Q -5.6 6.2 -5.6 1.6 L -5.6 -5.2 Z"/>
        ${skull(0, 0, 0.8, 'pblack')}
      </g>
      <!-- 右侧：机械阀 + 铆钉 -->
      <g class="pvalve">
        <rect class="phs" x="9.8" y="-244" width="5.6" height="5.2" rx="1" fill="none" stroke-width="1"/>
        <rect class="ph" x="11" y="-242.9" width="3.2" height="3.2" rx="0.6"/>
      </g>
      <circle class="ph" cx="-7.8" cy="-230" r="0.85"/>
      <circle class="ph" cx="7.8" cy="-230" r="0.85"/>
    </g>

  </g>
  </g>
</svg>
`;
