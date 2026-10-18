;(function (XH) {
  const O = (label, effects, explain) => ({ label, effects, explain });
  XH.EVENTS = [
    { id:'ev_plane', text:'敌机嗡嗡逼近，队伍暴露在开阔地！', weight:3,
      options:[ O('立即疏散隐蔽', {troops:0, supply:0, morale:-2, faith:0}, '及时隐蔽，仅受轻惊扰'), O('加速通过', {troops:-300, supply:0, morale:-4, faith:0}, '遭低空扫射，出现伤亡') ] },
    { id:'ev_grain', text:'老乡塞来一袋红薯：“带上吧，娃娃们要吃饭。”', weight:3, minFaith:60,
      options:[ O('道谢收下并打借条', {troops:0, supply:8, morale:0, faith:2}, '红军有借有还，群众更信任'), O('坚决不收', {troops:0, supply:0, morale:2, faith:0}, '纪律严明，但队伍仍需筹粮') ] },
    { id:'ev_straggler', text:'一名小战士脚底磨烂，掉队了。', weight:3,
      options:[ O('轮流背他走', {troops:0, supply:-3, morale:4, faith:0}, '不抛弃不放弃，士气更旺'), O('留币让他自寻村庄', {troops:0, supply:0, morale:-5, faith:-3}, '队伍冷了心，士气受挫') ] },
    { id:'ev_slogan', text:'宿营时，宣传队员在土墙上刷下标语。', weight:2,
      options:[ O('帮着一起刷', {troops:0, supply:0, morale:0, faith:3}, '“红军是穷人的队伍”传开了'), O('催促早点休息', {troops:0, supply:0, morale:0, faith:0}, '无事发生，平安宿营') ] },
    { id:'ev_mud', text:'连日阴雨，山路泥泞，粮袋泡了水。', weight:3,
      options:[ O('分摊背粮', {troops:0, supply:-4, morale:1, faith:0}, '同甘共苦，共渡难关'), O('丢弃湿粮轻装', {troops:0, supply:-8, morale:0, faith:0}, '口粮告急，行军困难') ] },
    { id:'ev_guide', text:'岔路口向导犹豫：“东边近，可常有团丁。”', weight:2,
      options:[ O('听向导绕西边', {troops:0, supply:-3, morale:0, faith:0}, '稳妥，多走半天路'), O('坚决走东边', {troops:-200, supply:0, morale:0, faith:0}, '遭团丁袭扰，小有伤亡') ] },
    // —— 资源危机事件：仅对应资源 <30 时可抽（pickEvent 危机优先），给一次消耗其他资源的自救抉择 ——
    { id:'ev_starve', text:'粮袋见底，炊事班报告给养不足两日。', weight:5, maxSupply:30, crisis:true,
      options:[ O('严格执行配给，挖野菜充饥', {troops:0, supply:8, morale:3, faith:0}, '官兵一致同甘苦，共渡难关'), O('杀掉驮马充饥，轻装疾行', {troops:0, supply:12, morale:-4, faith:0}, '舍畜保人，士气受损但走出困境') ] },
    { id:'ev_wear', text:'连日苦战减员，队伍里响起埋怨声。', weight:5, maxMorale:30, crisis:true,
      options:[ O('党员骨干下连谈心，骨干带头表率', {troops:0, supply:0, morale:12, faith:2}, '支部建在连上，士气重新凝聚'), O('严厉处罚发牢骚的人', {troops:0, supply:0, morale:5, faith:-4}, '压下了声音，压不住人心') ] },
    { id:'ev_doubt', text:'队伍宿营的村庄门庭紧闭，老乡探头观望。', weight:5, maxFaith:30, crisis:true,
      options:[ O('开仓归还借粮，帮老乡挑水劈柴', {troops:0, supply:-5, morale:0, faith:12}, '行动胜过千言，民心重新聚拢'), O('不作停留，加速通过', {troops:0, supply:0, morale:0, faith:2}, '误会依旧，离村时仍无人相送') ] },
  ];
})(globalThis.XH = globalThis.XH || {});
