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

const weaponNames = ['鉄の剣', '山賊の剣', '古びた長剣', '青鋼の剣'];
const armorNames = ['革の鎧', '鉄の胸当て', '探索者の鎧', '青鋼の鎧'];

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

export function createRandomItem(floor: number): Item {
  const roll = Math.random();
  if (roll < 0.36) return createWeapon(floor);
  if (roll < 0.72) return createArmor(floor);
  return createConsumable(floor);
}

function createWeapon(floor: number): WeaponItem {
  const tier = Math.min(3, Math.floor((floor - 1) / 3));
  const name = weaponNames[Math.floor(Math.random() * weaponNames.length)] ?? '鉄の剣';
  const attack = 1 + tier + Math.floor(Math.random() * 3);
  const rarity = rarityForFloor(floor);

  return {
    id: `weapon-${nextItemId++}`,
    category: 'weapon',
    name,
    rarity,
    attack,
    // 古びた長剣はユーザー指定どおり固有能力なし。
    intrinsicAbility: name === '古びた長剣' ? null : rollIntrinsic(weaponAbilities, rarity),
    abilitySlots: createAbilitySlots(weaponAbilities, floor, rarity),
  };
}

function createArmor(floor: number): ArmorItem {
  const tier = Math.min(3, Math.floor((floor - 1) / 3));
  const name = armorNames[Math.floor(Math.random() * armorNames.length)] ?? '革の鎧';
  const defense = 1 + tier + Math.floor(Math.random() * 2);
  const rarity = rarityForFloor(floor);

  return {
    id: `armor-${nextItemId++}`,
    category: 'armor',
    name,
    rarity,
    defense,
    intrinsicAbility: rollIntrinsic(armorAbilities, rarity),
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

function rollIntrinsic<T extends WeaponAbility | ArmorAbility>(
  pool: readonly T[],
  rarity: BaseItem['rarity'],
): T | null {
  const chance = rarity === '希少' ? 0.55 : rarity === '上質' ? 0.28 : 0.08;
  if (Math.random() >= chance) return null;
  const ability = pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
  return ability ? { ...ability } as T : null;
}

function rarityForFloor(floor: number): BaseItem['rarity'] {
  const roll = Math.random() + Math.min(0.25, floor * 0.015);
  if (roll > 1.05) return '希少';
  if (roll > 0.72) return '上質';
  return '通常';
}
