/**
 * 绝地潜兵2 台词库 + 战略配备码
 *
 * 说明：台词为致敬原作的玩家社区熟语（游戏里的 Democracy Officer / Major
 * 常见语录），程序内不含任何游戏原始素材或音频。
 * 皮肤名取自 Helldivers Wiki 上的装甲套装代号。
 */

(function () {
  const QUOTES = {
    cn: [
      // 经典
      '为了民主而战！',
      '民主没有保证。',
      '管理要求解除武装。',
      '我很抱歉，但我不能同意。',
      '这里是绝地潜兵！',
      '爱国卫生！',
      '我们爱这片土地！',
      '我们会想念你的，伙计。',
      '等一下，你们要干什么？',
      '我会让这颗星球爱上你们。',
      '战略配备已抵达！',
      '呼叫轨道炮击！',
      '前指挥官说你太软弱了。',
      'Sobel 想要你的星球。',
      '欢迎来到民主的沃土！',
      '你被开除了，混蛋。',
      '我他妈爱死这些任务了！',
      '撑住，撑住！',
      '民主需要你，兄弟。',
      '别忘了：自由不会白白赐予。',
      '任务简报完毕，准备开干。',
      '为了地球！',
      '我们是管理民主的最后一道防线。',
      '把每一发子弹都当成爱国行为。',
      '服务器已停机，但你还得继续战斗。',
      // 新增：任务 / 战斗
      '任务开始，全员压上！',
      '接触点已确认，Democracy 生效！',
      '目标就在前面，别踩到地雷！',
      '友军误伤是民主的一部分。',
      '记住：今天你流的血，换来明天的选票。',
      '敌方火力很猛，但这不影响我们赢。',
      '弹药还够，士气更足。',
      '向前推进，别停下来数尸体。',
      '来都来了，打完再说。',
      '我这条命是民主借的，今天还回去。',
      '把这个星球的每一个坑都填上！',
      '空气里全是硫磺味，这才叫自由。',
      '死了不要紧，尸体也能投票。',
      '我们要在这里建纪念碑。',
      // 新增：系统 / 日常
      '今天也在为地球站岗。',
      '民主办公室提醒你：按时下班。',
      '你的民主权利包括被强制服役。',
      '评级提升了，谢谢你的牺牲。',
      '被开除了也别忘了投我一票。',
      '食堂的合成蛋白又涨价了。',
      '我想回家，但家在三十七光年外。',
      '今天目标：活着回来。',
      '星图更新了，又多了个要炸的地方。',
    ],
    en: [
      'For democracy!',
      'Democracy is not guaranteed.',
      'Management has requested you relinquish your arms.',
      "I'm sorry, I can't agree.",
      'This is a Helldiver!',
      'HEHEHEHEHE',
      'Patriotic sanitation!',
      'We will miss you, brother.',
      'Stratagem incoming.',
      'LIBERTY OR DEATH!',
      'Orbital barrage, ready!',
      'Sobel wants your planet.',
      'Welcome to Managed Democracy!',
      'You are being fired, maggot.',
      'Hold the line, soldier!',
      'Freedom is not given, it is taken.',
      'For Earth!',
      'Live, laugh, kill, repeat.',
      'Mission start, all units push!',
      'Contact confirmed. Democracy is live!',
      'Friendly fire is part of the process.',
      'Every bullet is an act of patriotism.',
      'The servers are down. You keep fighting.',
      'One day your blood buys tomorrow a ballot.',
      'Rating increased. Thank you for your service.',
      'You are dismissed. Please still vote.',
      'Aim for the head. Or whatever democracy allows.',
      'I would love to see your starship, but we are busy.',
      'When in doubt, stratagem.',
      'Stand up, sit down, repeat.',
    ],
    head: [
      '长官好！',
      '收到，长官！',
      '头盔很合身，谢谢！',
      '民主在我这一边！',
      '我准备好了！',
      '面罩显示一切正常！',
      '您呼叫的是绝地潜兵！',
      '长官，今天也要把我扔进地狱吗？',
      '需要我把这儿炸平吗？',
      'Sir yes, sir!',
      'Reporting in!',
      'My visor says hi.',
      'Ready to spread democracy!',
    ],
    drag: [
      '哇——！',
      '放我下来！',
      '我能飞——',
      '我恐高！',
      '哇哦哇哦哇哦！',
      '轻点轻点！',
      'Whoa whoa whoa!',
      'Put me down!',
      'I can fly, actually.',
      'I hate heights!',
    ],
    tired: [
      '我需要点提神剂……',
      '背包好重，脚好酸。',
      '什么时候能回舰上……',
      '想我老婆了（她不存在）。',
      'I need a stim.',
      'These legs are regulation, and so is this pain.',
      'Thinking about the good old days on the ship.',
    ],
    promoted: [
      '晋升了！谢谢大家！',
      '我不会辜负这份信任的！',
      '现在我也能让别人开除了。',
      'Promotion! I accept this sacred duty.',
      'More power, more responsibility.',
      'I will not let democracy down!',
    ],
    // 新增：被抛掷 / 落地
    thrown: [
      '哇啊啊啊——！',
      '我这是要飞了？！',
      '这就是自由的感觉？',
      '投得好！再扔一次！',
      'Wheee—!',
      'Did you just throw me?',
      'This is the freest I have ever been.',
    ],
    land: [
      '着地！姿势很帅吧？',
      '哎哟……',
      '完美着陆，民主万岁。',
      '下次轻点。',
      'Nailed it.',
      'Oof. Still democratic.',
      'Landing is falling with extra steps.',
    ],
    // 新增：士气低 / 士气高
    grumpy: [
      '没人理我……',
      '我已经站很久了。',
      '能不能摸摸我？',
      '无聊……我快生锈了。',
      'Democracy is great, but I am lonely.',
      'Is anyone there?',
      'Standing by... for someone.',
    ],
    happy: [
      '状态绝佳！随时可以出发！',
      '今天心情好，能多扔几发吗？',
      '我 爱 这 个 星 球！',
      'Peak performance. Deploy me.',
      'Let us do this all day.',
    ],
    // 新增：探头 / 视线 / 专注
    peek: [
      '嘿，我在这儿呢。',
      '偷看中……',
      '别往那边看，我在这儿。',
      'Peeking. Professional surveillance.',
      'I am watching. Always.',
    ],
    gaze: [
      '……你一直看着我？',
      '别盯着我看，我会害羞的。',
      '在盯着你呢，长官。',
      'I see you staring.',
      'Eyes on the prize, soldier.',
    ],
    focus: [
      '计时开始，别想偷懒。',
      '专注模式启动，我会盯着你的。',
      '这段时间，你属于民主。',
      'Focus timer engaged. I will be watching.',
      'Do not squander the hours.',
    ],
    focusDone: [
      '时间到！干得漂亮。',
      '专注结束，休息一下。',
      '你撑住了，兄弟。',
      'Time is up. Nicely done.',
      'That is how democracy gets done.',
      'Break time. Hydrate.',
    ],
  };

  /** 战略配备：真实投送码 + 名称 */
  const STRATAGEMS = [
    { code: 'UUDDLRLR', name: '轨道炮击' },
    { code: 'UUDDLRLD', name: '轨道集束火力' },
    { code: 'UUFFRUD', name: '轨道激光' },
    { code: 'UEDFUD', name: '隐形' },
    { code: 'UAAAF', name: '空投补给' },
    { code: 'DDFLUD', name: '反坦克' },
    { code: 'RLEFT', name: '守卫' },
    { code: 'FURLEP', name: '医疗' },
    { code: 'RIGHT', name: '电磁干扰' },
    { code: 'ARAC', name: '反装甲' },
    { code: 'FAPR', name: '突击步枪小队' },
    { code: 'AEXLOC', name: '自动化炮塔' },
    { code: 'AFA', name: '轨道炮台' },
    { code: 'AUSC', name: '无人机群' },
  ];

  /** 方向键字符 -> 展示用符号 */
  const KEYMAP = { U: '↑', D: '↓', L: '←', R: '→' };

  /** 皮肤清单（名字 / 副标题取自 Helldivers Wiki 的装甲代号） */
  const SKINS = [
    { id: 'b01', name: 'B-01 战术型', sub: '默认中甲 · 黑壳双黄条' },
    { id: 'b22', name: 'B-22 模范公民', sub: '全黑金属 · 银描边' },
    { id: 'sc34', name: 'SC-34 渗透者', sub: '轻甲 · 卡其土黄' },
    { id: 'fs23', name: 'FS-23 战斗大师', sub: '重甲 · 墨绿厚重' },
    { id: 'a35', name: 'A-35 侦察兵', sub: 'ODST 联动 · 暗橄榄绿' },
    { id: 'tr117', name: 'TR-117 阿尔法指挥官', sub: '致敬彩蛋 · 经典绿甲' },
    { id: 'ce74', name: 'CE-74 破拆者', sub: '轻甲 · 卡其+绯红 · 防毒面具' },
    { id: 'cw22', name: 'CW-22 科迪亚克', sub: '重甲 · 深灰 · 红目镜' },
    { id: 'cw4', name: 'CW-4 极地游侠', sub: '轻甲 · 海军蓝+橙' },
    { id: 'cw9', name: 'CW-9 白狼', sub: '中甲 · 米白+红描边' },
  ];

  /** 武器清单（代号取自游戏内 / Helldivers Wiki） */
  const WEAPONS = [
    { id: 'rifle', name: '标准步枪', sub: '默认 · 通用配置' },
    { id: 'mg43', name: 'MG-43 通用机枪', sub: '直筒 + 直线弹匣' },
    { id: 'gr8', name: 'GR-8 无后坐力炮', sub: '厚机身 · 短粗炮管' },
    { id: 'flam40', name: 'FLAM-40 火焰喷射器', sub: '细长喷管 + 燃料罐' },
    { id: 'gl21', name: 'GL-21 榴弹发射器', sub: '短粗炮管 · 弹鼓' },
    { id: 'apw1', name: 'APW-1 反器材步枪', sub: '超长枪管 · 两脚架' },
  ];

  /** 随机取一条，避免连续重复 */
  function pickQuote(pool, lastText) {
    if (!pool || !pool.length) return '';
    let q = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && q === lastText) q = pool[(pool.indexOf(q) + 1) % pool.length];
    return q;
  }

  function pickStratagem(lastCode) {
    let s = STRATAGEMS[Math.floor(Math.random() * STRATAGEMS.length)];
    if (STRATAGEMS.length > 1 && s.code === lastCode) {
      s = STRATAGEMS[(STRATAGEMS.indexOf(s) + 1) % STRATAGEMS.length];
    }
    return s;
  }

  window.HD2 = { QUOTES, STRATAGEMS, KEYMAP, SKINS, WEAPONS, pickQuote, pickStratagem };
})();
