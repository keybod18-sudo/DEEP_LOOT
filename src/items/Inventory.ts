import type {
  ArmorAbility,
  ArmorItem,
  ConsumableItem,
  Item,
  ItemCategory,
  WeaponAbility,
  WeaponItem,
} from './Item';

const SLOT_COUNT = 8;

export class Inventory {
  readonly weapons: Array<WeaponItem | null> = Array.from({ length: SLOT_COUNT }, () => null);
  readonly armor: Array<ArmorItem | null> = Array.from({ length: SLOT_COUNT }, () => null);
  readonly consumables: Array<ConsumableItem | null> = Array.from({ length: SLOT_COUNT }, () => null);

  equippedWeaponId: string | null = null;
  equippedArmorId: string | null = null;

  add(item: Item): boolean {
    const slots = this.slotsFor(item.category);
    const index = slots.findIndex((slot) => slot === null);
    if (index < 0) return false;
    slots[index] = item as never;
    return true;
  }

  equipWeapon(index: number): void {
    const item = this.weapons[index];
    if (item) this.equippedWeaponId = item.id;
  }

  equipArmor(index: number): void {
    const item = this.armor[index];
    if (item) this.equippedArmorId = item.id;
  }

  clear(): void {
    this.weapons.fill(null);
    this.armor.fill(null);
    this.consumables.fill(null);
    this.equippedWeaponId = null;
    this.equippedArmorId = null;
  }

  getConsumable(index: number): ConsumableItem | null {
    return this.consumables[index] ?? null;
  }

  takeConsumable(index: number): ConsumableItem | null {
    const item = this.consumables[index];
    if (!item) return null;
    this.consumables[index] = null;
    return item;
  }

  get equippedWeapon(): WeaponItem | null {
    return this.weapons.find((item) => item?.id === this.equippedWeaponId) ?? null;
  }

  get equippedArmor(): ArmorItem | null {
    return this.armor.find((item) => item?.id === this.equippedArmorId) ?? null;
  }

  get attackBonus(): number {
    const weapon = this.equippedWeapon;
    if (!weapon) return 0;
    return weapon.attack + this.weaponAbilities(weapon)
      .filter((ability) => ability.kind === 'power')
      .reduce((sum, ability) => sum + ability.value, 0);
  }

  get defenseBonus(): number {
    const armor = this.equippedArmor;
    if (!armor) return 0;
    return armor.defense + this.armorAbilities(armor)
      .filter((ability) => ability.kind === 'fortress')
      .reduce((sum, ability) => sum + ability.value, 0);
  }

  get flatDamageReduction(): number {
    const armor = this.equippedArmor;
    if (!armor) return 0;
    return this.armorAbilities(armor)
      .filter((ability) => ability.kind === 'guard')
      .reduce((sum, ability) => sum + ability.value, 0);
  }

  get maxHpBonus(): number {
    const armor = this.equippedArmor;
    if (!armor) return 0;
    return this.armorAbilities(armor)
      .filter((ability) => ability.kind === 'vitality')
      .reduce((sum, ability) => sum + ability.value, 0);
  }

  get knockbackMultiplier(): number {
    const weapon = this.equippedWeapon;
    if (!weapon) return 1;
    return this.weaponAbilities(weapon)
      .filter((ability) => ability.kind === 'impact')
      .reduce((multiplier, ability) => multiplier * ability.value, 1);
  }

  get killHeal(): number {
    const weapon = this.equippedWeapon;
    if (!weapon) return 0;
    return this.weaponAbilities(weapon)
      .filter((ability) => ability.kind === 'leech')
      .reduce((sum, ability) => sum + ability.value, 0);
  }

  get criticalChance(): number {
    const weapon = this.equippedWeapon;
    if (!weapon) return 0;
    return Math.min(0.45, this.weaponAbilities(weapon)
      .filter((ability) => ability.kind === 'critical')
      .reduce((sum, ability) => sum + ability.value, 0));
  }

  get criticalMultiplier(): number {
    const weapon = this.equippedWeapon;
    if (!weapon) return 1;
    return this.weaponAbilities(weapon)
      .filter((ability) => ability.kind === 'critical')
      .reduce((best, ability) => Math.max(best, ability.effect?.multiplier ?? 1.6), 1);
  }

  get goldFindBonus(): number {
    const weapon = this.equippedWeapon;
    if (!weapon) return 0;
    return this.weaponAbilities(weapon)
      .filter((ability) => ability.kind === 'gold')
      .reduce((sum, ability) => sum + ability.value, 0);
  }

  get moveSpeedMultiplier(): number {
    const armor = this.equippedArmor;
    if (!armor) return 1;
    return this.armorAbilities(armor).reduce((multiplier, ability) => {
      if (ability.kind === 'speed') return multiplier * ability.value;
      if (ability.effect?.type === 'moveSpeed') return multiplier * (ability.effect.multiplier ?? 1);
      return multiplier;
    }, 1);
  }

  get regenAmount(): number {
    const armor = this.equippedArmor;
    if (!armor) return 0;
    return this.armorAbilities(armor).reduce((sum, ability) => {
      if (ability.kind === 'regen') return sum + ability.value;
      if (ability.effect?.type === 'regen') return sum + (ability.effect.amount ?? 0);
      return sum;
    }, 0);
  }

  get statusResistance(): number {
    const armor = this.equippedArmor;
    if (!armor) return 0;
    const resistances = this.armorAbilities(armor).map((ability) => {
      if (ability.kind === 'resist') return ability.value;
      if (ability.effect?.type === 'statusResist') return ability.effect.resistance ?? 0;
      return 0;
    });
    return Math.min(0.8, 1 - resistances.reduce((remaining, resistance) =>
      remaining * (1 - Math.max(0, Math.min(1, resistance))), 1));
  }

  getSlots(category: ItemCategory): ReadonlyArray<Item | null> {
    return this.slotsFor(category);
  }

  private weaponAbilities(item: WeaponItem): WeaponAbility[] {
    return [item.intrinsicAbility, ...item.abilitySlots]
      .filter((ability): ability is WeaponAbility => ability !== null);
  }

  private armorAbilities(item: ArmorItem): ArmorAbility[] {
    return [item.intrinsicAbility, ...item.abilitySlots]
      .filter((ability): ability is ArmorAbility => ability !== null);
  }

  private slotsFor(category: ItemCategory): Array<Item | null> {
    if (category === 'weapon') return this.weapons;
    if (category === 'armor') return this.armor;
    return this.consumables;
  }
}
