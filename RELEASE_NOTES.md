# v0.4.0-beta.1 · 三渲二 / 硬表面渲染优化

一只常驻 Windows 桌面的绝地潜兵。透明置顶、不抢焦点，只有身上那点像素接收鼠标，
其余区域全部穿透 —— 不会挡住你干活。

> 这一版专门解决「人物模型和游戏实际差距很大」的问题。做法是先把**原作真正的
> 画风**搞清楚，再照着改，而不是凭感觉加滤镜。

## 下载

| 文件 | 说明 |
| --- | --- |
| `HelldiverPet-0.4.0-beta.1-portable.exe` | **免安装版**，双击即用，推荐先试这个 |
| `HelldiverPet Setup 0.4.0-beta.1.exe` | 安装版，装完有桌面快捷方式 |

x64 免配置，不需要额外装 Node 或 Electron。Windows 首次运行可能弹 SmartScreen，
选「仍要运行」即可（未做代码签名）。

## 调研：网上的 Helldiver 模型生态

在 Google 搜 `helldiver model for blender`，能找到的东西比想象的多：

| 来源 | 内容 |
| --- | --- |
| **Sketchfab** | 一整个 `helldivers` 标签页，社区做的 3D 模型，包括一个 **rigged（带骨骼）** 的免费版，标签是 `blender · lowpoly · free` |
| **YouTube** | `How to Make Helldivers 2 Art in Blender (Beginner's Guide)`（Pickleaxe）、`How To Create a Helldivers 2 Render`（Yisen Cinema）、`Helldivers 2 Modding for Beginners`（Primortem，15 分钟） |
| **Nexus Mods** | `Helldivers 2 Modding Tool for Blender 4.0` —— 直接改游戏存档里的**贴图、网格、材质** |
| **Meshy / CGTrader** | 140+ 个 3D 模型，STL/GLB/FBX/OBJ 格式 |
| **Reddit r/Helldivers** | 「 Anyone know how to access the 3D models?」100+ 评论，多在讨论怎么从游戏文件里提取模型 |

### 但我没有用那些模型

不是不想用，是**不能用**：那些模型都是从商业游戏里提取或移植的著作权作品，
直接打包进程序分发是侵权。而且这个项目从第一版就承诺过
**「项目内不含任何游戏原始素材」** —— 形象是手写 SVG。

所以路线是：**用这些资源当参考，搞清楚原作的画法和结构语言，然后用自己的手绘实现。**

## 关键判断：Helldivers 2 本身就不是描边漫画风

这是这一版最重要的一个发现。看官方渲染图和 Sketchfab 上的白模可以确认，
**原作是硬表面（hard-surface）风格**：

- 板件之间靠**黑色缝隙**分隔，不是靠颜色渐变过渡
- 棱线（倒角）上有**硬边高光** —— Sketchfab 上那把游戏武器的顶面棱线就是一条
  干脆的亮线，不是柔和的渐变
- 整体是**棱角分明的机械感**，不是圆润的卡通体块

所以「全身描一圈墨线」那种漫画三渲二，放在这个角色身上**是错的** —— 深色装甲上
的深色墨线根本看不见，画了等于没画。

采用的方案是原作自己的语言：

### 1. 硬边色阶

所有材质渐变从「平滑过渡」改成**两两同偏移的色带**：
同一个 offset 上放两个 stop，颜色直接跳变，不做过渡。
每个材质现在是**亮 / 中 / 暗三段硬边**，光源方向（左上）一望即知。

```xml
<linearGradient id="gCoat" x1="0.12" y1="0" x2="0.88" y2="1">
  <stop offset="0"    stop-color="…"/>   <!-- 亮 -->
  <stop offset="0.40" stop-color="…"/>   <!-- 亮（同一偏移 → 硬边） -->
  <stop offset="0.40" stop-color="…"/>   <!-- 中 -->
  <stop offset="0.76" stop-color="…"/>   <!-- 中 -->
  <stop offset="0.76" stop-color="…"/>   <!-- 暗 -->
  <stop offset="1"    stop-color="…"/>   <!-- 暗 -->
</linearGradient>
```

### 2. 硬边高光

沿着受光面的棱线单独画一条亮线，位置跟着主光走：
盔顶左上弧、肩甲顶棱、风衣左缘、护膝圆顶、胫甲外棱、靴子上沿。

护膝那圈亮弧最出彩 —— 原作的护膝是**亮面圆顶**，一条硬高光一下就把体积感做出来了。

### 3. 墨线只用在刀刃上

只给「和浅色相邻」的部件描边（黄色涂装、金属护片、枪械），
深色主体靠色块边界和硬高光去分隔。这样才不会出现「全身黑成一坨」。

### 4. 披风收窄

之前披风下摆摊到小腿高度、两侧张得很开，把整个下半身都盖住了。
按官方正面图，披风只垂在身侧一条 —— 收窄到 ±41，下摆收到膝盖附近。

## 沿用上一版

**10 款装甲皮肤**、**6 把武器**、视线跟随 / 抛掷物理 / 士气系统 /
屏幕边缘探头 / 专注计时，以及 160+ 条中英双语台词。

## 已知问题

- 造型细节仍在打磨，和官方渲染图还有差距，欢迎截图拍砖
- 未做代码签名，Windows SmartScreen 可能拦截
- 只在 Windows x64 上验证过

## 反馈

开 issue 时最好附上：Windows 版本、显卡型号、复现步骤。
外观问题直接丢截图最有效。

---

本项目为非官方的第三方开源作品，与 Arrowhead Game Studios / Sony Interactive
Entertainment 无关。《绝地潜兵 2》及相关商标归其权利人所有。MIT License。
