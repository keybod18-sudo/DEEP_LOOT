export type ItemCategory = 'weapon' | 'armor' | 'consumable';
export type ItemRarity = '通常' | '上質' | '希少' | '激レア' | '伝説級';
export type DesignRarity = ItemRarity;
export type EquipmentRarity = '銅' | '銀' | '金' | '赤神話';
export type StatusKind = 'poison' | 'paralysis' | 'sleep' | 'blind' | 'silence' | 'seal' | 'slow' | 'freeze';

export interface EquipmentEffect {
  type: string;
  amount?: number;
  multiplier?: number;
  chance?: number;
  ratio?: number;
  status?: StatusKind | null;
  statusChance?: number | null;
  statusDuration?: number | null;
  duration?: number;
  statuses?: StatusKind[];
  resistance?: number;
  magic?: string;
  targets?: string[];
  bonus?: number;
  threshold?: number;
  scope?: string;
  reduction?: number;
  interval?: number;
  pauseAfterHit?: number;
  chargesPerFloor?: number;
  text?: string;
}

export type WeaponAbilityKind = 'power' | 'impact' | 'leech' | 'critical' | 'gold' | 'special';
export type ArmorAbilityKind = 'vitality' | 'guard' | 'fortress' | 'speed' | 'regen' | 'resist' | 'special';

export interface WeaponAbility {
  kind: WeaponAbilityKind;
  name: string;
  description: string;
  value: number;
  effect?: EquipmentEffect;
}

export interface ArmorAbility {
  kind: ArmorAbilityKind;
  name: string;
  description: string;
  value: number;
  effect?: EquipmentEffect;
}

export interface BaseItem {
  id: string;
  category: ItemCategory;
  name: string;
  rarity: ItemRarity;
  designRarity?: DesignRarity;
}

export interface WeaponItem extends BaseItem {
  category: 'weapon';
  dropRarity: EquipmentRarity;
  powerLevel: number;
  attack: number;
  intrinsicAbility: WeaponAbility | null;
  abilitySlots: Array<WeaponAbility | null>;
}

export interface ArmorItem extends BaseItem {
  category: 'armor';
  dropRarity: EquipmentRarity;
  powerLevel: number;
  defense: number;
  intrinsicAbility: ArmorAbility | null;
  abilitySlots: Array<ArmorAbility | null>;
}

export interface ConsumableItem extends BaseItem {
  category: 'consumable';
  effect: 'heal' | 'remedy' | 'antidote';
  heal: number;
  description: string;
}

export type Item = WeaponItem | ArmorItem | ConsumableItem;

let nextItemId = 1;

const weaponAbilities: WeaponAbility[] = [
  { kind: 'power', name: '攻勢', description: '攻撃 +1', value: 1 },
  { kind: 'power', name: '猛攻', description: '攻撃 +2', value: 2 },
  { kind: 'power', name: '豪腕', description: '攻撃 +4', value: 4 },
  { kind: 'impact', name: '衝撃', description: 'ノックバック +15%', value: 1.15 },
  { kind: 'impact', name: '破砕', description: 'ノックバック +30%', value: 1.3 },
  { kind: 'impact', name: '重撃', description: 'ノックバック +50%', value: 1.5 },
  { kind: 'leech', name: '吸命', description: '敵撃破時 HP +2', value: 2 },
  { kind: 'leech', name: '吸血', description: '敵撃破時 HP +5', value: 5 },
  { kind: 'critical', name: '会心', description: '近接攻撃 8%で会心×1.6', value: 0.08, effect: { type: 'critical', chance: 0.08, multiplier: 1.6 } },
  { kind: 'critical', name: '必殺', description: '近接攻撃 14%で会心×2.0', value: 0.14, effect: { type: 'critical', chance: 0.14, multiplier: 2 } },
  { kind: 'gold', name: '金運', description: '敵撃破時 +2G', value: 2 },
  { kind: 'gold', name: '財宝運', description: '敵撃破時 +5G', value: 5 },
];

const armorAbilities: ArmorAbility[] = [
  { kind: 'vitality', name: '生命', description: '最大HP +6', value: 6 },
  { kind: 'vitality', name: '大生命', description: '最大HP +12', value: 12 },
  { kind: 'vitality', name: '命脈', description: '最大HP +20', value: 20 },
  { kind: 'guard', name: '守護', description: '被ダメージ -1', value: 1 },
  { kind: 'guard', name: '鉄壁', description: '被ダメージ -2', value: 2 },
  { kind: 'fortress', name: '堅牢', description: '防御 +1', value: 1 },
  { kind: 'fortress', name: '城塞', description: '防御 +2', value: 2 },
  { kind: 'fortress', name: '重装', description: '防御 +3', value: 3 },
  { kind: 'speed', name: '軽足', description: '移動速度 +5%', value: 1.05, effect: { type: 'moveSpeed', multiplier: 1.05 } },
  { kind: 'speed', name: '風足', description: '移動速度 +10%', value: 1.1, effect: { type: 'moveSpeed', multiplier: 1.1 } },
  { kind: 'regen', name: '再生', description: '3秒ごとにHP +1', value: 1, effect: { type: 'regen', amount: 1, interval: 3 } },
  { kind: 'regen', name: '強再生', description: '3秒ごとにHP +2', value: 2, effect: { type: 'regen', amount: 2, interval: 3 } },
  { kind: 'resist', name: '耐性', description: '状態異常付与率 -15%', value: 0.15, effect: { type: 'statusResist', resistance: 0.15 } },
  { kind: 'resist', name: '強耐性', description: '状態異常付与率 -30%', value: 0.3, effect: { type: 'statusResist', resistance: 0.3 } },
];

interface WeaponDefinition {
  name: string;
  attackOffset: number;
  designRarity: DesignRarity;
  intrinsicAbility: WeaponAbility | null;
}

interface ArmorDefinition {
  name: string;
  defenseOffset: number;
  designRarity: DesignRarity;
  intrinsicAbility: ArmorAbility | null;
}

const weaponDefinitions: readonly WeaponDefinition[] = [
  { name: "鉄の剣", attackOffset: 0, designRarity: "通常", intrinsicAbility: null },
  { name: "山賊の剣", attackOffset: 0, designRarity: "通常", intrinsicAbility: null },
  { name: "古びた長剣", attackOffset: 0, designRarity: "通常", intrinsicAbility: null },
  { name: "青鋼の剣", attackOffset: 1, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "青鋼穿ち", description: "攻撃時15%で敵防御の20%を無視", value: 0, effect: { type: "armorPen", chance: 0.15, ratio: 0.2 } } },
  { name: "黒鉄の剣", attackOffset: 1, designRarity: "上質", intrinsicAbility: { kind: 'impact', name: "黒鉄の重撃", description: "ノックバック +25%", value: 1.25, effect: { type: "knockback", multiplier: 1.25 } } },
  { name: "錆喰いの剣", attackOffset: 0, designRarity: "上質", intrinsicAbility: { kind: 'leech', name: "錆喰い", description: "敵撃破時 HP +3", value: 3, effect: { type: "killHeal", amount: 3 } } },
  { name: "洞窟刀", attackOffset: 0, designRarity: "通常", intrinsicAbility: null },
  { name: "月影の短剣", attackOffset: 0, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "月影連刃", description: "攻撃時8%で威力50%の追撃を1回", value: 0, effect: { type: "echo", chance: 0.08, ratio: 0.5 } } },
  { name: "火打ちの剣", attackOffset: 1, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "火花術", description: "攻撃時10%でファイアーボールを発射", value: 0, effect: { type: "magicProc", magic: "fireball", chance: 0.1 } } },
  { name: "骨断ち", attackOffset: 1, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "骨断ち", description: "骨・亡者系へのダメージ +25%", value: 0, effect: { type: "slayer", targets: ["骨", "亡者系"], multiplier: 1.25 } } },
  { name: "風切丸", attackOffset: 0, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "風刃", description: "攻撃時9%で前方へ貫通する風刃を発射", value: 0, effect: { type: "magicProc", magic: "windBlade", chance: 0.09 } } },
  { name: "泥濘の刃", attackOffset: 0, designRarity: "通常", intrinsicAbility: null },
  { name: "赤銅の長剣", attackOffset: 1, designRarity: "上質", intrinsicAbility: { kind: 'power', name: "赤銅の重み", description: "攻撃 +2", value: 2, effect: { type: "attackBonus", amount: 2 } } },
  { name: "白銀の小剣", attackOffset: 1, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "銀祓い", description: "亡者・幽霊系へのダメージ +25%", value: 0, effect: { type: "slayer", targets: ["亡者", "幽霊系"], multiplier: 1.25 } } },
  { name: "影縫い", attackOffset: 0, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "影縫い", description: "攻撃時15%で鈍足（移動速度-40%・3秒）", value: 0, effect: { type: "statusProc", status: "slow", chance: 0.15, duration: 3.0, multiplier: 0.6 } } },
  { name: "雷鳴の剣", attackOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "雷招", description: "攻撃時10%でチェインライトニングを発動", value: 0, effect: { type: "magicProc", magic: "chainLightning", chance: 0.1 } } },
  { name: "苔むす剣", attackOffset: 0, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "苔毒", description: "攻撃時12%で毒（4秒）", value: 0, effect: { type: "statusProc", status: "poison", chance: 0.12, duration: 4.0 } } },
  { name: "深層の刃", attackOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "深層侵食", description: "攻撃時12%で敵防御の30%を無視", value: 0, effect: { type: "armorPen", chance: 0.12, ratio: 0.3 } } },
  { name: "血煙丸", attackOffset: 1, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "血吸い", description: "攻撃時5%で与ダメージの25%をHP回復", value: 0, effect: { type: "lifeSteal", chance: 0.05, ratio: 0.25 } } },
  { name: "岩砕き", attackOffset: 1, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "岩砕", description: "岩・晶石・装甲系へのダメージ +30%", value: 0, effect: { type: "slayer", targets: ["岩", "晶石", "装甲系"], multiplier: 1.3 } } },
  { name: "狩人の曲刀", attackOffset: 1, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "狩人の眼", description: "獣・蟲・飛行系へのダメージ +20%", value: 0, effect: { type: "slayer", targets: ["獣", "蟲", "飛行系"], multiplier: 1.2 } } },
  { name: "亡者の剣", attackOffset: 0, designRarity: "希少", intrinsicAbility: { kind: 'leech', name: "亡者喰い", description: "敵撃破時 HP +4", value: 4, effect: { type: "killHeal", amount: 4 } } },
  { name: "星屑の剣", attackOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "星落とし", description: "攻撃時7%で敵位置へ小型の流星を落とす", value: 0, effect: { type: "magicProc", magic: "meteor", chance: 0.07 } } },
  { name: "夜渡り", attackOffset: 1, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "闇討ち", description: "HP100%の敵への初撃ダメージ +20%", value: 0, effect: { type: "firstStrike", multiplier: 2.0 } } },
  { name: "燐光剣", attackOffset: 1, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "閃光", description: "攻撃時10%で暗闇（3秒）", value: 0, effect: { type: "statusProc", status: "blind", chance: 0.1, duration: 3.0 } } },
  { name: "黒曜の刃", attackOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "黒曜穿ち", description: "攻撃時15%で敵防御の30%を無視", value: 0, effect: { type: "armorPen", chance: 0.15, ratio: 0.3 } } },
  { name: "朽王の剣", attackOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "朽毒", description: "攻撃時14%で毒（5秒）", value: 0, effect: { type: "statusProc", status: "poison", chance: 0.14, duration: 5.0 } } },
  { name: "竜骨剣", attackOffset: 3, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "竜骨圧", description: "大型・ボスへのダメージ +18%", value: 0, effect: { type: "slayer", targets: ["大型", "ボス"], multiplier: 1.18 } } },
  { name: "鉱夫の鉈", attackOffset: 0, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "採掘刃", description: "岩・晶石系へのダメージ +35%", value: 0, effect: { type: "slayer", targets: ["岩", "晶石系"], multiplier: 1.35 } } },
  { name: "迷宮の剣", attackOffset: 1, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "迷宮勘", description: "アイテムドロップ率 +6%", value: 0, effect: { type: "dropRate", bonus: 0.06 } } },
  { name: "霧裂き", attackOffset: 1, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "霧裂き", description: "攻撃時12%で暗闇（3秒）", value: 0, effect: { type: "statusProc", status: "blind", chance: 0.12, duration: 3.0 } } },
  { name: "紅蓮の短剣", attackOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "紅蓮術", description: "攻撃時12%でファイアーボールを発射", value: 0, effect: { type: "magicProc", magic: "fireball", chance: 0.12 } } },
  { name: "氷脈の剣", attackOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "氷槍術", description: "攻撃時12%でフリーズランサーを発動。命中時20%で凍結（0.8秒）", value: 0, effect: { type: "magicProc", magic: "freezeLancer", chance: 0.12, status: "freeze", statusChance: 0.2, statusDuration: 0.8 } } },
  { name: "紫電の刃", attackOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "紫電連鎖", description: "攻撃時11%でチェインライトニングを発動。命中時15%で麻痺（0.7秒）", value: 0, effect: { type: "magicProc", magic: "chainLightning", chance: 0.11, status: "paralysis", statusChance: 0.15, statusDuration: 0.7 } } },
  { name: "鬼灯丸", attackOffset: 1, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "鬼火", description: "攻撃時10%で追尾する鬼火を1発放つ", value: 0, effect: { type: "magicProc", magic: "willOWisp", chance: 0.1 } } },
  { name: "夢喰い", attackOffset: 1, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "夢喰い", description: "攻撃時12%で睡眠（1.5秒）。ボスには鈍足（-30%・2秒）", value: 0, effect: { type: "statusProc", status: "sleep", chance: 0.12, duration: 1.5 } } },
  { name: "蟲狩りの剣", attackOffset: 1, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "蟲狩り", description: "蟲系へのダメージ +35%", value: 0, effect: { type: "slayer", targets: ["蟲系"], multiplier: 1.35 } } },
  { name: "蛇殺し", attackOffset: 1, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "蛇殺し", description: "蛇系へのダメージ +40%", value: 0, effect: { type: "slayer", targets: ["蛇系"], multiplier: 1.4 } } },
  { name: "蝙蝠切り", attackOffset: 0, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "空裂き", description: "飛行系へのダメージ +35%", value: 0, effect: { type: "slayer", targets: ["飛行系"], multiplier: 1.35 } } },
  { name: "晶砕き", attackOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "晶砕", description: "岩・晶石・装甲系へのダメージ +35%", value: 0, effect: { type: "slayer", targets: ["岩", "晶石", "装甲系"], multiplier: 1.35 } } },
  { name: "影子守", attackOffset: 1, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "影分身", description: "攻撃時6%で同じ攻撃を威力50%でもう1回発生", value: 0, effect: { type: "echo", chance: 0.06, ratio: 0.5 } } },
  { name: "断層剣", attackOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "地裂波", description: "攻撃時8%で地面を走る衝撃波を発射", value: 0, effect: { type: "magicProc", magic: "earthWave", chance: 0.08 } } },
  { name: "墓守の剣", attackOffset: 1, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "墓守の祓い", description: "亡者・幽霊系へのダメージ +30%", value: 0, effect: { type: "slayer", targets: ["亡者", "幽霊系"], multiplier: 1.3 } } },
  { name: "祈り砕き", attackOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "祈り砕き", description: "攻撃時10%で沈黙（3秒）", value: 0, effect: { type: "statusProc", status: "silence", chance: 0.1, duration: 3.0 } } },
  { name: "灰冠の剣", attackOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "灰火球", description: "攻撃時9%でファイアーボールを発射", value: 0, effect: { type: "magicProc", magic: "fireball", chance: 0.09 } } },
  { name: "金喰いの刃", attackOffset: 0, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "金喰い", description: "敵撃破時のゴールド獲得量 +20%", value: 0, effect: { type: "goldGain", multiplier: 1.2 } } },
  { name: "幽世の剣", attackOffset: 2, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "幽体刃", description: "攻撃時15%で敵防御の30%を無視", value: 0, effect: { type: "armorPen", chance: 0.15, ratio: 0.3 } } },
  { name: "月蝕刀", attackOffset: 3, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "月蝕", description: "攻撃時8%で闇弾または聖光弾を1発放つ", value: 0, effect: { type: "magicProc", magic: "darkBolt", chance: 0.08 } } },
  { name: "黒薔薇", attackOffset: 1, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "黒薔薇毒", description: "攻撃時18%で毒（5秒）", value: 0, effect: { type: "statusProc", status: "poison", chance: 0.18, duration: 5.0 } } },
  { name: "太古の剣", attackOffset: 3, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "太古の波動", description: "攻撃時8%で周囲へ衝撃波を発生し大きく押し返す", value: 0, effect: { type: "magicProc", magic: "shockwave", chance: 0.08 } } },
  { name: "深淵の牙", attackOffset: 3, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "深淵牙", description: "HP25%以下の敵へのダメージ +20%", value: 0, effect: { type: "execute", threshold: 0.25, multiplier: 1.2 } } },
  { name: "旅人の名剣", attackOffset: 1, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "旅人の手際", description: "アイテムドロップ率 +8%", value: 0, effect: { type: "dropRate", bonus: 0.08 } } },
  { name: "迷い星", attackOffset: 2, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "流星刃", description: "攻撃時9%で貫通する星弾を発射。撃破時20%で再発射", value: 0, effect: { type: "magicProc", magic: "starBolt", chance: 0.09 } } },
  { name: "終夜の剣", attackOffset: 3, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "終夜", description: "攻撃時12%で闇の魔弾を発射", value: 0, effect: { type: "magicProc", magic: "darkBolt", chance: 0.12 } } },
];

const armorDefinitions: readonly ArmorDefinition[] = [
  { name: "革の鎧", defenseOffset: 0, designRarity: "通常", intrinsicAbility: null },
  { name: "鉄の胸当て", defenseOffset: 0, designRarity: "通常", intrinsicAbility: null },
  { name: "探索者の鎧", defenseOffset: 0, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "探索慣れ", description: "毒・鈍足：弱防御（付与率25%軽減）", value: 0, effect: { type: "statusResist", statuses: ["poison", "slow"], resistance: 0.25 } } },
  { name: "青鋼の鎧", defenseOffset: 1, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "青鋼耐寒", description: "凍結：弱防御（付与率25%軽減）", value: 0, effect: { type: "statusResist", statuses: ["freeze"], resistance: 0.25 } } },
  { name: "黒革の鎧", defenseOffset: 0, designRarity: "通常", intrinsicAbility: null },
  { name: "錆鉄の鎧", defenseOffset: 1, designRarity: "通常", intrinsicAbility: null },
  { name: "苔衣", defenseOffset: 0, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "苔の防毒", description: "毒：強防御（付与率60%軽減）", value: 0, effect: { type: "statusResist", statuses: ["poison"], resistance: 0.6 } } },
  { name: "鉱夫の胸当て", defenseOffset: 1, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "坑道の目", description: "暗闇：弱防御（付与率25%軽減）", value: 0, effect: { type: "statusResist", statuses: ["blind"], resistance: 0.25 } } },
  { name: "月影の外套", defenseOffset: 0, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "月影歩法", description: "移動速度 +10%", value: 0, effect: { type: "moveSpeed", multiplier: 1.1 } } },
  { name: "骨組み鎧", defenseOffset: 1, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "骨組み", description: "近接ダメージ -8%", value: 0, effect: { type: "damageReduction", scope: "melee", reduction: 0.08 } } },
  { name: "風除けのコート", defenseOffset: 0, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "風抜け", description: "鈍足：完全無効", value: 0, effect: { type: "statusResist", statuses: ["slow"], resistance: 1.0 } } },
  { name: "泥壁の鎧", defenseOffset: 1, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "泥壁", description: "ノックバックを35%軽減", value: 0, effect: { type: "knockbackResist", multiplier: 0.65 } } },
  { name: "赤銅の胸甲", defenseOffset: 1, designRarity: "上質", intrinsicAbility: { kind: 'fortress', name: "赤銅板", description: "防御 +2", value: 2, effect: { type: "defenseBonus", amount: 2 } } },
  { name: "白銀の鎧", defenseOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "白銀の護り", description: "亡者・幽霊系から受けるダメージ -15%", value: 0, effect: { type: "raceResist", targets: ["亡者", "幽霊系"], multiplier: 0.85 } } },
  { name: "影縫いの衣", defenseOffset: 0, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "影縫い歩法", description: "移動速度 +12%", value: 0, effect: { type: "moveSpeed", multiplier: 1.12 } } },
  { name: "雷除け胴", defenseOffset: 1, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "雷断", description: "麻痺：完全無効", value: 0, effect: { type: "statusResist", statuses: ["paralysis"], resistance: 1.0 } } },
  { name: "深層探索服", defenseOffset: 1, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "深層適応", description: "毒・麻痺・睡眠・暗闇・沈黙・封印・鈍足・凍結：弱防御（付与率20%軽減）", value: 0, effect: { type: "statusResist", statuses: ["poison", "paralysis", "sleep", "blind", "silence", "seal", "slow", "freeze"], resistance: 0.2 } } },
  { name: "血染めの鎧", defenseOffset: 1, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "血気", description: "HP30%以下で防御 +2", value: 0, effect: { type: "lowHpDefense", threshold: 0.3, amount: 2 } } },
  { name: "岩殻の鎧", defenseOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "岩殻", description: "ノックバックを50%軽減", value: 0, effect: { type: "knockbackResist", multiplier: 0.5 } } },
  { name: "狩人の胴衣", defenseOffset: 0, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "狩人の身かわし", description: "獣・蟲・飛行系から受けるダメージ -10%", value: 0, effect: { type: "raceResist", targets: ["獣", "蟲", "飛行系"], multiplier: 0.9 } } },
  { name: "亡者の鎧", defenseOffset: 1, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "亡者の肉体", description: "毒：完全無効", value: 0, effect: { type: "statusResist", statuses: ["poison"], resistance: 1.0 } } },
  { name: "星屑の外套", defenseOffset: 1, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "星守り", description: "魔法・飛び道具ダメージ -12%", value: 0, effect: { type: "damageReduction", scope: "projectile", reduction: 0.12 } } },
  { name: "夜渡りの服", defenseOffset: 0, designRarity: "伝説級", intrinsicAbility: { kind: 'special', name: "夜渡り", description: "移動速度 +15%", value: 0, effect: { type: "moveSpeed", multiplier: 1.15 } } },
  { name: "燐光の鎧", defenseOffset: 1, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "燐光", description: "暗闇：完全無効", value: 0, effect: { type: "statusResist", statuses: ["blind"], resistance: 1.0 } } },
  { name: "黒曜の鎧", defenseOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "黒曜膜", description: "飛び道具ダメージ -12%", value: 0, effect: { type: "damageReduction", scope: "projectile", reduction: 0.12 } } },
  { name: "朽王の外套", defenseOffset: 1, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "朽王の防毒", description: "毒：完全無効", value: 0, effect: { type: "statusResist", statuses: ["poison"], resistance: 1.0 } } },
  { name: "竜骨鎧", defenseOffset: 3, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "竜骨の威圧", description: "大型・ボスから受けるダメージ -15%", value: 0, effect: { type: "raceResist", targets: ["大型", "ボス"], multiplier: 0.85 } } },
  { name: "坑道作業服", defenseOffset: 0, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "坑道慣れ", description: "暗闇・鈍足：弱防御（付与率25%軽減）", value: 0, effect: { type: "statusResist", statuses: ["blind", "slow"], resistance: 0.25 } } },
  { name: "迷宮騎士鎧", defenseOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "迷宮騎士の加護", description: "毒・麻痺・睡眠・暗闇・沈黙・封印・鈍足・凍結：弱防御（付与率25%軽減）", value: 0, effect: { type: "statusResist", statuses: ["poison", "paralysis", "sleep", "blind", "silence", "seal", "slow", "freeze"], resistance: 0.25 } } },
  { name: "霧衣", defenseOffset: 0, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "霧隠れ", description: "6%で被ダメージを無効化", value: 0, effect: { type: "evasion", chance: 0.06 } } },
  { name: "紅蓮の胸甲", defenseOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "紅蓮の熱", description: "凍結：強防御（付与率60%軽減）", value: 0, effect: { type: "statusResist", statuses: ["freeze"], resistance: 0.6 } } },
  { name: "氷脈の鎧", defenseOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "氷脈断ち", description: "凍結：完全無効", value: 0, effect: { type: "statusResist", statuses: ["freeze"], resistance: 1.0 } } },
  { name: "紫電の外套", defenseOffset: 1, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "紫電断ち", description: "麻痺：完全無効", value: 0, effect: { type: "statusResist", statuses: ["paralysis"], resistance: 1.0 } } },
  { name: "鬼灯の鎧", defenseOffset: 1, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "鬼灯の光", description: "暗闇：完全無効", value: 0, effect: { type: "statusResist", statuses: ["blind"], resistance: 1.0 } } },
  { name: "夢守りの衣", defenseOffset: 0, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "夢守り", description: "睡眠：完全無効", value: 0, effect: { type: "statusResist", statuses: ["sleep"], resistance: 1.0 } } },
  { name: "蟲殻の鎧", defenseOffset: 1, designRarity: "上質", intrinsicAbility: { kind: 'special', name: "蟲殻防毒", description: "毒：強防御（付与率60%軽減）", value: 0, effect: { type: "statusResist", statuses: ["poison"], resistance: 0.6 } } },
  { name: "蛇革の胴衣", defenseOffset: 0, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "蛇革防毒", description: "毒：完全無効", value: 0, effect: { type: "statusResist", statuses: ["poison"], resistance: 1.0 } } },
  { name: "蝙蝠羽の外套", defenseOffset: 0, designRarity: "伝説級", intrinsicAbility: { kind: 'special', name: "夜翼", description: "移動速度 +15%", value: 0, effect: { type: "moveSpeed", multiplier: 1.15 } } },
  { name: "晶殻鎧", defenseOffset: 2, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "晶殻", description: "毒・麻痺・睡眠・暗闇・沈黙・封印・鈍足・凍結：強防御（付与率50%軽減）", value: 0, effect: { type: "statusResist", statuses: ["poison", "paralysis", "sleep", "blind", "silence", "seal", "slow", "freeze"], resistance: 0.5 } } },
  { name: "影子守の衣", defenseOffset: 1, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "影再生", description: "3秒ごとにHP +1。被ダメージ後3秒は回復停止", value: 0, effect: { type: "regen", interval: 3.0, amount: 1, pauseAfterHit: 3.0 } } },
  { name: "断層の鎧", defenseOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "断層不動", description: "ノックバック：完全無効", value: 0, effect: { type: "knockbackResist", multiplier: 0 } } },
  { name: "墓守の鎧", defenseOffset: 1, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "墓守", description: "亡者・幽霊系から受けるダメージ -15%", value: 0, effect: { type: "raceResist", targets: ["亡者", "幽霊系"], multiplier: 0.85 } } },
  { name: "祈祷師の法衣", defenseOffset: 0, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "祈りの再生", description: "3秒ごとにHP +1。被ダメージ後3秒は回復停止", value: 0, effect: { type: "regen", interval: 3.0, amount: 1, pauseAfterHit: 3.0 } } },
  { name: "灰冠の鎧", defenseOffset: 2, designRarity: "希少", intrinsicAbility: { kind: 'special', name: "灰冠守り", description: "遠距離ダメージ -12%", value: 0, effect: { type: "damageReduction", scope: "ranged", reduction: 0.12 } } },
  { name: "金継ぎの鎧", defenseOffset: 1, designRarity: "伝説級", intrinsicAbility: { kind: 'special', name: "金継ぎ", description: "致死ダメージを1フロア1回だけHP1で耐える", value: 0, effect: { type: "lastStand", chargesPerFloor: 1 } } },
  { name: "幽世の衣", defenseOffset: 1, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "幽世耐性", description: "毒・麻痺・睡眠・暗闇・沈黙・封印・鈍足・凍結：強防御（付与率60%軽減）", value: 0, effect: { type: "statusResist", statuses: ["poison", "paralysis", "sleep", "blind", "silence", "seal", "slow", "freeze"], resistance: 0.6 } } },
  { name: "月蝕の鎧", defenseOffset: 2, designRarity: "伝説級", intrinsicAbility: { kind: 'special', name: "月蝕の加護", description: "毒・麻痺・睡眠・暗闇・沈黙・封印・鈍足・凍結：完全無効", value: 0, effect: { type: "statusResist", statuses: ["poison", "paralysis", "sleep", "blind", "silence", "seal", "slow", "freeze"], resistance: 1.0 } } },
  { name: "黒薔薇のドレス", defenseOffset: 1, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "黒薔薇の防毒", description: "毒：完全無効", value: 0, effect: { type: "statusResist", statuses: ["poison"], resistance: 1.0 } } },
  { name: "太古の甲冑", defenseOffset: 3, designRarity: "伝説級", intrinsicAbility: { kind: 'special', name: "太古の護り", description: "毒・麻痺・睡眠・暗闇・沈黙・封印・鈍足・凍結：強防御（付与率60%軽減）", value: 0, effect: { type: "statusResist", statuses: ["poison", "paralysis", "sleep", "blind", "silence", "seal", "slow", "freeze"], resistance: 0.6 } } },
  { name: "深淵の鎧", defenseOffset: 3, designRarity: "伝説級", intrinsicAbility: { kind: 'special', name: "深淵再生", description: "2秒ごとにHP +1。被ダメージ後4秒は回復停止", value: 0, effect: { type: "regen", interval: 2.0, amount: 1, pauseAfterHit: 4.0 } } },
  { name: "旅人の外套", defenseOffset: 0, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "旅人の足", description: "移動速度 +10%", value: 0, effect: { type: "moveSpeed", multiplier: 1.1 } } },
  { name: "迷い星の鎧", defenseOffset: 2, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "流星守り", description: "飛び道具ダメージ -15%", value: 0, effect: { type: "damageReduction", scope: "projectile", reduction: 0.15 } } },
  { name: "終夜の外套", defenseOffset: 1, designRarity: "激レア", intrinsicAbility: { kind: 'special', name: "終夜の守り", description: "暗闇・睡眠：完全無効", value: 0, effect: { type: "statusResist", statuses: ["sleep", "blind"], resistance: 1.0 } } },
  { name: "王墓の甲冑", defenseOffset: 3, designRarity: "伝説級", intrinsicAbility: { kind: 'special', name: "王墓の命脈", description: "3秒ごとにHP +2。被ダメージ後3秒は回復停止", value: 0, effect: { type: "regen", interval: 3.0, amount: 2, pauseAfterHit: 3.0 } } },
];

export function createRandomItem(floor: number): Item {
  const roll = Math.random();
  if (roll < 0.36) return createWeapon(floor);
  if (roll < 0.72) return createArmor(floor);
  return createConsumable(floor);
}

export function createTreasureItem(floor: number, chestRarity: EquipmentRarity): Item {
  if (chestRarity === '銅' && Math.random() < 0.28) {
    return createConsumable(floor + 1);
  }

  return Math.random() < 0.5
    ? createWeapon(floor, chestRarity)
    : createArmor(floor, chestRarity);
}

function createWeapon(floor: number, forcedRarity?: EquipmentRarity): WeaponItem {
  const tier = Math.min(3, Math.floor((floor - 1) / 3));
  const definition = forcedRarity
    ? pickDefinitionForEquipmentRarity(weaponDefinitions, forcedRarity, floor)
    : pickDefinition(weaponDefinitions, floor);
  const powerLevel = rollPowerLevel(floor);
  const powerStatBonus = Math.floor((powerLevel - 1) / 3);
  const attack = Math.max(1, 1 + tier + powerStatBonus + Math.floor(Math.random() * 3) + definition.attackOffset);
  const rarity = definition.designRarity;

  return {
    id: `weapon-${nextItemId++}`,
    category: 'weapon',
    name: definition.name,
    rarity,
    designRarity: definition.designRarity,
    dropRarity: equipmentRarityFromDesign(definition.designRarity),
    powerLevel,
    attack,
    intrinsicAbility: definition.intrinsicAbility ? cloneAbility(definition.intrinsicAbility) : null,
    abilitySlots: createAbilitySlots(weaponAbilities, powerLevel),
  };
}

function createArmor(floor: number, forcedRarity?: EquipmentRarity): ArmorItem {
  const tier = Math.min(3, Math.floor((floor - 1) / 3));
  const definition = forcedRarity
    ? pickDefinitionForEquipmentRarity(armorDefinitions, forcedRarity, floor)
    : pickDefinition(armorDefinitions, floor);
  const powerLevel = rollPowerLevel(floor);
  const powerStatBonus = Math.floor((powerLevel - 1) / 3);
  const defense = Math.max(1, 1 + tier + powerStatBonus + Math.floor(Math.random() * 2) + definition.defenseOffset);
  const rarity = definition.designRarity;

  return {
    id: `armor-${nextItemId++}`,
    category: 'armor',
    name: definition.name,
    rarity,
    designRarity: definition.designRarity,
    dropRarity: equipmentRarityFromDesign(definition.designRarity),
    powerLevel,
    defense,
    intrinsicAbility: definition.intrinsicAbility ? cloneAbility(definition.intrinsicAbility) : null,
    abilitySlots: createAbilitySlots(armorAbilities, powerLevel),
  };
}

function createConsumable(floor: number): ConsumableItem {
  const medicineRoll = Math.random();
  if (medicineRoll < 0.10) return createRemedy();
  if (medicineRoll < 0.35) return createAntidote();
  const strong = floor >= 4 && Math.random() < 0.35;
  return {
    id: `item-${nextItemId++}`,
    category: 'consumable',
    name: strong ? String.fromCodePoint(0x56de, 0x5fa9, 0x85ac, 0x30fb, 0x5927) : String.fromCodePoint(0x56de, 0x5fa9, 0x85ac, 0x30fb, 0x5c0f),
    rarity: strong ? '上質' : '通常',
    effect: 'heal',
    heal: strong ? 60 : 25,
    description: strong ? String.fromCodePoint(0x48, 0x50, 0x3092, 0x36, 0x30, 0x56de, 0x5fa9, 0x3059, 0x308b) : String.fromCodePoint(0x48, 0x50, 0x3092, 0x32, 0x35, 0x56de, 0x5fa9, 0x3059, 0x308b),
  };
}

export function createHealingPotion(): ConsumableItem {
  return {
    id: `starter-heal-${nextItemId++}`,
    category: 'consumable',
    name: String.fromCodePoint(0x56de, 0x5fa9, 0x85ac, 0x30fb, 0x5c0f),
    rarity: '通常',
    effect: 'heal',
    heal: 25,
    description: 'HPを25回復する',
  };
}

export function createAntidote(): ConsumableItem {
  return {
    id: 'antidote-' + nextItemId++,
    category: 'consumable',
    name: String.fromCodePoint(0x6bd2, 0x6d88, 0x3057),
    rarity: String.fromCodePoint(0x901a, 0x5e38) as ItemRarity,
    effect: 'antidote',
    heal: 0,
    description: String.fromCodePoint(0x6bd2, 0x72b6, 0x614b, 0x3060, 0x3051, 0x3092, 0x89e3, 0x9664, 0x3059, 0x308b),
  };
}
export function createRemedy(): ConsumableItem {
  return {
    id: `starter-remedy-${nextItemId++}`,
    category: 'consumable',
    name: '万能薬',
    rarity: '通常',
    effect: 'remedy',
    heal: 0,
    description: 'すべての状態異常を解除する',
  };
}

function cloneAbility<T extends WeaponAbility | ArmorAbility>(ability: T): T {
  return {
    ...ability,
    effect: ability.effect ? {
      ...ability.effect,
      statuses: ability.effect.statuses ? [...ability.effect.statuses] : undefined,
      targets: ability.effect.targets ? [...ability.effect.targets] : undefined,
    } : undefined,
  } as T;
}

function createAbilitySlots<T extends WeaponAbility | ArmorAbility>(
  pool: readonly T[],
  powerLevel: number,
): Array<T | null> {
  const slotCount = slotCountForPower(powerLevel);
  const fillChance = Math.min(0.95, 0.17 + powerLevel * 0.078);
  const slots: Array<T | null> = Array.from({ length: slotCount }, () => null);

  for (let index = 0; index < slotCount; index += 1) {
    if (Math.random() > fillChance) continue;
    const ability = pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
    slots[index] = ability ? cloneAbility(ability) : null;
  }

  const minimumFilled =
    powerLevel >= 10 ? 6 :
    powerLevel >= 8 ? 4 :
    powerLevel >= 6 ? 2 :
    powerLevel >= 4 ? 1 :
    0;

  while (slots.filter((ability) => ability !== null).length < minimumFilled) {
    const emptyIndexes = slots
      .map((ability, index) => ability === null ? index : -1)
      .filter((index) => index >= 0);
    if (emptyIndexes.length === 0) break;
    const slotIndex = emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)]!;
    const ability = pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
    slots[slotIndex] = ability ? cloneAbility(ability) : null;
  }

  const filled = slots.filter((ability): ability is T => ability !== null);
  return [
    ...filled,
    ...Array.from({ length: slotCount - filled.length }, () => null),
  ];
}

function slotCountForPower(powerLevel: number): number {
  const counts = [1, 2, 2, 3, 4, 5, 5, 6, 7, 8];
  return counts[Math.max(1, Math.min(10, powerLevel)) - 1] ?? 1;
}

function rollPowerLevel(floor: number): number {
  const roll = Math.random();
  let power =
    roll < 0.18 ? 1 :
    roll < 0.34 ? 2 :
    roll < 0.48 ? 3 :
    roll < 0.61 ? 4 :
    roll < 0.72 ? 5 :
    roll < 0.81 ? 6 :
    roll < 0.88 ? 7 :
    roll < 0.94 ? 8 :
    roll < 0.98 ? 9 :
    10;

  const depthBonus = Math.min(2, Math.floor(Math.max(0, floor - 1) / 6));
  if (depthBonus > 0 && Math.random() < 0.35) {
    power += 1 + Math.floor(Math.random() * depthBonus);
  }
  return Math.max(1, Math.min(10, power));
}

function equipmentRarityFromDesign(rarity: DesignRarity): EquipmentRarity {
  if (rarity === '伝説級') return '赤神話';
  if (rarity === '激レア') return '金';
  if (rarity === '希少') return '銀';
  return '銅';
}

function pickDefinitionForEquipmentRarity<T extends { designRarity: DesignRarity }>(
  definitions: readonly T[],
  rarity: EquipmentRarity,
  floor: number,
): T {
  const pool = definitions.filter((definition) =>
    equipmentRarityFromDesign(definition.designRarity) === rarity
  );
  if (pool.length === 0) return pickDefinition(definitions, floor);

  const weights = pool.map((definition) => rarityWeight(definition.designRarity, floor));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = Math.random() * total;
  for (let index = 0; index < pool.length; index += 1) {
    roll -= weights[index] ?? 0;
    if (roll <= 0) return pool[index] ?? pool[0]!;
  }
  return pool[pool.length - 1] ?? definitions[0]!;
}

function pickDefinition<T extends { designRarity: DesignRarity }>(definitions: readonly T[], floor: number): T {
  const available = definitions.filter((definition) => floor >= minFloorFor(definition.designRarity));
  const pool = available.length > 0 ? available : definitions;
  const weights = pool.map((definition) => rarityWeight(definition.designRarity, floor));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < pool.length; i += 1) {
    roll -= weights[i] ?? 0;
    if (roll <= 0) return pool[i] ?? pool[0]!;
  }
  return pool[pool.length - 1] ?? definitions[0]!;
}

function minFloorFor(rarity: DesignRarity): number {
  if (rarity === '伝説級') return 7;
  if (rarity === '激レア') return 4;
  if (rarity === '希少') return 2;
  return 1;
}

function rarityWeight(rarity: DesignRarity, floor: number): number {
  const floorBoost = 1 + Math.max(0, floor - 1) * 0.035;
  if (rarity === '伝説級') return 0.04 * floorBoost;
  if (rarity === '激レア') return 0.12 * floorBoost;
  if (rarity === '希少') return 0.36 * floorBoost;
  if (rarity === '上質') return 0.72;
  return 1.0;
}
export function createStarterFaultArmor(): ArmorItem {
  return {
    id: 'starter-fault-armor',
    category: 'armor',
    name: String.fromCodePoint(0x65ad, 0x5c64, 0x306e, 0x93a7),
    rarity: String.fromCodePoint(0x5e0c, 0x5c11) as ItemRarity,
    designRarity: String.fromCodePoint(0x5e0c, 0x5c11) as DesignRarity,
    dropRarity: String.fromCodePoint(0x9280) as EquipmentRarity,
    powerLevel: 7,
    defense: 7,
    intrinsicAbility: {
      kind: 'special',
      name: String.fromCodePoint(0x65ad, 0x5c64, 0x4e0d, 0x52d5),
      description: String.fromCodePoint(
        0x30ce, 0x30c3, 0x30af, 0x30d0, 0x30c3, 0x30af,
        0xff1a, 0x5b8c, 0x5168, 0x7121, 0x52b9,
      ),
      value: 0,
      effect: { type: 'knockbackResist', multiplier: 0 },
    },
    abilitySlots: [
      {
        kind: 'vitality',
        name: String.fromCodePoint(0x751f, 0x547d),
        description: String.fromCodePoint(0x6700, 0x5927, 0x48, 0x50, 0x20, 0x2b, 0x36),
        value: 6,
      },
      {
        kind: 'regen',
        name: String.fromCodePoint(0x5f37, 0x518d, 0x751f),
        description: String.fromCodePoint(
          0x33, 0x79d2, 0x3054, 0x3068, 0x306b, 0x48, 0x50, 0x20, 0x2b, 0x32,
        ),
        value: 2,
        effect: { type: 'regen', amount: 2, interval: 3 },
      },
      {
        kind: 'vitality',
        name: String.fromCodePoint(0x547d, 0x8108),
        description: String.fromCodePoint(
          0x6700, 0x5927, 0x48, 0x50, 0x20, 0x2b, 0x32, 0x30,
        ),
        value: 20,
      },
      {
        kind: 'resist',
        name: String.fromCodePoint(0x8010, 0x6027),
        description: String.fromCodePoint(
          0x72b6, 0x614b, 0x7570, 0x5e38, 0x4ed8, 0x4e0e, 0x7387,
          0x20, 0x2d, 0x31, 0x35, 0x25,
        ),
        value: 0.15,
        effect: { type: 'statusResist', resistance: 0.15 },
      },
      {
        kind: 'fortress',
        name: String.fromCodePoint(0x91cd, 0x88c5),
        description: String.fromCodePoint(0x9632, 0x5fa1, 0x20, 0x2b, 0x33),
        value: 3,
      },
    ],
  };
}
