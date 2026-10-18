;(function (XH) {
  // 14 个玩法配置：type 对应 XH.Mech 逻辑核，hint 为玩法提示（史实文案，不编造数字）
  XH.MG_CONFIGS = {
    // n01 于都夜渡：搭浮桥（敌机间隙铺门板）
    mg01: { type: 'timing', hint: '敌机掠过的间隙里铺上门板！', guide: '敌机掠过、窗口点亮的瞬间，点击画面 / 按回车铺上门板',
      windows: [{ start: 2, end: 3.2 }, { start: 5, end: 6.2 }, { start: 8, end: 9.2 }] },

    // n02 突破封锁线：穿插突围（巡逻队交接缺口）
    mg02: { type: 'timing', hint: '抓住巡逻队交接的缺口穿过封锁线！', guide: '缺口出现的瞬间，点击画面 / 按回车穿过封锁线',
      windows: [{ start: 1.5, end: 2.4 }, { start: 4.4, end: 5.3 }, { start: 7.4, end: 8.3 }, { start: 10.4, end: 11.3 }] },

    // n03 湘江战役：殿后死守（红34师）
    mg03: { type: 'defend', hint: '红34师殿后——守住每一波冲锋！', guide: '按 ↑→↓← 方向键拦截冲锋；触屏/鼠标直接点击来敌（点在敌人身上即可拦住）', waves: 6, gap: 2.5, hitLoss: 800 },

    // n04 通道转兵：转兵决策
    mg04: { type: 'trust', hint: '危急关头，每一次决断都在校准航向！', guide: '点击左 / 右两张选项卡，做出你的决断', rounds: [
      { prompt: '湘江之后，往哪里走？', positive: '转兵贵州，避敌锋芒', negative: '坚持北上湘西',
        explain: '通道会议力主转兵敌人力量薄弱的贵州，避开了重兵预设的口袋。' },
      { prompt: '面对坚固设防城市', positive: '避实击虚，运动歼敌', negative: '强行攻坚',
        explain: '不打硬碰硬的消耗战，在运动中调动敌人、创造战机。' },
      { prompt: '敌军重兵压境', positive: '主动调动敌人，创造战机', negative: '被动分兵抵抗',
        explain: '灵活机动方能变被动为主动，分兵死守只会陷入合围。' },
    ] },

    // n05 遵义会议：拨正航向（纠正三种错误倾向）
    mg05: { type: 'trust', hint: '拨正航向——纠正军事指挥上的错误倾向！', guide: '点击左 / 右两张选项卡，纠正错误倾向', rounds: [
      { prompt: '如何对待进攻中的冒险主义？', positive: '纠正这一错误倾向', negative: '继续沿用',
        explain: '遵义会议集中全力纠正军事上的错误路线，结束了冒险主义的指挥。' },
      { prompt: '如何对待防御中的保守主义？', positive: '纠正这一错误倾向', negative: '继续沿用',
        explain: '遵义会议结束了"左"倾教条主义军事路线，找回机动灵活的战法。' },
      { prompt: '如何对待退却中的逃跑主义？', positive: '纠正这一错误倾向', negative: '继续沿用',
        explain: '遵义会议确立了正确的军事指挥，红军从此化被动为主动。' },
    ] },

    // n06 四渡赤水：声东击西（4 轮渡口抉择，每轮 2 个设防点）
    mg06: { type: 'route', hint: '四渡赤水——选出敌军想不到的渡口！', guide: '点击下方渡口热区（从左到右四段），避开有敌军设防的渡口',
      guards: [[0, 1], [1, 2], [2, 3], [0, 3]] },

    // n07 巧渡金沙江：摆渡调度（三十七名船工人歇船不歇）
    mg07: { type: 'allocate', hint: '37 名船工人歇船不歇，排好三班！', guide: '点 ＋／－ 为各班分配船工，点「确认分配」结算', pool: 12, timeLimit: 30,
      slots: [{ id: 'early', min: 2, label: '凌晨班' }, { id: 'day', min: 4, label: '白班' }, { id: 'night', min: 3, label: '夜班' }] },

    // n08 彝海结盟：以诚相待（彝区习俗抉择）
    mg08: { type: 'trust', hint: '以诚相待——尊重彝胞，团结过境！', guide: '点击左 / 右两张选项卡，以诚相待赢得信任', rounds: [
      { prompt: '彝家有自己的风俗禁忌，队伍该如何行事？', positive: '尊重彝家风俗，入乡随俗', negative: '各行其是，不予理会',
        explain: '尊重民族习俗，是红军民族政策赢得人心的第一步。' },
      { prompt: '向彝胞借用物品之后呢？', positive: '如数归还，买卖公平', negative: '军情紧急，暂缓归还',
        explain: '红军借物必还、买卖公平，用行动赢得彝胞信任。' },
      { prompt: '个别战士与彝胞发生摩擦时？', positive: '严明纪律，绝不打骂群众', negative: '听之任之，不加过问',
        explain: '铁的纪律是红军的立身之本，损害群众利益必严肃纠正。' },
      { prompt: '彝海之滨，首领小叶丹提议结盟？', positive: '真诚相待，歃血为盟', negative: '婉言推脱，口头敷衍',
        explain: '刘伯承与果基小叶丹彝海结盟，红军顺利通过彝区。' },
    ] },

    // n09 强渡大渡河：浪尖冲锋（躲漩涡与弹雨）
    mg09: { type: 'dodge', hint: '躲开漩涡与弹雨，把勇士送上对岸！', guide: '点击左 / 中 / 右变道或按 ←→ 键，躲开漩涡与弹雨', hazardCount: 25, duration: 60 },

    // n10 飞夺泸定桥：昼夜奔袭（240 里昼夜兼程）
    mg10: { type: 'rhythm', hint: '240 里昼夜兼程——跟上鼓点！', guide: '鼓点落到底的瞬间，点击画面 / 按回车踏准节奏', tol: 0.12,
      beats: Array.from({ length: 20 }, (_, i) => 0.8 + i * 0.6) },

    // n11 翻越夹金山：翻山（风雪中稳住队形）
    mg11: { type: 'rhythm', hint: '风雪扑面——按节奏稳住队形！', guide: '节拍落到底的瞬间，点击画面 / 按回车稳住队形', tol: 0.10,
      beats: Array.from({ length: 24 }, (_, i) => 0.8 + i * 0.5) },

    // n12 过草地：草地行军（干粮分配，伤员优先）
    mg12: { type: 'allocate', hint: '干粮不多——伤员优先，官兵一致！', guide: '点 ＋／－ 分配干粮（伤员优先），点「确认分配」结算', pool: 10, timeLimit: 25,
      slots: [{ id: 'wounded', min: 1, label: '伤员' }, { id: 'fight', min: 2, label: '战斗员' },
        { id: 'cooks', min: 2, label: '炊事班' }, { id: 'backup', min: 1, label: '预备队' }] },

    // n13 激战腊子口：攀崖奇兵（正面佯攻 + 侧后攀爬双线）
    mg13: { type: 'dual', hint: '正面佯攻不能停，侧后攀崖要抓紧！（←佯攻 →攀爬）', guide: '按 ← / 点左半屏佯攻，按 → / 点右半屏攀爬，两手交替不断', },

    // n14 三军会师：大会师（三面红旗汇聚）
    mg14: { type: 'finale', hint: '按住确认键，让三面红旗汇聚！', guide: '按住回车 / 按住画面不放，让三面红旗汇聚' },
  };
})(globalThis.XH = globalThis.XH || {});
