;(function (XH) {
  XH.SPRITE_MAP = {
    G:'uniformGray', D:'uniformDark', S:'skin', R:'flagRed', T:'redStar', K:'inkBlack',
    W:'snow', B:'wood', H:'woodDark', P:'pathBrown', Q:'pathDark', C:'cloudWhite',
    A:'water', F:'flameCore', Y:'sparkGold', M:'ropeGray', L:'grassLand', O:'warnOrange'
  };
  const soldier = { w:16, h:16, rows: [
    '................','......GGG.......','.....GGGGG......','.....GTTTG......',
    '.....GGGGG......','......SSS.......','......SKS.......','.....DDDDD......',
    '....DDDDDDD.....','...DDDDDDDDD....','....DDDDDDD.G...','....DDDDDDD.....',
    '.....DD.DD......','.....DD.DD......','.....KK.KK......','................']};
  const flag = { w:16, h:24, rows: [
    'M...............','MRRRRRRRR.......','MRRRRRRRRRR.....','MRRTTRRRRRRR....',
    'MRRRRRRRRRR.....','MRRRTTRRRRRR....','MRRRRRRRRRR.....','MRRRRRRRR.......',
    'M...............','M...............','M...............','M...............',
    'M...............','M...............','M...............','M...............',
    'M...............','M...............','M...............','M...............',
    'M...............','M...............','M...............','M...............']};
  // boat 24x12 木船（B/H 船身、M 桅绳、S 船工头部）
  const boat = { w:24, h:12, rows: [
    '........................','...........M............','...........M............',
    '...........M............','...........M............','......S....M............',
    '....BBBBBBBBBBBBBBBB....','...BBBBBBBBBBBBBBBBBB...','..BBBBBBBBBBBBBBBBBBBB..',
    '.HHHHHHHHHHHHHHHHHHHHHH.','..HHHHHHHHHHHHHHHHHHHH..','...HHHHHHHHHHHHHHHHHH...']};
  // plane 16x10 敌机（C 机身机翼、K 舷窗、O 警示点）
  const plane = { w:16, h:10, rows: [
    '................','.....CCCC.......','....CCKKCC......','...CCKKKKCC.....',
    '..CCCCCCCCCCCC..','.CCCCCCCCCCCCCC.','..CCCCCCCCCCCC..','......OO........',
    '......OO........','................']};
  // plank 8x3 门板（B 板面、H 阴影）
  const plank = { w:8, h:3, rows: [
    'BBBBBBBB','BBBBBBBB','HHHHHHHH']};
  // elder 16x16 老乡（C 上衣、S 脸、P 拐杖）
  const elder = { w:16, h:16, rows: [
    '................','......HHH.......','.....HHHHH......','.....SSSSS......',
    '.....SKSSS......','.....SSSSS......','......CCC.......','.....CCCCC......',
    '....CCCCCCC.....','....CCPCCCC.....','....CCPCCCC.....','.....PCCP.......',
    '.....P..P.......','.....P..P.......','....PP..PP......','................']};
  // enemy 16x16 敌兵（D 军装、K 钢盔）
  const enemy = { w:16, h:16, rows: [
    '................','.....KKKKK......','....KKKKKKK.....','....KKKKKKK.....',
    '.....SSSSS......','.....SKSSS......','......DDD.......','.....DDDDD......',
    '....DDDDDDD.....','...DDDDDDDDD....','....DDDDDDD.....','....DDDDDDD.....',
    '.....DD.DD......','.....DD.DD......','.....KK.KK......','................']};
  // campfire 8x8 篝火（F 火焰、O 火苗、B 柴）
  const campfire = { w:8, h:8, rows: [
    '........','...F....','..FOF...','.FOOOF..','..FOF...','...F....',
    '.BB..BB.','..BBBB..']};
  XH.SPRITES = { soldier, soldier2: soldier, flag, banner: flag,
    boat, plane, plank, elder, enemy, campfire };
})(globalThis.XH = globalThis.XH || {});
