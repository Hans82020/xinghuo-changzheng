;(function (XH) {
  const O = (label, effects, explain, correct) => ({ label, effects, explain, correct: !!correct });
  XH.NODES = [
    { id:'n01', name:'于都夜渡', date:'1934.10.16', theme:'jiangnan', pos:[283,150],
      story:[
        '第五次反"围剿"失利后，中央红军被迫实行战略转移，八万六千余人在于都河畔集结，踏上漫漫长征路。',
        '为了让红军顺利渡河，三十万于都人民齐心协力保守出渡秘密，拆门板、捐寿材，连夜架设浮桥。'],
      emotion:{ title:'一河门板', text:'百姓拆门板、捐寿材搭浮桥，一河门板托起红军的希望，也托起军民鱼水情深的信任。', tag:'史实' },
      choice:{ prompt:'渡河在即，如何安排过河时机？', options:[
        O('严格灯火管制，夜间隐蔽急渡', {troops:0,supply:0,morale:4,faith:0}, '夜色掩护下安全渡河，保存了实力', true),
        O('白天大张旗鼓列队渡河', {troops:-2000,supply:0,morale:-6,faith:0}, '暴露目标遭敌机空袭，损失惨重') ] },
      quiz:'n01', mg:'mg01',
      entry:{troops:86000, supply:100, morale:80, faith:50},
      mgReward:{troops:500, supply:0, morale:8, faith:0},
      noteCard:{ title:'于都夜渡', facts:['1934年10月16日，中央红军八万六千余人渡过于都河','三十万于都人民保守出渡秘密，拆门板捐寿材搭浮桥'], story:'于都河上的浮桥由百姓捐献的门板与寿材搭成，红军夜间渡河，悄无声息地踏上长征之路。' } },

    { id:'n02', name:'突破封锁线', date:'1934.10~11', theme:'mountain', pos:[255,158],
      story:[
        '红军连续突破国民党军三道封锁线，向湘西方向挺进，一路宣传群众、播撒革命火种。',
        '在湖南汝城沙洲村，三名女红军借宿徐解秀家，临行前剪下自己仅有的半条被子留给老人。'],
      emotion:{ title:'半条被子', text:'三名女红军剪被留徐解秀，"自己有一条被子，也要剪下半条给老百姓"，半条被子温暖了一代人。', tag:'史实' },
      choice:{ prompt:'部队行至村寨，如何安排宿营？', options:[
        O('露宿屋檐下，绝不扰民', {troops:0,supply:0,morale:0,faith:8}, '严守纪律，赢得群众真心拥护', true),
        O('征用民房生火取暖', {troops:0,supply:0,morale:0,faith:-8}, '惊扰百姓，损害军民关系') ] },
      quiz:'n02', mg:'mg02',
      entry:{troops:86000, supply:95, morale:78, faith:50},
      mgReward:{troops:0, supply:0, morale:0, faith:10},
      noteCard:{ title:'半条被子', facts:['红军连破三道封锁线向湘西挺进','三名女红军剪半条被子留给徐解秀老人'], story:'"半条被子"的故事流传至今，它道出了共产党人与人民群众同甘共苦、生死相依的本色。' } },

    { id:'n03', name:'湘江战役', date:'1934.11.25~12.1', theme:'mountain', pos:[226,148],
      story:[
        '湘江战役是长征中最惨烈的一战，红军八万六千余人血战后锐减至三万余人，鲜血染红了湘江水。',
        '红三十四师奉命殿后掩护主力渡江，师长陈树湘重伤被俘，绞断肠子壮烈殉职，少共国际师战士平均年仅十八岁。'],
      emotion:{ title:'断肠明志', text:'陈树湘重伤被俘，绞断肠子殉职，"为苏维埃新中国流尽最后一滴血"，以生命践行誓言。', tag:'史实' },
      choice:{ prompt:'敌重兵压境，如何掩护主力渡江？', options:[
        O('红三十四师死守殿后掩护主力', {troops:-6000,supply:0,morale:6,faith:0}, '以局部牺牲换取主力安全，士气大振', true),
        O('全军挤渡抢时间', {troops:-9000,supply:0,morale:-8,faith:0}, '秩序混乱遭敌截击，损失更为惨重') ] },
      quiz:'n03', mg:'mg03',
      entry:{troops:86000, supply:85, morale:75, faith:58},
      mgReward:{troops:800, supply:0, morale:6, faith:0},
      noteCard:{ title:'血战湘江', facts:['湘江战役红军由八万六千余人锐减至三万余人','红三十四师师长陈树湘绞断肠子壮烈殉职'], story:'"三年不饮湘江水，十年不食湘江鱼"，湘江战役的惨烈让红军深刻反思，为通道转兵埋下伏笔。' } },

    { id:'n04', name:'通道转兵', date:'1934.12', theme:'mountain', pos:[203,157],
      story:[
        '湘江战役后，若按原计划北上湘西，红军将钻入敌二十万重兵预设的口袋，后果不堪设想。',
        '通道会议上，毛泽东力主放弃北上计划，转兵敌人力量薄弱的贵州，这一转弯挽救了三万红军。'],
      emotion:{ title:'一次转弯挽救三万人', text:'通道转兵避开了敌二十万重兵口袋，一次战略方向的转弯，挽救了三万红军的命运。', tag:'史实' },
      choice:{ prompt:'面临敌重兵口袋，部队该向何处去？', options:[
        O('采纳毛泽东建议，转兵贵州', {troops:0,supply:0,morale:8,faith:0}, '避实就虚，跳出敌包围圈', true),
        O('坚持原计划北上湘西', {troops:0,supply:0,morale:-10,faith:0}, '正中敌预设口袋，全军覆没之险') ] },
      quiz:'n04', mg:'mg04',
      entry:{troops:30000, supply:70, morale:60, faith:62},
      mgReward:{troops:0, supply:0, morale:8, faith:0},
      noteCard:{ title:'通道转兵', facts:['湘江后北上湘西将陷入敌二十万重兵口袋','通道会议决定转兵贵州，挽救三万红军'], story:'通道转兵是长征战略方向的第一次重大调整，为遵义会议的召开创造了有利条件。' } },

    { id:'n05', name:'遵义会议', date:'1935.1.15~17', theme:'mountain', pos:[193,138],
      story:[
        '1935年1月15日至17日，中共中央政治局在遵义召开扩大会议，集中全力解决军事和组织问题。',
        '会议结束了"左"倾教条主义错误军事路线，确立了毛泽东在党中央和红军的领导地位，是生死攸关的转折点。'],
      emotion:{ title:'生死攸关的转折', text:'遵义小楼长夜三天，确立了毛泽东在党和红军的领导地位，是中国革命生死攸关的伟大转折。', tag:'史实' },
      choice:{ prompt:'遵义会议作出关键抉择，下一步如何指挥？', options:[
        O('结束错误军事指挥，毛泽东进入常委', {troops:0,supply:0,morale:10,faith:0}, '正确路线确立，全军重获信心', true),
        O('仍由原指挥线继续指挥', {troops:0,supply:0,morale:-8,faith:0}, '错误路线延续，红军前途堪忧') ] },
      quiz:'n05', mg:'mg05',
      entry:{troops:30000, supply:75, morale:65, faith:65},
      mgReward:{troops:0, supply:0, morale:10, faith:0},
      noteCard:{ title:'遵义会议', facts:['1935年1月15日至17日在遵义召开','确立毛泽东在党中央和红军的领导地位'], story:'遵义会议在极端危急关头挽救了党、挽救了红军、挽救了中国革命，是党的历史上生死攸关的转折点。' } },

    { id:'n06', name:'四渡赤水', date:'1935.1~3', theme:'mountain', pos:[168,146],
      story:[
        '遵义会议后，面对国民党四十万大军围追堵截，仅三万余人的红军在赤水河流域四次渡河，巧妙调动敌军。',
        '毛泽东声东击西、避实就虚，使红军在运动中摆脱重兵围剿，这是他军事生涯中的"得意之笔"。'],
      emotion:{ title:'得意之笔', text:'四渡赤水是毛泽东军事生涯的"得意之笔"，三万对四十万，灵活机动调动敌军于股掌之间。', tag:'史实' },
      choice:{ prompt:'面对十倍于己之敌，如何破局？', options:[
        O('声东击西，灵活机动', {troops:0,supply:0,morale:8,faith:0}, '调动敌军，在运动中歼敌突围', true),
        O('固守一地与敌硬拼', {troops:-3000,supply:0,morale:-6,faith:0}, '寡不敌众，陷入被动挨打') ] },
      quiz:'n06', mg:'mg06',
      entry:{troops:30000, supply:70, morale:68, faith:66},
      mgReward:{troops:300, supply:0, morale:8, faith:0},
      noteCard:{ title:'四渡赤水', facts:['红军三万余人对敌四十万大军','四渡赤水调动敌军，是毛泽东"得意之笔"'], story:'四渡赤水之战是红军长征中最精彩的军事行动，以少胜多、变被动为主动，堪称运动战典范。' } },

    { id:'n07', name:'巧渡金沙江', date:'1935.5.3~9', theme:'mountain', pos:[128,152],
      story:[
        '红军在云南皎平渡找到七只小船，依靠三十七名船工，历经九天九夜将三万大军全部渡过金沙江。',
        '船工们人歇船不歇，红军严守纪律、优待船工，"金沙水拍云崖暖"，胜利跳出数十万敌军的包围圈。'],
      emotion:{ title:'金沙水拍云崖暖', text:'皎平渡七只小船、三十七名船工，九天九夜渡过三万大军，船工人歇船不歇，军民同心。', tag:'史实' },
      choice:{ prompt:'渡江需要船工助力，如何对待他们？', options:[
        O('优待船工，轮班摆渡', {troops:0,supply:0,morale:6,faith:6}, '船工全力相助，大军顺利渡江', true),
        O('强征民船，强迫服役', {troops:0,supply:0,morale:0,faith:-6}, '失去民心，船工消极怠工') ] },
      quiz:'n07', mg:'mg07',
      entry:{troops:30000, supply:65, morale:70, faith:68},
      mgReward:{troops:0, supply:6, morale:6, faith:0},
      noteCard:{ title:'巧渡金沙江', facts:['皎平渡七只小船、三十七名船工','九天九夜将三万大军渡过金沙江'], story:'巧渡金沙江使红军跳出了数十万敌军的围追堵截，取得了战略转移中具有决定意义的胜利。' } },

    { id:'n08', name:'彝海结盟', date:'1935.5.22', theme:'mountain', pos:[117,120],
      story:[
        '红军进入彝区后，总参谋长刘伯承与彝族果基家支首领小叶丹在彝海边歃血为盟，结为兄弟。',
        '小叶丹护送红军顺利通过彝区，此后数年一直珍藏结盟红旗，1942年遇难前嘱托妻子将红旗交还红军。'],
      emotion:{ title:'彝海结盟', text:'刘伯承与小叶丹歃血为盟，小叶丹护旗数年，遇难前嘱妻将红旗交还红军，民族团结的丰碑。', tag:'史实' },
      choice:{ prompt:'进入彝区，如何处理民族关系？', options:[
        O('尊重彝俗，真诚结盟', {troops:0,supply:0,morale:0,faith:10}, '民族团结，顺利通过彝区', true),
        O('武力闯关开路', {troops:-2000,supply:0,morale:0,faith:-10}, '激化矛盾，伤亡惨重失民心') ] },
      quiz:'n08', mg:'mg08',
      entry:{troops:30000, supply:60, morale:72, faith:68},
      mgReward:{troops:0, supply:0, morale:0, faith:8},
      noteCard:{ title:'彝海结盟', facts:['刘伯承与果基小叶丹在彝海歃血为盟','小叶丹护旗数年，1942年遇难前嘱妻交还红旗'], story:'彝海结盟是党的民族政策的光辉实践，红军顺利通过彝区，为强渡大渡河赢得了宝贵时间。' } },

    { id:'n09', name:'强渡大渡河', date:'1935.5.24~25', theme:'mountain', pos:[105,103],
      story:[
        '1935年5月24日至25日，红军在安顺场发起强渡，十七勇士乘小船冒着枪林弹雨突破大渡河天险。',
        '勇士们在惊涛骇浪中奋勇向前，为红军北上打开了通道，"浪尖上的冲锋号"响彻大渡河两岸。'],
      emotion:{ title:'浪尖上的冲锋号', text:'安顺场十七勇士乘船突破大渡河天险，浪尖上的冲锋号，奏响了红军不怕牺牲的壮歌。', tag:'史实' },
      choice:{ prompt:'大渡河天险当前，如何突破？', options:[
        O('夺取安顺场船只，组织夜渡', {troops:0,supply:0,morale:6,faith:0}, '十七勇士强渡成功，打开通路', true),
        O('等后续部队造船再渡', {troops:-2500,supply:0,morale:0,faith:0}, '贻误战机，敌军赶到合围') ] },
      quiz:'n09', mg:'mg09',
      entry:{troops:30000, supply:55, morale:70, faith:76},
      mgReward:{troops:200, supply:0, morale:6, faith:0},
      noteCard:{ title:'强渡大渡河', facts:['1935年5月24日至25日安顺场强渡','十七勇士乘船突破大渡河天险'], story:'强渡大渡河成功，粉碎了蒋介石让红军成为"石达开第二"的妄想，为北上打开了通道。' } },

    { id:'n10', name:'飞夺泸定桥', date:'1935.5.28~29', theme:'mountain', pos:[95,90],
      story:[
        '红四团接到命令后，一昼夜急行军二百四十里，赶在敌援军之前到达泸定桥。',
        '二十二名勇士攀着十三根铁索，冒着对岸敌军的枪林弹雨冲向桥头，敌军惊呼"你们是飞过来的吧"。'],
      emotion:{ title:'飞夺泸定桥', text:'红四团一昼夜二百四十里，二十二勇士攀十三根铁索夺桥，勇士们大多连名字都没留下。', tag:'史实' },
      choice:{ prompt:'敌援军将至，如何夺取泸定桥？', options:[
        O('昼夜奔袭，抢在敌援之前', {troops:0,supply:0,morale:8,faith:0}, '神速奔袭，二十二勇士夺桥成功', true),
        O('休整一夜次日再进', {troops:-1500,supply:0,morale:-6,faith:0}, '敌援赶到，夺桥代价剧增') ] },
      quiz:'n10', mg:'mg10',
      entry:{troops:30000, supply:50, morale:72, faith:76},
      mgReward:{troops:200, supply:0, morale:8, faith:0},
      noteCard:{ title:'飞夺泸定桥', facts:['红四团一昼夜急行军二百四十里','二十二勇士攀十三根铁索夺桥'], story:'飞夺泸定桥是红军长征中的一场硬仗，红军以惊人的速度和勇气，再次绝处逢生。' } },

    { id:'n11', name:'翻越夹金山', date:'1935.6.12', theme:'snow', pos:[88,66],
      story:[
        '夹金山是红军长征翻越的第一座大雪山，海拔四千余米，红军战士身着单衣草鞋，顶着风雪严寒攀登。',
        '许多战士把仅有的棉衣让给战友，自己却冻僵在雪山上，化作风雪中屹立的"丰碑"。'],
      emotion:{ title:'风雪中的丰碑', text:'风雪中，把棉衣让给战友的人冻立成"丰碑"，单衣草鞋翻雪山，战友之情比山高。', tag:'经典故事' },
      choice:{ prompt:'翻越雪山，如何组织行进？', options:[
        O('结组互助，互相搀扶翻山', {troops:0,supply:0,morale:6,faith:0}, '团结互助，减少冻伤减员', true),
        O('分散快速冲坡', {troops:-800,supply:0,morale:-6,faith:0}, '体力不支掉队，冻伤增多') ] },
      quiz:'n11', mg:'mg11',
      entry:{troops:30000, supply:45, morale:70, faith:78},
      mgReward:{troops:100, supply:0, morale:6, faith:0},
      noteCard:{ title:'翻越夹金山', facts:['夹金山是红军翻越的第一座大雪山','战士单衣草鞋御严寒，互相帮助翻越'], story:'翻越夹金山是红军长征中第一次战胜极端自然环境，战士们以钢铁意志征服了雪山天险。' } },

    { id:'n12', name:'过草地', date:'1935.8下旬', theme:'grass', pos:[72,48],
      story:[
        '松潘草地一望无际，泥沼遍布、气候恶劣，红军粮绝衣单，陷入极端困境，减员巨大。',
        '《金色的鱼钩》中，老班长用缝衣针做鱼钩钓鱼给伤员吃，自己却嚼鱼骨充饥，最终牺牲在草地上。'],
      emotion:{ title:'金色的鱼钩', text:'老班长用缝衣针做钩钓鱼给伤员，自己嚼鱼骨，金色的鱼钩闪耀着共产党人无私奉献的光芒。', tag:'经典故事' },
      choice:{ prompt:'草地粮绝，如何分配有限给养？', options:[
        O('伤员优先，官兵一致', {troops:0,supply:0,morale:8,faith:0}, '同甘共苦，凝聚队伍斗志', true),
        O('干部先走，留下弱者', {troops:-600,supply:0,morale:-10,faith:0}, '军心涣散，队伍失去凝聚力') ] },
      quiz:'n12', mg:'mg12',
      entry:{troops:30000, supply:35, morale:62, faith:80},
      mgReward:{troops:100, supply:0, morale:6, faith:0},
      noteCard:{ title:'过草地', facts:['松潘草地泥沼无边、粮绝，减员巨大','老班长缝衣针做钩钓鱼给伤员，自己嚼鱼骨'], story:'过草地是长征中最艰苦的阶段之一，红军以惊人的毅力走出草地，向着胜利继续前进。' } },

    { id:'n13', name:'激战腊子口', date:'1935.9.17', theme:'loess', pos:[86,34],
      story:[
        '腊子口是川西北通往甘南的天险隘口，两面绝壁夹一线，正面强攻屡屡受挫。',
        '一名外号"云贵川"的苗族小战士主动请缨，带人攀上绝壁从侧后奇袭，一举突破天险。'],
      emotion:{ title:'攀上绝壁的小战士', text:'外号"云贵川"的苗族小战士带人攀上崖顶奇袭，正面佯攻配合，一举拿下天险腊子口。', tag:'史实' },
      choice:{ prompt:'天险正面不下，如何破敌？', options:[
        O('正面佯攻，侧后攀崖奇袭', {troops:0,supply:0,morale:8,faith:0}, '出其不意，突破天险', true),
        O('全线反复正面强冲', {troops:-2000,supply:0,morale:-6,faith:0}, '徒增伤亡，久攻不下') ] },
      quiz:'n13', mg:'mg13',
      entry:{troops:30000, supply:30, morale:64, faith:80},
      mgReward:{troops:200, supply:0, morale:8, faith:0},
      noteCard:{ title:'激战腊子口', facts:['腊子口是川西北通往甘南的天险隘口','外号"云贵川"的苗族小战士攀崖奇袭'], story:'腊子口一战打通了红军北上的通道，为红军进入陕甘苏区、完成长征奠定了基础。' } },

    { id:'n14', name:'三军会师', date:'1935.10.19→1936.10 会宁', theme:'loess', pos:[118,33],
      story:[
        '1935年10月19日，中央红军抵达陕北吴起镇，完成了历时一年的战略转移。',
        '1936年10月，红一、红二、红四方面军在甘肃会宁胜利会师，红军纵横十余省，行程二万五千里。'],
      emotion:{ title:'星星之火，可以燎原', text:'出发八万六千，会师余部锐减，人数对比令人动容；但星星之火可以燎原，革命的火种终成燎原之势。', tag:'史实' },
      choice:{ prompt:'三大主力会师，下一步何去何从？', options:[
        O('会师整训，开赴抗日前线', {troops:0,supply:0,morale:10,faith:0}, '保存革命力量，迎接抗日新高潮', true) ] },
      quiz:'n14', mg:'mg14',
      entry:{troops:30000, supply:30, morale:66, faith:82},
      mgReward:{troops:0, supply:0, morale:10, faith:0},
      noteCard:{ title:'三军会师', facts:['1935年10月19日中央红军抵达吴起镇','1936年10月三大主力在会宁会师，行程二万五千里'], story:'长征的胜利是中国革命转危为安的关键，三大主力会师宣告了长征的伟大胜利，开启了革命新篇章。' } },
  ];
})(globalThis.XH = globalThis.XH || {});
