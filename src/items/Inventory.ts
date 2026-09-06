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
