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
    <linearGradient id="gVisor" x1="0.15" y1="0" x2="0.6" y2="1">
      <stop id="vHi" offset="0%"   stop-color="#ffffff"/>
      <stop id="vMid" offset="45%" stop-color="#c6cfda"/>
      <stop id="vLo" offset="100%" stop-color="#7d8794"/>
    </linearGradient>
    <linearGradient id="gShell" x1="0.2" y1="0" x2="0.7" y2="1">
      <stop id="sHi" offset="0%"   stop-color="#5c646e"/>
      <stop id="sMid" offset="55%" stop-color="#3a4048"/>
      <stop id="sLo" offset="100%" stop-color="#24282e"/>
    </linearGradient>

    <clipPath id="helmetClip">
      <path d="M -38 -232 Q -40 -256, 0 -257 Q 40 -256, 38 -232
               L 36 -206 Q 35 -188, 24 -186 L -24 -186 Q -35 -188, -36 -206 Z"/>
    </clipPath>
    <clipPath id="capeClip">
      <path d="M -32 -180 C -56 -144, -62 -80, -52 -24 C -34 -38, -15 -44, 0 -44
               C 15 -44, 34 -38, 52 -24 C 62 -80, 56 -144, 32 -180 Z"/>
    </clipPath>
    <!-- 面罩裁剪：视线跟随时高光要在面罩内部滑动，不能溢出到盔壳上。
         id 是全局的，注意别和别的 clipPath 撞名。 -->
    <clipPath id="visorClip">
      <path d="M -34 -231 Q 0 -236, 34 -231 L 33 -210 L 25 -204 L 17 -210
               L 0 -207 L -17 -210 L -25 -204 L -33 -210 Z"/>
    </clipPath>
  </defs>

  <g transform="translate(150 384)">
  <g id="diver">

    <!-- 投影 -->
    <ellipse id="shadow" cx="0" cy="4" rx="50" ry="10" fill="url(#gShadow)" pointer-events="none"/>

    <!-- ================= 披风（近黑深灰） ================= -->
    <g id="cape" pointer-events="none">
      <path class="pc" d="M -32 -180 C -56 -144, -62 -80, -52 -24 C -34 -38, -15 -44, 0 -44
                           C 15 -44, 34 -38, 52 -24 C 62 -80, 56 -144, 32 -180 Z"/>
      <path class="pcape-shade" d="M 0 -180 C 18 -154, 30 -96, 26 -44 C 18 -43, 8 -43, 0 -44 Z"/>
      <g clip-path="url(#capeClip)">
        <g class="cape-marks cm-plain"></g>
        <g class="cape-marks cm-stars">${CAPE_MARKS.stars}</g>
        <g class="cape-marks cm-stripes">${CAPE_MARKS.stripes}</g>
        <g class="cape-marks cm-eagle">${CAPE_MARKS.eagle}</g>
        <g class="cape-marks cm-skull">${CAPE_MARKS.skull}</g>
      </g>
      <path class="pcline" d="M -32 -180 C -46 -166, -56 -150, -61 -134" fill="none" stroke-width="2"/>
      <path class="pcline" d="M 32 -180 C 46 -166, 56 -150, 61 -134" fill="none" stroke-width="2"/>
    </g>

    <!-- ================= 腿 ================= -->
    <g id="legs" pointer-events="none">
      <g id="leg-l">
        <path class="pb" d="M -29 -104 L -27 -50 L -28 -34 L -8 -34 L -7 -50 L -8 -104 Z"/>
        <path class="plg" d="M -27 -100 L -25 -56 L -10 -56 L -11 -100 Z"/>
        <!-- 膝甲 -->
        <path class="pknee" d="M -28 -50 L -8 -50 L -9 -34 L -29 -34 Z"/>
        <path class="pb" d="M -28 -34 L -9 -34 L -9 -10 L -29 -10 Z"/>
        <path class="psole" d="M -30 -10 L -7 -10 L -7 0 L -34 0 Z"/>
      </g>
      <g id="leg-r">
        <path class="pb" d="M 8 -104 L 7 -50 L 8 -34 L 29 -34 L 27 -50 L 29 -104 Z"/>
        <path class="plg" d="M 11 -100 L 10 -56 L 25 -56 L 27 -100 Z"/>
        <path class="pknee" d="M 8 -50 L 28 -50 L 29 -34 L 8 -34 Z"/>
        <path class="pb" d="M 8 -34 L 29 -34 L 28 -10 L 9 -10 Z"/>
        <path class="psole" d="M 7 -10 L 30 -10 L 34 0 L 6 0 Z"/>
      </g>
    </g>

    <!-- ================= 裙甲（腰带下方那块带亮黄描边的） ================= -->
    <g pointer-events="none">
      <path class="pskirt" d="M -33 -108 L 33 -108 L 39 -80 Q 0 -74, -39 -80 Z"/>
      <path class="ptl" d="M -33 -106 L -38 -80 Q 0 -74, 38 -80 L 33 -106" stroke-width="2.6" opacity="0.95"/>
      <path class="ptl" d="M 0 -104 L 0 -76" stroke-width="2.4" opacity="0.95"/>
    </g>

    <!-- ================= 身体 ================= -->
    <g class="part-body">

      <g class="torso">
        <!-- 躯干主体 -->
        <path class="pa" d="M -34 -178 Q -42 -164, -40 -148 L -36 -126 Q -34 -116, -23 -114
                             L 23 -114 Q 34 -116, 36 -126 L 40 -148 Q 42 -164, 34 -178 Z"/>
        <!-- 上胸抬高片 -->
        <path class="pb" d="M -30 -174 Q 0 -181, 30 -174 L 28 -158 Q 0 -152, -28 -158 Z"/>
        <!-- 胸甲下沿 -->
        <path class="pc" d="M -38 -146 L 38 -146 L 37 -134 Q 0 -128, -37 -134 Z"/>

        <!-- 胸口黄色斜带：从肩部向内下收成 V（原版最显眼的特征） -->
        <path class="pt" d="M -37 -170 L -32 -168 L -16 -150 L -22 -147 Z"/>
        <path class="pt" d="M 37 -170 L 32 -168 L 16 -150 L 22 -147 Z"/>
        <!-- 横向黄带 -->
        <path class="pt" d="M -32 -152 L 32 -152 L 31 -146 L -31 -146 Z"/>
        <!-- 横带正中的金属扣具 -->
        <rect class="pbb" x="-5" y="-153" width="10" height="8" rx="1.5"/>

        <!-- 飞行员翼章 -->
        ${wingBadge(0, -163, 0.58, 'peagle')}

        <!-- 肩甲 -->
        <path class="pa" d="M -58 -164 Q -61 -184, -45 -190 Q -30 -194, -27 -180
                             Q -26 -164, -37 -156 Q -53 -150, -58 -164 Z"/>
        <path class="pa" d="M 58 -164 Q 61 -184, 45 -190 Q 30 -194, 27 -180
                           Q 26 -164, 37 -156 Q 53 -150, 58 -164 Z"/>
        <path class="ptl" d="M -54 -176 Q -48 -187, -34 -188" stroke-width="2.6" stroke-linecap="round"/>
        <path class="ptl" d="M 54 -176 Q 48 -187, 34 -188" stroke-width="2.6" stroke-linecap="round"/>
        <!-- 肩外侧的黄色斜条（原版是顺着肩线走的一道，不是色块） -->
        <path class="pt" d="M -56 -178 L -50 -181 L -38 -170 L -44 -167 Z"/>
        <path class="pt" d="M 56 -178 L 50 -181 L 38 -170 L 44 -167 Z"/>
        ${skull(-40, -176, 0.5, 'pt')}
        ${skull(40, -176, 0.5, 'pt')}

        <!-- 腰带 -->
        <path class="pc" d="M -35 -118 L 35 -118 L 34 -104 Q 0 -99, -34 -104 Z"/>
        <rect class="pb" x="-32" y="-116" width="14" height="13" rx="2.5"/>
        <rect class="pb" x="18" y="-116" width="14" height="13" rx="2.5"/>
        <rect class="pbb" x="-6" y="-118" width="13" height="15" rx="2.5"/>
        ${skull(0, -110, 0.5, 'pt')}
      </g>

      <!-- 敬礼臂：两段式骨骼，锚点在肩 -->
      <g transform="translate(-38 -176)">
        <g class="upper">
          <path class="pc" d="M 0 0 L -2 26" fill="none" stroke-width="19" stroke-linecap="round"/>
          <path class="pah" d="M 0 0 L -2 26" fill="none" stroke-width="5" stroke-linecap="round" opacity="0.4"/>
          <path class="ptarm" d="M -9 -8 L 2 -12" stroke-width="6" stroke-linecap="round" opacity="0.95"/>
          <g transform="translate(-2 26)">
            <g class="forearm">
              <path class="pc" d="M 0 0 L 1 24" fill="none" stroke-width="15" stroke-linecap="round"/>
              <path class="pah" d="M 0 0 L 1 24" fill="none" stroke-width="4.5" stroke-linecap="round" opacity="0.4"/>
              <circle class="ph" cx="2" cy="29" r="9"/>
              <circle class="phs" cx="2" cy="29" r="9" fill="none" stroke-width="1.4"/>
              <path class="ptl" d="M -3 25 L 7 25" stroke-width="2.2" stroke-linecap="round" opacity="0.8"/>
            </g>
          </g>
        </g>
      </g>
    </g>

    <!-- ================= 武器 =================
         六款共用一个挂点，靠 CSS 显示当前选中的那一款 -->
    <g transform="translate(40 -138) rotate(-30) scale(0.72)" pointer-events="none">
      ${Object.keys(WEAPONS)
        .map((k) => `<g id="gun-${k}" class="wep wep-${k}">${WEAPONS[k]}</g>`)
        .join('\n      ')}
    </g>

    <!-- 持枪臂：画在枪之后，手才像是握着枪 -->
    <g transform="translate(38 -176)">
      <g id="arm-gun">
        <path class="pc" d="M 0 0 L 5 26 L -11 44" fill="none" stroke-width="19"
              stroke-linecap="round" stroke-linejoin="round"/>
        <path class="pah" d="M 0 0 L 5 26 L -11 44" fill="none" stroke-width="5"
              stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
        <path class="ptarm" d="M -1 -8 L 10 -12" stroke-width="6" stroke-linecap="round" opacity="0.95"/>
        <circle class="ph" cx="-12" cy="48" r="9"/>
        <circle class="phs" cx="-12" cy="48" r="9" fill="none" stroke-width="1.4"/>
        <path class="ptl" d="M -17 44 L -7 44" stroke-width="2.2" stroke-linecap="round" opacity="0.8"/>
      </g>
    </g>

    <!-- ================= 头盔 ================= -->
    <g id="head" class="part-head">
      <!-- 颈圈 -->
      <path class="pcollar" d="M -22 -192 L 22 -192 L 20 -182 L -20 -182 Z"/>

      <!-- 盔壳 -->
      <path class="pshell" d="M -38 -232 Q -40 -256, 0 -257 Q 40 -256, 38 -232
                              L 36 -206 Q 35 -188, 24 -186 L -24 -186 Q -35 -188, -36 -206 Z"/>
      <!-- 中央脊线 -->
      <path class="pshell2" d="M -5 -255 L 5 -255 L 6 -234 L -6 -234 Z" opacity="0.45"/>

      <!-- 头盔顶部那条很宽的亮黄横带 -->
      <g clip-path="url(#helmetClip)">
        <rect class="pstripe stripe1" x="-42" y="-257" width="84" height="22"/>
      </g>
      <rect class="pstripe stripe1" x="-42" y="-257" width="84" height="22" opacity="0"/>

      <!-- 眉沿 -->
      <path class="pshell2" d="M -35 -234 Q 0 -240, 35 -234 L 34 -227 Q 0 -233, -34 -227 Z" opacity="0.7"/>

      <!-- 镜面银色面罩：底边是带 V 形缺口的锐角折线 -->
      <path class="pv" d="M -34 -231 Q 0 -236, 34 -231 L 33 -210 L 25 -204 L 17 -210
                          L 0 -207 L -17 -210 L -25 -204 L -33 -210 Z"/>
      <!-- 镜面高光：视线跟随时跟着头的转动在面罩内滑动（镜面反光） -->
      <g clip-path="url(#visorClip)">
        <path class="pgloss" d="M -25 -229 Q -14 -232, -6 -231 L -15 -208 L -26 -209 Z" opacity="0.5"/>
      </g>

      <!-- 防毒面具版面罩（CE-74 Breaker 用：圆护目镜 + 滤罐） -->
      <g class="alt-face" pointer-events="none">
        <path class="pbreath" d="M -30 -218 Q 0 -212, 30 -218 L 27 -192 Q 0 -184, -27 -192 Z"/>
        <circle class="pmask" cx="-15" cy="-207" r="9.5"/>
        <circle class="pmask" cx="15" cy="-207" r="9.5"/>
        <circle class="pmaskin" cx="-15" cy="-207" r="6"/>
        <circle class="pmaskin" cx="15" cy="-207" r="6"/>
        <path class="pbreath2" d="M -7 -213 L 7 -213 L 6 -199 L -6 -199 Z"/>
        <rect class="pmask" x="-4.5" y="-197" width="9" height="10" rx="2"/>
      </g>

      <!-- 呼吸罩主体 -->
      <path class="pbreath" d="M -33 -208 L 33 -208 L 30 -192 Q 20 -186, 0 -186
                               Q -20 -186, -30 -192 Z"/>
      <!-- 中央凸起 -->
      <path class="pbreath2" d="M -7 -204 L 7 -204 L 6 -190 L -6 -190 Z"/>
      <!-- 两侧银白格栅（黄色框） -->
      ${louver(-17, -197, 'pt', 'pvl')}
      ${louver(17, -197, 'pt', 'pvl')}

      <!-- 侧面：骷髅徽记 + 机械阀 -->
      ${skull(-29, -226, 0.5, 'pt')}
      <g class="pvalve">
        <rect class="phs" x="26" y="-232" width="12" height="10" rx="2" fill="none" stroke-width="1.6"/>
        <rect class="ph" x="29" y="-230" width="6" height="6" rx="1"/>
      </g>
    </g>

  </g>
  </g>
</svg>
`;
