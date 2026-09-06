export type ItemCategory = 'weapon' | 'armor' | 'consumable';

export type WeaponAbilityKind = 'power' | 'impact' | 'leech';
export type ArmorAbilityKind = 'vitality' | 'guard' | 'fortress';

export interface WeaponAbility {
  kind: WeaponAbilityKind;
  name: string;
  description: string;
  value: number;
}

export interface ArmorAbility {
  kind: ArmorAbilityKind;
  name: string;
  description: string;
  value: number;
}

export interface BaseItem {
  id: string;
  category: ItemCategory;
  name: string;
  rarity: '通常' | '上質' | '希少';
}

export interface WeaponItem extends BaseItem {
  category: 'weapon';
  attack: number;
  intrinsicAbility: WeaponAbility | null;
  abilitySlots: Array<WeaponAbility | null>;
}

export interface ArmorItem extends BaseItem {
  category: 'armor';
  defense: number;
  intrinsicAbility: ArmorAbility | null;
  abilitySlots: Array<ArmorAbility | null>;
}

export interface ConsumableItem extends BaseItem {
  category: 'consumable';
  effect: 'heal' | 'remedy';
  heal: number;
  description: string;
}

export type Item = WeaponItem | ArmorItem | ConsumableItem;

let nextItemId = 1;

const EQUIPMENT_SLOT_COUNT = 8;

const weaponAbilities: WeaponAbility[] = [
  { kind: 'power', name: '猛攻', description: '攻撃 +2', value: 2 },
  { kind: 'impact', name: '衝撃', description: 'ノックバック +35%', value: 1.35 },
  { kind: 'leech', name: '吸命', description: '敵撃破時 HP +4', value: 4 },
];

const armorAbilities: ArmorAbility[] = [
  { kind: 'vitality', name: '生命', description: '最大HP +10', value: 10 },
  { kind: 'guard', name: '守護', description: '被ダメージ -1', value: 1 },
  { kind: 'fortress', name: '堅牢', description: '防御 +2', value: 2 },
];

interface WeaponDefinition {
  name: string;
  attackOffset: number;
  intrinsicAbility: WeaponAbility | null;
}

interface ArmorDefinition {
  name: string;
  defenseOffset: number;
  intrinsicAbility: ArmorAbility | null;
}

const weaponDefinitions: readonly WeaponDefinition[] = [
  { name: '鉄の剣', attackOffset: 0, intrinsicAbility: { kind: 'power', name: '鉄の力', description: '攻撃 +1', value: 1 } },
  { name: '山賊の剣', attackOffset: 0, intrinsicAbility: { kind: 'impact', name: '荒押し', description: 'ノックバック +18%', value: 1.18 } },
  { name: '古びた長剣', attackOffset: 0, intrinsicAbility: null },
  { name: '青鋼の剣', attackOffset: 1, intrinsicAbility: { kind: 'power', name: '青鋼', description: '攻撃 +2', value: 2 } },
  { name: "黒鉄の剣", attackOffset: 1, intrinsicAbility: { kind: "power", name: "黒鉄の力", description: "攻撃 +2", value: 2 } },
  { name: "錆喰いの剣", attackOffset: 0, intrinsicAbility: { kind: "leech", name: "錆喰い", description: "敵撃破時 HP +2", value: 2 } },
  { name: "洞窟刀", attackOffset: 0, intrinsicAbility: { kind: "impact", name: "岩返し", description: "ノックバック +18%", value: 1.18 } },
  { name: "月影の短剣", attackOffset: 0, intrinsicAbility: { kind: "power", name: "月影", description: "攻撃 +1", value: 1 } },
  { name: "火打ちの剣", attackOffset: 1, intrinsicAbility: { kind: "power", name: "火花", description: "攻撃 +2", value: 2 } },
  { name: "骨断ち", attackOffset: 1, intrinsicAbility: { kind: "impact", name: "骨砕き", description: "ノックバック +28%", value: 1.28 } },
  { name: "風切丸", attackOffset: 0, intrinsicAbility: { kind: "impact", name: "風切り", description: "ノックバック +22%", value: 1.22 } },
  { name: "泥濘の刃", attackOffset: 0, intrinsicAbility: { kind: "leech", name: "泥吸い", description: "敵撃破時 HP +2", value: 2 } },
  { name: "赤銅の長剣", attackOffset: 1, intrinsicAbility: { kind: "power", name: "赤銅の重み", description: "攻撃 +2", value: 2 } },
  { name: "白銀の小剣", attackOffset: 1, intrinsicAbility: { kind: "power", name: "白銀光", description: "攻撃 +2", value: 2 } },
  { name: "影縫い", attackOffset: 0, intrinsicAbility: { kind: "impact", name: "影留め", description: "ノックバック +20%", value: 1.2 } },
  { name: "雷鳴の剣", attackOffset: 2, intrinsicAbility: { kind: "power", name: "雷鳴", description: "攻撃 +3", value: 3 } },
  { name: "苔むす剣", attackOffset: 0, intrinsicAbility: { kind: "leech", name: "苔の息吹", description: "敵撃破時 HP +3", value: 3 } },
  { name: "深層の刃", attackOffset: 2, intrinsicAbility: { kind: "power", name: "深層圧", description: "攻撃 +3", value: 3 } },
  { name: "血煙丸", attackOffset: 1, intrinsicAbility: { kind: "leech", name: "血煙", description: "敵撃破時 HP +4", value: 4 } },
  { name: "岩砕き", attackOffset: 1, intrinsicAbility: { kind: "impact", name: "岩砕", description: "ノックバック +38%", value: 1.38 } },
  { name: "狩人の曲刀", attackOffset: 1, intrinsicAbility: { kind: "power", name: "狩人の勘", description: "攻撃 +2", value: 2 } },
  { name: "亡者の剣", attackOffset: 0, intrinsicAbility: { kind: "leech", name: "亡者喰い", description: "敵撃破時 HP +3", value: 3 } },
  { name: "星屑の剣", attackOffset: 2, intrinsicAbility: { kind: "power", name: "星屑", description: "攻撃 +3", value: 3 } },
  { name: "夜渡り", attackOffset: 1, intrinsicAbility: { kind: "impact", name: "夜駆け", description: "ノックバック +26%", value: 1.26 } },
  { name: "燐光剣", attackOffset: 1, intrinsicAbility: { kind: "power", name: "燐光", description: "攻撃 +2", value: 2 } },
  { name: "黒曜の刃", attackOffset: 2, intrinsicAbility: { kind: "impact", name: "黒曜衝", description: "ノックバック +42%", value: 1.42 } },
  { name: "朽王の剣", attackOffset: 2, intrinsicAbility: { kind: "leech", name: "朽王の徴収", description: "敵撃破時 HP +5", value: 5 } },
  { name: "竜骨剣", attackOffset: 3, intrinsicAbility: { kind: "power", name: "竜骨力", description: "攻撃 +4", value: 4 } },
  { name: "鉱夫の鉈", attackOffset: 0, intrinsicAbility: { kind: "impact", name: "採掘打ち", description: "ノックバック +24%", value: 1.24 } },
  { name: "迷宮の剣", attackOffset: 1, intrinsicAbility: { kind: "power", name: "迷宮慣れ", description: "攻撃 +2", value: 2 } },
  { name: "霧裂き", attackOffset: 1, intrinsicAbility: { kind: "impact", name: "霧裂", description: "ノックバック +30%", value: 1.3 } },
  { name: "紅蓮の短剣", attackOffset: 2, intrinsicAbility: { kind: "power", name: "紅蓮", description: "攻撃 +3", value: 3 } },
  { name: "氷脈の剣", attackOffset: 2, intrinsicAbility: { kind: "power", name: "氷脈", description: "攻撃 +3", value: 3 } },
  { name: "紫電の刃", attackOffset: 2, intrinsicAbility: { kind: "impact", name: "紫電衝", description: "ノックバック +36%", value: 1.36 } },
  { name: "鬼灯丸", attackOffset: 1, intrinsicAbility: { kind: "leech", name: "鬼灯吸い", description: "敵撃破時 HP +4", value: 4 } },
  { name: "夢喰い", attackOffset: 1, intrinsicAbility: { kind: "leech", name: "夢喰い", description: "敵撃破時 HP +4", value: 4 } },
  { name: "蟲狩りの剣", attackOffset: 1, intrinsicAbility: { kind: "power", name: "蟲狩り", description: "攻撃 +2", value: 2 } },
  { name: "蛇殺し", attackOffset: 1, intrinsicAbility: { kind: "impact", name: "蛇打ち", description: "ノックバック +30%", value: 1.3 } },
  { name: "蝙蝠切り", attackOffset: 0, intrinsicAbility: { kind: "power", name: "空裂き", description: "攻撃 +2", value: 2 } },
  { name: "晶砕き", attackOffset: 2, intrinsicAbility: { kind: "impact", name: "晶砕", description: "ノックバック +45%", value: 1.45 } },
  { name: "影子守", attackOffset: 1, intrinsicAbility: { kind: "leech", name: "影子守", description: "敵撃破時 HP +3", value: 3 } },
  { name: "断層剣", attackOffset: 2, intrinsicAbility: { kind: "impact", name: "断層衝", description: "ノックバック +40%", value: 1.4 } },
  { name: "墓守の剣", attackOffset: 1, intrinsicAbility: { kind: "leech", name: "墓守の息", description: "敵撃破時 HP +3", value: 3 } },
  { name: "祈り砕き", attackOffset: 2, intrinsicAbility: { kind: "power", name: "祈り砕き", description: "攻撃 +3", value: 3 } },
  { name: "灰冠の剣", attackOffset: 2, intrinsicAbility: { kind: "power", name: "灰冠", description: "攻撃 +3", value: 3 } },
  { name: "金喰いの刃", attackOffset: 0, intrinsicAbility: { kind: "leech", name: "金喰い", description: "敵撃破時 HP +2", value: 2 } },
  { name: "幽世の剣", attackOffset: 2, intrinsicAbility: { kind: "leech", name: "幽世吸い", description: "敵撃破時 HP +5", value: 5 } },
  { name: "月蝕刀", attackOffset: 3, intrinsicAbility: { kind: "power", name: "月蝕", description: "攻撃 +4", value: 4 } },
  { name: "黒薔薇", attackOffset: 1, intrinsicAbility: { kind: "leech", name: "黒薔薇", description: "敵撃破時 HP +4", value: 4 } },
  { name: "太古の剣", attackOffset: 3, intrinsicAbility: { kind: "impact", name: "太古の重圧", description: "ノックバック +45%", value: 1.45 } },
  { name: "深淵の牙", attackOffset: 3, intrinsicAbility: { kind: "power", name: "深淵牙", description: "攻撃 +4", value: 4 } },
  { name: "旅人の名剣", attackOffset: 1, intrinsicAbility: { kind: "power", name: "旅人の技", description: "攻撃 +2", value: 2 } },
  { name: "迷い星", attackOffset: 2, intrinsicAbility: { kind: "impact", name: "星流し", description: "ノックバック +34%", value: 1.34 } },
  { name: "終夜の剣", attackOffset: 3, intrinsicAbility: { kind: "leech", name: "終夜", description: "敵撃破時 HP +5", value: 5 } },
];

const armorDefinitions: readonly ArmorDefinition[] = [
  { name: '革の鎧', defenseOffset: 0, intrinsicAbility: { kind: 'vitality', name: '革の粘り', description: '最大HP +6', value: 6 } },
  { name: '鉄の胸当て', defenseOffset: 0, intrinsicAbility: { kind: 'guard', name: '鉄板', description: '被ダメージ -1', value: 1 } },
  { name: '探索者の鎧', defenseOffset: 0, intrinsicAbility: { kind: 'vitality', name: '探索慣れ', description: '最大HP +8', value: 8 } },
  { name: '青鋼の鎧', defenseOffset: 1, intrinsicAbility: { kind: 'fortress', name: '青鋼壁', description: '防御 +2', value: 2 } },
  { name: "黒革の鎧", defenseOffset: 0, intrinsicAbility: { kind: "vitality", name: "黒革の粘り", description: "最大HP +8", value: 8 } },
  { name: "錆鉄の鎧", defenseOffset: 1, intrinsicAbility: { kind: "fortress", name: "錆鉄板", description: "防御 +2", value: 2 } },
  { name: "苔衣", defenseOffset: 0, intrinsicAbility: { kind: "vitality", name: "苔の生命", description: "最大HP +10", value: 10 } },
  { name: "鉱夫の胸当て", defenseOffset: 1, intrinsicAbility: { kind: "guard", name: "坑道守り", description: "被ダメージ -1", value: 1 } },
  { name: "月影の外套", defenseOffset: 0, intrinsicAbility: { kind: "guard", name: "月影避け", description: "被ダメージ -1", value: 1 } },
  { name: "骨組み鎧", defenseOffset: 1, intrinsicAbility: { kind: "fortress", name: "骨組み", description: "防御 +2", value: 2 } },
  { name: "風除けのコート", defenseOffset: 0, intrinsicAbility: { kind: "vitality", name: "風耐え", description: "最大HP +8", value: 8 } },
  { name: "泥壁の鎧", defenseOffset: 1, intrinsicAbility: { kind: "guard", name: "泥壁", description: "被ダメージ -1", value: 1 } },
  { name: "赤銅の胸甲", defenseOffset: 1, intrinsicAbility: { kind: "fortress", name: "赤銅板", description: "防御 +2", value: 2 } },
  { name: "白銀の鎧", defenseOffset: 2, intrinsicAbility: { kind: "fortress", name: "白銀壁", description: "防御 +3", value: 3 } },
  { name: "影縫いの衣", defenseOffset: 0, intrinsicAbility: { kind: "vitality", name: "影の余命", description: "最大HP +10", value: 10 } },
  { name: "雷除け胴", defenseOffset: 1, intrinsicAbility: { kind: "guard", name: "雷除け", description: "被ダメージ -1", value: 1 } },
  { name: "深層探索服", defenseOffset: 1, intrinsicAbility: { kind: "vitality", name: "深層肺", description: "最大HP +12", value: 12 } },
  { name: "血染めの鎧", defenseOffset: 1, intrinsicAbility: { kind: "vitality", name: "血気", description: "最大HP +14", value: 14 } },
  { name: "岩殻の鎧", defenseOffset: 2, intrinsicAbility: { kind: "fortress", name: "岩殻", description: "防御 +3", value: 3 } },
  { name: "狩人の胴衣", defenseOffset: 0, intrinsicAbility: { kind: "guard", name: "身かわし", description: "被ダメージ -1", value: 1 } },
  { name: "亡者の鎧", defenseOffset: 1, intrinsicAbility: { kind: "vitality", name: "亡者の執念", description: "最大HP +12", value: 12 } },
  { name: "星屑の外套", defenseOffset: 1, intrinsicAbility: { kind: "guard", name: "星守り", description: "被ダメージ -1", value: 1 } },
  { name: "夜渡りの服", defenseOffset: 0, intrinsicAbility: { kind: "vitality", name: "夜歩き", description: "最大HP +9", value: 9 } },
  { name: "燐光の鎧", defenseOffset: 1, intrinsicAbility: { kind: "fortress", name: "燐光膜", description: "防御 +2", value: 2 } },
  { name: "黒曜の鎧", defenseOffset: 2, intrinsicAbility: { kind: "fortress", name: "黒曜壁", description: "防御 +4", value: 4 } },
  { name: "朽王の外套", defenseOffset: 1, intrinsicAbility: { kind: "guard", name: "朽王の庇護", description: "被ダメージ -2", value: 2 } },
  { name: "竜骨鎧", defenseOffset: 3, intrinsicAbility: { kind: "fortress", name: "竜骨壁", description: "防御 +4", value: 4 } },
  { name: "坑道作業服", defenseOffset: 0, intrinsicAbility: { kind: "vitality", name: "坑道慣れ", description: "最大HP +10", value: 10 } },
  { name: "迷宮騎士鎧", defenseOffset: 2, intrinsicAbility: { kind: "fortress", name: "迷宮守護", description: "防御 +3", value: 3 } },
  { name: "霧衣", defenseOffset: 0, intrinsicAbility: { kind: "guard", name: "霧隠れ", description: "被ダメージ -1", value: 1 } },
  { name: "紅蓮の胸甲", defenseOffset: 2, intrinsicAbility: { kind: "vitality", name: "紅蓮心", description: "最大HP +14", value: 14 } },
  { name: "氷脈の鎧", defenseOffset: 2, intrinsicAbility: { kind: "fortress", name: "氷脈壁", description: "防御 +3", value: 3 } },
  { name: "紫電の外套", defenseOffset: 1, intrinsicAbility: { kind: "guard", name: "紫電かわし", description: "被ダメージ -2", value: 2 } },
  { name: "鬼灯の鎧", defenseOffset: 1, intrinsicAbility: { kind: "vitality", name: "鬼灯命", description: "最大HP +13", value: 13 } },
  { name: "夢守りの衣", defenseOffset: 0, intrinsicAbility: { kind: "vitality", name: "夢守り", description: "最大HP +12", value: 12 } },
  { name: "蟲殻の鎧", defenseOffset: 1, intrinsicAbility: { kind: "fortress", name: "蟲殻", description: "防御 +2", value: 2 } },
  { name: "蛇革の胴衣", defenseOffset: 0, intrinsicAbility: { kind: "guard", name: "蛇抜け", description: "被ダメージ -1", value: 1 } },
  { name: "蝙蝠羽の外套", defenseOffset: 0, intrinsicAbility: { kind: "vitality", name: "夜翼", description: "最大HP +9", value: 9 } },
  { name: "晶殻鎧", defenseOffset: 2, intrinsicAbility: { kind: "fortress", name: "晶殻", description: "防御 +4", value: 4 } },
  { name: "影子守の衣", defenseOffset: 1, intrinsicAbility: { kind: "guard", name: "影守り", description: "被ダメージ -2", value: 2 } },
  { name: "断層の鎧", defenseOffset: 2, intrinsicAbility: { kind: "fortress", name: "断層壁", description: "防御 +3", value: 3 } },
  { name: "墓守の鎧", defenseOffset: 1, intrinsicAbility: { kind: "vitality", name: "墓守の執念", description: "最大HP +14", value: 14 } },
  { name: "祈祷師の法衣", defenseOffset: 0, intrinsicAbility: { kind: "vitality", name: "祈り", description: "最大HP +11", value: 11 } },
  { name: "灰冠の鎧", defenseOffset: 2, intrinsicAbility: { kind: "guard", name: "灰冠守り", description: "被ダメージ -2", value: 2 } },
  { name: "金継ぎの鎧", defenseOffset: 1, intrinsicAbility: { kind: "fortress", name: "金継ぎ", description: "防御 +3", value: 3 } },
  { name: "幽世の衣", defenseOffset: 1, intrinsicAbility: { kind: "vitality", name: "幽世命", description: "最大HP +15", value: 15 } },
  { name: "月蝕の鎧", defenseOffset: 2, intrinsicAbility: { kind: "guard", name: "月蝕守り", description: "被ダメージ -2", value: 2 } },
  { name: "黒薔薇のドレス", defenseOffset: 1, intrinsicAbility: { kind: "vitality", name: "黒薔薇命", description: "最大HP +14", value: 14 } },
  { name: "太古の甲冑", defenseOffset: 3, intrinsicAbility: { kind: "fortress", name: "太古壁", description: "防御 +4", value: 4 } },
  { name: "深淵の鎧", defenseOffset: 3, intrinsicAbility: { kind: "guard", name: "深淵守り", description: "被ダメージ -3", value: 3 } },
  { name: "旅人の外套", defenseOffset: 0, intrinsicAbility: { kind: "vitality", name: "旅慣れ", description: "最大HP +10", value: 10 } },
  { name: "迷い星の鎧", defenseOffset: 2, intrinsicAbility: { kind: "fortress", name: "星殻", description: "防御 +3", value: 3 } },
  { name: "終夜の外套", defenseOffset: 1, intrinsicAbility: { kind: "guard", name: "終夜守り", description: "被ダメージ -2", value: 2 } },
  { name: "王墓の甲冑", defenseOffset: 3, intrinsicAbility: { kind: "vitality", name: "王墓の命脈", description: "最大HP +18", value: 18 } },
];

export function createRandomItem(floor: number): Item {
  const roll = Math.random();
  if (roll < 0.36) return createWeapon(floor);
  if (roll < 0.72) return createArmor(floor);
  return createConsumable(floor);
}

function createWeapon(floor: number): WeaponItem {
  const tier = Math.min(3, Math.floor((floor - 1) / 3));
  const definition = weaponDefinitions[Math.floor(Math.random() * weaponDefinitions.length)] ?? weaponDefinitions[0]!;
  const attack = Math.max(1, 1 + tier + Math.floor(Math.random() * 3) + definition.attackOffset);
  const rarity = rarityForFloor(floor);

  return {
    id: `weapon-${nextItemId++}`,
    category: 'weapon',
    name: definition.name,
    rarity,
    attack,
    intrinsicAbility: definition.intrinsicAbility ? { ...definition.intrinsicAbility } : null,
    abilitySlots: createAbilitySlots(weaponAbilities, floor, rarity),
  };
}

function createArmor(floor: number): ArmorItem {
  const tier = Math.min(3, Math.floor((floor - 1) / 3));
  const definition = armorDefinitions[Math.floor(Math.random() * armorDefinitions.length)] ?? armorDefinitions[0]!;
  const defense = Math.max(1, 1 + tier + Math.floor(Math.random() * 2) + definition.defenseOffset);
  const rarity = rarityForFloor(floor);

  return {
    id: `armor-${nextItemId++}`,
    category: 'armor',
    name: definition.name,
    rarity,
    defense,
    intrinsicAbility: definition.intrinsicAbility ? { ...definition.intrinsicAbility } : null,
    abilitySlots: createAbilitySlots(armorAbilities, floor, rarity),
  };
}

function createConsumable(floor: number): ConsumableItem {
  const strong = floor >= 4 && Math.random() < 0.35;
  return {
    id: `item-${nextItemId++}`,
    category: 'consumable',
    name: strong ? '上級回復薬' : '回復薬',
    rarity: strong ? '上質' : '通常',
    effect: 'heal',
    heal: strong ? 45 : 25,
    description: strong ? 'HPを45回復する' : 'HPを25回復する',
  };
}

export function createHealingPotion(): ConsumableItem {
  return {
    id: `starter-heal-${nextItemId++}`,
    category: 'consumable',
    name: '回復薬',
    rarity: '通常',
    effect: 'heal',
    heal: 25,
    description: 'HPを25回復する',
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

function createAbilitySlots<T extends WeaponAbility | ArmorAbility>(
  pool: readonly T[],
  floor: number,
  rarity: BaseItem['rarity'],
): Array<T | null> {
  const slots: Array<T | null> = Array.from({ length: EQUIPMENT_SLOT_COUNT }, () => null);

  // 最低1つは能力を付ける。階層・レアリティに応じて2～3枠目が埋まることがある。
  let filled = 1;
  if (floor >= 3 || rarity !== '通常') filled += Math.random() < 0.55 ? 1 : 0;
  if (floor >= 7 || rarity === '希少') filled += Math.random() < 0.4 ? 1 : 0;

  for (let i = 0; i < filled && i < EQUIPMENT_SLOT_COUNT; i += 1) {
    const ability = pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
    slots[i] = ability ? { ...ability } as T : null;
  }
  return slots;
}


function rarityForFloor(floor: number): BaseItem['rarity'] {
  const roll = Math.random() + Math.min(0.25, floor * 0.015);
  if (roll > 1.05) return '希少';
  if (roll > 0.72) return '上質';
  return '通常';
}
