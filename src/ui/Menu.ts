import type { Inventory } from '../items/Inventory';
import type {
  ArmorAbility,
  ArmorItem,
  ConsumableItem,
  Item,
  ItemCategory,
  WeaponAbility,
  WeaponItem,
} from '../items/Item';

export interface MenuStatus {
  floor: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  gold: number;
}

export interface MenuActions {
  onWeapon: (index: number) => void;
  onArmor: (index: number) => void;
  onConsumable: (index: number) => void;
  onClose: () => void;
}

export class MenuUI {
  private openState = false;

  constructor(
    private readonly root: HTMLElement,
    private readonly actions: MenuActions,
  ) {
    this.root.addEventListener('click', this.onClick);
  }

  get isOpen(): boolean {
    return this.openState;
  }

  setOpen(open: boolean): void {
    this.openState = open;
    this.root.classList.toggle('is-open', open);
    this.root.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  render(status: MenuStatus, inventory: Inventory): void {
    const statusEl = this.root.querySelector<HTMLElement>('#menu-status');
    const weaponEl = this.root.querySelector<HTMLElement>('#weapon-slots');
    const armorEl = this.root.querySelector<HTMLElement>('#armor-slots');
    const itemEl = this.root.querySelector<HTMLElement>('#item-slots');
    if (!statusEl || !weaponEl || !armorEl || !itemEl) return;

    statusEl.innerHTML = `
      <div><span>階層</span><b>${status.floor}</b></div>
      <div><span>HP</span><b>${status.hp} / ${status.maxHp}</b></div>
      <div><span>攻撃</span><b>${status.attack}</b></div>
      <div><span>防御</span><b>${status.defense}</b></div>
      <div><span>所持金</span><b>${status.gold}G</b></div>
      <div><span>武器</span><b>${escapeHtml(inventory.equippedWeapon?.name ?? 'なし')}</b></div>
      <div><span>防具</span><b>${escapeHtml(inventory.equippedArmor?.name ?? 'なし')}</b></div>
    `;

    weaponEl.innerHTML = equipmentListHtml('weapon', inventory.getSlots('weapon'), inventory.equippedWeaponId);
    armorEl.innerHTML = equipmentListHtml('armor', inventory.getSlots('armor'), inventory.equippedArmorId);
    itemEl.innerHTML = consumableSlotsHtml(inventory.getSlots('consumable'));

    updateGroupCount(this.root, 'weapon', inventory.getSlots('weapon'));
    updateGroupCount(this.root, 'armor', inventory.getSlots('armor'));
    updateGroupCount(this.root, 'consumable', inventory.getSlots('consumable'));
  }

  private readonly onClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (target.closest('#menu-close')) {
      this.actions.onClose();
      return;
    }
    const slot = target.closest<HTMLElement>('[data-slot-index][data-category]');
    if (!slot) return;
    const index = Number(slot.dataset.slotIndex);
    const category = slot.dataset.category as ItemCategory;
    if (!Number.isInteger(index)) return;
    if (category === 'weapon') this.actions.onWeapon(index);
    if (category === 'armor') this.actions.onArmor(index);
    if (category === 'consumable') this.actions.onConsumable(index);
  };
}

function equipmentListHtml(
  category: 'weapon' | 'armor',
  slots: ReadonlyArray<Item | null>,
  equippedId: string | null,
): string {
  return slots.map((item, index) => {
    if (!item) {
      const label = category === 'weapon' ? '空き武器枠' : '空き防具枠';
      return `<button class="equipment-entry empty-equipment" type="button" data-category="${category}" data-slot-index="${index}" disabled>
        <span class="inventory-slot-index">所持枠 ${index + 1}</span>
        <span class="empty-equipment-label">＋ ${label}</span>
      </button>`;
    }

    if (category === 'weapon' && item.category === 'weapon') {
      return weaponCardHtml(item, index, item.id === equippedId);
    }
    if (category === 'armor' && item.category === 'armor') {
      return armorCardHtml(item, index, item.id === equippedId);
    }
    return '';
  }).join('');
}

function weaponCardHtml(item: WeaponItem, index: number, equipped: boolean): string {
  return `<button class="equipment-entry${equipped ? ' equipped' : ''}" type="button" data-category="weapon" data-slot-index="${index}">
    <span class="inventory-slot-index">所持枠 ${index + 1}</span>
    <span class="equipment-name">${escapeHtml(item.name)}</span>
    <span class="equipment-summary">
      <span class="summary-chip">攻撃 +${item.attack}</span>
      <span class="summary-chip rarity">レア度 ${escapeHtml(designRarityFor(item.name))}</span>
      <span class="summary-chip intrinsic">固有能力 ${item.intrinsicAbility ? escapeHtml(item.intrinsicAbility.description) : 'なし'}</span>
    </span>
    ${equipmentPreviewHtml(item)}
    ${equipped ? '<span class="equipped-mark">装備中</span>' : ''}
    <span class="ability-slot-grid">${abilitySlotsHtml(item.abilitySlots)}</span>
  </button>`;
}

function armorCardHtml(item: ArmorItem, index: number, equipped: boolean): string {
  return `<button class="equipment-entry${equipped ? ' equipped' : ''}" type="button" data-category="armor" data-slot-index="${index}">
    <span class="inventory-slot-index">所持枠 ${index + 1}</span>
    <span class="equipment-name">${escapeHtml(item.name)}</span>
    <span class="equipment-summary">
      <span class="summary-chip">防御 +${item.defense}</span>
      <span class="summary-chip rarity">レア度 ${escapeHtml(designRarityFor(item.name))}</span>
      <span class="summary-chip intrinsic">固有能力 ${item.intrinsicAbility ? escapeHtml(item.intrinsicAbility.description) : 'なし'}</span>
    </span>
    ${equipmentPreviewHtml(item)}
    ${equipped ? '<span class="equipped-mark">装備中</span>' : ''}
    <span class="ability-slot-grid">${abilitySlotsHtml(item.abilitySlots)}</span>
  </button>`;
}

function abilitySlotsHtml(slots: ReadonlyArray<WeaponAbility | ArmorAbility | null>): string {
  return slots.map((ability, index) => {
    if (!ability) {
      return `<span class="ability-slot empty"><b>${index + 1}</b><span>＋ 空き</span></span>`;
    }
    return `<span class="ability-slot filled"><b>${index + 1}</b><span>${escapeHtml(ability.description)}</span></span>`;
  }).join('');
}

function consumableSlotsHtml(slots: ReadonlyArray<Item | null>): string {
  return slots.map((item, index) => {
    if (!item) {
      return `<button class="item-slot empty" type="button" data-category="consumable" data-slot-index="${index}" disabled><span class="slot-index">${index + 1}</span><span>＋ 空き</span></button>`;
    }
    if (item.category !== 'consumable') return '';
    return consumableCardHtml(item, index);
  }).join('');
}

function consumableCardHtml(item: ConsumableItem, index: number): string {
  return `<button class="item-slot" type="button" data-category="consumable" data-slot-index="${index}">
    <span class="slot-index">${index + 1}</span>
    <strong>${escapeHtml(item.name)}</strong>
    <small>${escapeHtml(item.description)}</small>
    <em>クリックで使用</em>
  </button>`;
}

function updateGroupCount(root: HTMLElement, category: ItemCategory, slots: ReadonlyArray<Item | null>): void {
  const used = slots.filter((item) => item !== null).length;
  const header = root.querySelector<HTMLElement>(`[data-inventory-header="${category}"]`);
  if (!header) return;
  header.textContent = `${used} / 8　空き ${8 - used}`;
}


const FIXED_DESIGN_RARITY: Record<string, string> = {"鉄の剣":"通常","山賊の剣":"通常","古びた長剣":"通常","青鋼の剣":"上質","黒鉄の剣":"上質","錆喰いの剣":"上質","洞窟刀":"通常","月影の短剣":"希少","火打ちの剣":"上質","骨断ち":"上質","風切丸":"上質","泥濘の刃":"通常","赤銅の長剣":"上質","白銀の小剣":"希少","影縫い":"希少","雷鳴の剣":"希少","苔むす剣":"上質","深層の刃":"希少","血煙丸":"希少","岩砕き":"希少","狩人の曲刀":"上質","亡者の剣":"希少","星屑の剣":"希少","夜渡り":"希少","燐光剣":"上質","黒曜の刃":"希少","朽王の剣":"希少","竜骨剣":"激レア","鉱夫の鉈":"上質","迷宮の剣":"希少","霧裂き":"上質","紅蓮の短剣":"希少","氷脈の剣":"希少","紫電の刃":"希少","鬼灯丸":"希少","夢喰い":"希少","蟲狩りの剣":"上質","蛇殺し":"上質","蝙蝠切り":"上質","晶砕き":"希少","影子守":"激レア","断層剣":"希少","墓守の剣":"希少","祈り砕き":"希少","灰冠の剣":"希少","金喰いの刃":"希少","幽世の剣":"激レア","月蝕刀":"激レア","黒薔薇":"激レア","太古の剣":"激レア","深淵の牙":"激レア","旅人の名剣":"希少","迷い星":"激レア","終夜の剣":"激レア","革の鎧":"通常","鉄の胸当て":"通常","探索者の鎧":"上質","青鋼の鎧":"上質","黒革の鎧":"通常","錆鉄の鎧":"通常","苔衣":"上質","鉱夫の胸当て":"上質","月影の外套":"激レア","骨組み鎧":"上質","風除けのコート":"希少","泥壁の鎧":"上質","赤銅の胸甲":"上質","白銀の鎧":"希少","影縫いの衣":"激レア","雷除け胴":"希少","深層探索服":"希少","血染めの鎧":"希少","岩殻の鎧":"希少","狩人の胴衣":"上質","亡者の鎧":"希少","星屑の外套":"希少","夜渡りの服":"伝説級","燐光の鎧":"希少","黒曜の鎧":"希少","朽王の外套":"希少","竜骨鎧":"激レア","坑道作業服":"上質","迷宮騎士鎧":"希少","霧衣":"希少","紅蓮の胸甲":"希少","氷脈の鎧":"希少","紫電の外套":"希少","鬼灯の鎧":"希少","夢守りの衣":"激レア","蟲殻の鎧":"上質","蛇革の胴衣":"希少","蝙蝠羽の外套":"伝説級","晶殻鎧":"激レア","影子守の衣":"激レア","断層の鎧":"希少","墓守の鎧":"希少","祈祷師の法衣":"激レア","灰冠の鎧":"希少","金継ぎの鎧":"伝説級","幽世の衣":"激レア","月蝕の鎧":"伝説級","黒薔薇のドレス":"激レア","太古の甲冑":"伝説級","深淵の鎧":"伝説級","旅人の外套":"激レア","迷い星の鎧":"激レア","終夜の外套":"激レア","王墓の甲冑":"伝説級"};

function designRarityFor(name: string): string {
  return FIXED_DESIGN_RARITY[name] ?? '通常';
}

function equipmentPreviewSeed(name: string): number {
  let value = 2166136261;
  for (let index = 0; index < name.length; index += 1) {
    value ^= name.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function previewPalette(name: string, rarity: string): { metal: string; glow: string; shade: string; accent: string; border: string; bg: string } {
  let metal = '#c9cdd5';
  let glow = '#e6c77f';
  let shade = '#313a4d';
  let accent = '#78c7ff';

  if (/火|炎|紅蓮|鬼灯/.test(name)) { metal = '#ffd2a0'; glow = '#ff7f49'; shade = '#6c2b20'; accent = '#ffe5a6'; }
  else if (/氷|霜|雪|凍/.test(name)) { metal = '#d9f5ff'; glow = '#7ce8ff'; shade = '#235b77'; accent = '#ffffff'; }
  else if (/月|影|夜|幽|夢/.test(name)) { metal = '#cbc4ff'; glow = '#9c82ff'; shade = '#2e2452'; accent = '#ffeaaa'; }
  else if (/光|聖|白銀|祈/.test(name)) { metal = '#fff0c9'; glow = '#fff18b'; shade = '#756a3f'; accent = '#ffffff'; }
  else if (/毒|苔|蟲|蛇/.test(name)) { metal = '#c5ee9d'; glow = '#6fea79'; shade = '#28523a'; accent = '#efffc4'; }
  else if (/雷|紫電/.test(name)) { metal = '#f1e78c'; glow = '#f7d62f'; shade = '#695817'; accent = '#fffbe2'; }
  else if (/骨|骸|墓/.test(name)) { metal = '#e9e1cd'; glow = '#d2a58d'; shade = '#625b51'; accent = '#fffef5'; }
  else if (/黒|深淵|呪|朽/.test(name)) { metal = '#938eb4'; glow = '#c76cff'; shade = '#201a34'; accent = '#f0d8ff'; }
  else if (/青鋼|蒼/.test(name)) { metal = '#b9dcff'; glow = '#65b5ff'; shade = '#224b71'; accent = '#edf9ff'; }
  else if (/赤銅|朱/.test(name)) { metal = '#e2b89a'; glow = '#d36346'; shade = '#67392c'; accent = '#ffe3d2'; }

  const border =
    rarity === '伝説級' ? 'rgba(255,214,84,.76)' :
    rarity === '激レア' ? 'rgba(197,118,255,.72)' :
    rarity === '希少' ? 'rgba(80,211,255,.60)' :
    rarity === '上質' ? 'rgba(146,201,255,.48)' :
    'rgba(121,149,190,.34)';
  const bg =
    rarity === '伝説級' ? 'linear-gradient(135deg,#1b1609,#4b3410)' :
    rarity === '激レア' ? 'linear-gradient(135deg,#171021,#3d205a)' :
    'linear-gradient(135deg,#0f1621,#202c3b)';

  return { metal, glow, shade, accent, border, bg };
}

function weaponPreviewMotif(name: string): string {
  if (/短剣/.test(name)) return 'dagger';
  if (/刀|丸/.test(name)) return 'katana';
  if (/槍/.test(name)) return 'spear';
  if (/斧/.test(name)) return 'axe';
  if (/弓/.test(name)) return 'bow';
  if (/杖/.test(name)) return 'staff';
  if (/鎌/.test(name)) return 'scythe';
  if (/爪|牙/.test(name)) return 'claw';
  return 'sword';
}

function armorPreviewMotif(name: string): string {
  if (/外套|マント/.test(name)) return 'cloak';
  if (/衣|法衣|ローブ/.test(name)) return 'robe';
  if (/胸当て/.test(name)) return 'breastplate';
  return 'armor';
}

function equipmentPreviewHtml(item: WeaponItem | ArmorItem): string {
  const rarity = item.designRarity ?? item.rarity ?? designRarityFor(item.name);
  const palette = previewPalette(item.name, rarity);
  const seed = equipmentPreviewSeed(item.name);
  const label = escapeHtml(item.name);
  const abilityName = escapeHtml(item.intrinsicAbility?.name ?? '固有能力なし');
  const ability = escapeHtml(item.intrinsicAbility?.description ?? '固有能力なし');
  const statLabel = item.category === 'weapon' ? '攻撃力' : '防御力';
  const statValue = item.category === 'weapon' ? item.attack : item.defense;
  const weaponMotif = item.category === 'weapon' ? weaponPreviewMotif(item.name) : '';
  const armorMotif = item.category === 'armor' ? armorPreviewMotif(item.name) : '';

  const rarityAura =
    rarity === '伝説級' ? 'rgba(255,205,76,.88)' :
    rarity === '激レア' ? 'rgba(195,112,255,.86)' :
    rarity === '希少' ? 'rgba(96,214,255,.78)' :
    rarity === '上質' ? 'rgba(166,204,255,.62)' :
    'rgba(160,170,190,.36)';

  const themeParts: string[] = [];
  const name = item.name;
  if (/月|月蝕/.test(name)) themeParts.push(`<path d="M44 42 A30 30 0 1 0 77 86 A22 22 0 1 1 44 42 Z" fill="rgba(164,128,255,.26)" stroke="rgba(225,214,255,.55)" stroke-width="2"/>`);
  if (/影|夜|幽|夢|深淵|終夜/.test(name)) themeParts.push(`<path d="M28 118 C44 94 67 110 85 91 C101 74 122 81 154 52" fill="none" stroke="rgba(110,66,185,.42)" stroke-width="6" stroke-linecap="round"/><ellipse cx="98" cy="78" rx="62" ry="34" fill="rgba(44,18,76,.26)"/>`);
  if (/火|炎|紅蓮|鬼灯/.test(name)) themeParts.push(`<path d="M44 118 C35 99 53 91 46 72 C64 79 69 90 60 107 C78 96 86 111 78 126" fill="rgba(255,98,44,.22)" stroke="rgba(255,162,92,.58)" stroke-width="2"/><path d="M141 104 C131 88 147 80 140 66 C155 73 160 86 152 102" fill="rgba(255,129,61,.18)" stroke="rgba(255,191,102,.42)" stroke-width="2"/>`);
  if (/氷|霜|雪|凍/.test(name)) themeParts.push(`<g fill="rgba(175,235,255,.22)" stroke="rgba(225,251,255,.62)" stroke-width="1.4"><path d="M38 44 L47 61 L37 75 L28 58 Z"/><path d="M145 39 L154 55 L145 70 L136 53 Z"/><path d="M124 104 L133 119 L124 132 L116 118 Z"/></g>`);
  if (/雷|紫電/.test(name)) themeParts.push(`<path d="M35 37 L56 62 L47 62 L62 88 L50 84 L63 116" fill="none" stroke="rgba(255,225,96,.76)" stroke-width="4" stroke-linejoin="bevel" filter="url(#glow)"/>`);
  if (/苔|蟲|蛇/.test(name)) themeParts.push(`<path d="M34 116 C48 98 58 119 74 101 C91 82 108 104 122 89" fill="none" stroke="rgba(92,214,112,.44)" stroke-width="4" stroke-linecap="round"/>`);
  if (/骨|骸|墓|竜骨/.test(name)) themeParts.push(`<path d="M35 113 L56 95 M35 95 L56 113 M136 47 L154 62 M154 47 L137 63" stroke="rgba(235,226,207,.48)" stroke-width="5" stroke-linecap="round"/>`);
  if (/星|燐光|迷い星/.test(name)) themeParts.push(`<g fill="rgba(255,243,165,.76)" filter="url(#glow)"><path d="M43 45 L46 53 L55 56 L46 59 L43 68 L40 59 L31 56 L40 53 Z"/><path d="M145 75 L148 82 L155 85 L148 88 L145 95 L142 88 L135 85 L142 82 Z"/></g>`);
  if (/血|黒薔薇/.test(name)) themeParts.push(`<path d="M39 43 C54 51 58 63 54 76 C49 90 53 97 47 111" fill="none" stroke="rgba(176,25,55,.46)" stroke-width="5" stroke-linecap="round"/>`);
  if (/晶|黒曜/.test(name)) themeParts.push(`<g fill="rgba(166,228,255,.18)" stroke="rgba(216,243,255,.56)" stroke-width="1.4"><path d="M37 40 L47 30 L57 44 L50 60 L35 56 Z"/><path d="M143 97 L154 86 L161 99 L154 113 L140 108 Z"/></g>`);
  if (/霧/.test(name)) themeParts.push(`<path d="M26 107 C46 94 64 110 85 100 C107 88 125 106 157 94" fill="none" stroke="rgba(220,232,240,.2)" stroke-width="10" stroke-linecap="round"/>`);
  if (/竜|太古|王墓|灰冠/.test(name)) themeParts.push(`<path d="M39 48 C47 35 58 33 66 42 C55 40 49 48 52 58 C45 57 41 53 39 48 Z" fill="rgba(216,182,118,.28)" stroke="rgba(247,221,171,.45)" stroke-width="2"/>`);
  if (/金継ぎ|金喰い/.test(name)) themeParts.push(`<path d="M36 111 L62 86 L75 100 L95 76 L112 92 L146 58" fill="none" stroke="rgba(255,216,96,.58)" stroke-width="3" filter="url(#glow)"/>`);
  if (/蝙蝠/.test(name)) themeParts.push(`<path d="M34 56 C47 43 58 44 69 55 L61 61 L69 69 C57 65 47 68 34 81 C39 68 39 66 34 56 Z" fill="rgba(95,54,135,.34)" stroke="rgba(157,103,209,.44)" stroke-width="1.5"/>`);

  const abilityAccent =
    /移動速度/.test(ability) ? `<path d="M31 79 H54 M38 70 H61 M28 89 H48" stroke="${palette.accent}" stroke-width="2.5" opacity=".72"/>` :
    /自動回復|HP/.test(ability) ? `<path d="M146 42 V61 M136 51.5 H156" stroke="rgba(132,255,161,.68)" stroke-width="5" stroke-linecap="round"/>` :
    /完全無効|耐性|状態異常/.test(ability) ? `<path d="M141 36 L155 42 V55 C155 67 148 74 141 78 C134 74 127 67 127 55 V42 Z" fill="rgba(116,205,255,.14)" stroke="rgba(167,230,255,.58)" stroke-width="2"/>` :
    /追撃|魔法|ファイア|フリーズ|星弾|魔弾/.test(ability) ? `<circle cx="146" cy="50" r="10" fill="rgba(255,239,146,.18)" stroke="rgba(255,243,178,.58)" stroke-width="2" filter="url(#glow)"/>` :
    '';

  let art = '';
  if (item.category === 'weapon') {
    if (weaponMotif === 'dagger') {
      art = `<g transform="translate(96 79) rotate(-26)" filter="url(#shadow)"><rect x="-84" y="-5" width="18" height="10" rx="3" fill="${palette.shade}"/><rect x="-67" y="-8" width="10" height="16" rx="3" fill="${palette.glow}" opacity=".82"/><path d="M-56 -5 H18 L74 0 L18 5 H-56 Z" fill="${palette.metal}" stroke="${palette.accent}" stroke-width="1.7"/><path d="M18 -5 L73 0 L18 5 Z" fill="${palette.glow}" opacity=".58"/></g>`;
    } else if (weaponMotif === 'katana') {
      art = `<g transform="translate(95 79) rotate(-18)" filter="url(#shadow)"><path d="M-74 7 Q-25 -8 53 -5 Q63 -4 82 0 Q64 6 53 7 Q-25 12 -74 7 Z" fill="${palette.metal}" stroke="${palette.accent}" stroke-width="1.7"/><path d="M-72 5 Q-20 -6 55 -4" fill="none" stroke="rgba(255,255,255,.62)" stroke-width="2"/><rect x="-95" y="-6" width="20" height="12" rx="3" fill="${palette.shade}"/><rect x="-113" y="-5" width="18" height="10" rx="3" fill="${palette.glow}"/><path d="M-78 -10 L-68 0 L-78 10 L-88 0 Z" fill="${palette.accent}" opacity=".72"/></g>`;
    } else if (weaponMotif === 'spear') {
      art = `<g transform="translate(96 79) rotate(-17)" filter="url(#shadow)"><rect x="-96" y="-4" width="154" height="8" rx="4" fill="${palette.shade}" stroke="rgba(0,0,0,.55)" stroke-width="2"/><path d="M56 0 L90 -15 L79 0 L90 15 Z" fill="${palette.metal}" stroke="${palette.accent}" stroke-width="1.5"/><path d="M48 -9 L61 0 L48 9 Z" fill="${palette.glow}" opacity=".7"/></g>`;
    } else if (weaponMotif === 'axe') {
      art = `<g transform="translate(96 80) rotate(-15)" filter="url(#shadow)"><rect x="-7" y="-62" width="14" height="119" rx="5" fill="${palette.shade}" stroke="rgba(0,0,0,.58)" stroke-width="2"/><path d="M6 -44 C46 -60 63 -21 49 7 C36 26 21 32 6 27 Z" fill="${palette.metal}" stroke="${palette.accent}" stroke-width="1.8"/><path d="M-4 -42 C-35 -55 -51 -21 -39 7 C-29 22 -17 28 -4 25 Z" fill="${palette.glow}" opacity=".7" stroke="${palette.accent}" stroke-width="1.2"/></g>`;
    } else if (weaponMotif === 'bow') {
      art = `<g transform="translate(96 78) rotate(-7)" filter="url(#shadow)"><path d="M-38 -59 C36 -30 36 30 -38 59" fill="none" stroke="${palette.metal}" stroke-width="11" stroke-linecap="round"/><path d="M31 -55 C-43 -24 -43 24 31 55" fill="none" stroke="${palette.shade}" stroke-width="8" stroke-linecap="round"/><line x1="-38" y1="-59" x2="31" y2="55" stroke="${palette.accent}" stroke-width="2.2"/><line x1="-16" y1="-8" x2="60" y2="-8" stroke="${palette.glow}" stroke-width="4"/><path d="M60 -8 L47 -15 L51 -8 L47 -1 Z" fill="${palette.glow}"/></g>`;
    } else if (weaponMotif === 'staff') {
      art = `<g transform="translate(96 81) rotate(-14)" filter="url(#shadow)"><rect x="-8" y="-63" width="16" height="126" rx="7" fill="${palette.shade}" stroke="rgba(0,0,0,.6)" stroke-width="2"/><circle cx="0" cy="-73" r="24" fill="rgba(255,255,255,.04)" stroke="${palette.metal}" stroke-width="4"/><circle cx="0" cy="-73" r="13" fill="${palette.glow}" stroke="${palette.accent}" stroke-width="2" filter="url(#glow)"/><path d="M-24 -67 C-44 -74 -45 -93 -25 -103 M24 -67 C44 -74 45 -93 25 -103" fill="none" stroke="${palette.metal}" stroke-width="5" stroke-linecap="round"/></g>`;
    } else if (weaponMotif === 'scythe') {
      art = `<g transform="translate(96 82) rotate(-14)" filter="url(#shadow)"><rect x="-7" y="-62" width="14" height="121" rx="5" fill="${palette.shade}"/><path d="M3 -54 C64 -74 89 -31 80 5 C54 -8 29 -10 3 3 Z" fill="${palette.metal}" stroke="${palette.accent}" stroke-width="1.8"/><path d="M16 -45 C47 -49 63 -35 67 -18" fill="none" stroke="${palette.glow}" stroke-width="2.5"/></g>`;
    } else if (weaponMotif === 'claw') {
      art = `<g transform="translate(90 79) rotate(-8)" filter="url(#shadow)"><path d="M-45 19 C-15 -30 27 -46 73 -31 C34 -18 7 5 -10 34 Z" fill="${palette.shade}" stroke="${palette.accent}" stroke-width="1.4"/><path d="M-20 21 C0 -30 38 -52 75 -43 C50 -24 29 4 21 36 Z" fill="${palette.metal}" stroke="${palette.accent}" stroke-width="1.4"/><path d="M10 22 C33 -22 61 -36 88 -31 C70 -12 58 9 52 36 Z" fill="${palette.glow}" opacity=".76"/></g>`;
    } else {
      art = `<g transform="translate(96 79) rotate(-21)" filter="url(#shadow)"><rect x="-88" y="-7" width="25" height="14" rx="5" fill="${palette.shade}" stroke="rgba(0,0,0,.55)" stroke-width="2"/><rect x="-64" y="-10" width="12" height="20" rx="4" fill="${palette.glow}" opacity=".82"/><path d="M-52 -7 H42 L86 0 L42 7 H-52 Z" fill="${palette.metal}" stroke="${palette.accent}" stroke-width="1.8"/><path d="M-46 -4 H42 L77 0 L42 2 H-46 Z" fill="rgba(255,255,255,.42)"/><path d="M42 -5 L85 0 L42 5 Z" fill="${palette.glow}" opacity=".64"/></g>`;
    }
  } else {
    if (armorMotif === 'cloak') {
      art = `<g transform="translate(96 80)" filter="url(#shadow)"><path d="M0 -59 C31 -59 51 -43 55 -13 C60 31 33 56 0 68 C-33 56 -60 31 -55 -13 C-51 -43 -31 -59 0 -59 Z" fill="${palette.shade}" stroke="${palette.accent}" stroke-width="2"/><path d="M-21 -49 C-7 -24 -9 29 -27 54 C-44 36 -50 13 -45 -16 C-42 -31 -33 -43 -21 -49 Z" fill="${palette.metal}" opacity=".92"/><path d="M21 -49 C7 -24 9 29 27 54 C44 36 50 13 45 -16 C42 -31 33 -43 21 -49 Z" fill="${palette.glow}" opacity=".66"/></g>`;
    } else if (armorMotif === 'robe') {
      art = `<g transform="translate(96 80)" filter="url(#shadow)"><path d="M-43 -54 H43 L53 59 L20 59 L0 34 L-20 59 L-53 59 Z" fill="${palette.shade}" stroke="${palette.accent}" stroke-width="2"/><path d="M-25 -50 H25 L18 54 H-18 Z" fill="${palette.metal}" opacity=".84"/><path d="M0 -49 V54" stroke="${palette.accent}" stroke-width="4"/><circle cx="0" cy="-25" r="8" fill="${palette.glow}" filter="url(#glow)"/></g>`;
    } else if (armorMotif === 'breastplate') {
      art = `<g transform="translate(96 79)" filter="url(#shadow)"><path d="M-55 -49 L-16 -61 H16 L55 -49 L50 36 C37 53 18 62 0 69 C-18 62 -37 53 -50 36 Z" fill="${palette.shade}" stroke="${palette.accent}" stroke-width="2.2"/><path d="M-37 -36 H37 L32 28 C23 39 11 46 0 50 C-11 46 -23 39 -32 28 Z" fill="${palette.metal}" opacity=".92"/><path d="M0 -58 V50 M-43 -8 H43" stroke="${palette.accent}" stroke-width="3" opacity=".8"/></g>`;
    } else {
      art = `<g transform="translate(96 79)" filter="url(#shadow)"><path d="M-58 -52 L-25 -65 H25 L58 -52 L52 -4 L40 40 C28 55 14 64 0 69 C-14 64 -28 55 -40 40 L-52 -4 Z" fill="${palette.shade}" stroke="${palette.accent}" stroke-width="2.2"/><path d="M-40 -38 L-16 -48 H16 L40 -38 L36 0 L24 31 C16 40 8 46 0 49 C-8 46 -16 40 -24 31 L-36 0 Z" fill="${palette.metal}" opacity=".94"/><path d="M0 -47 V49 M-37 -9 H37" stroke="${palette.glow}" stroke-width="3" opacity=".72"/><circle cx="0" cy="-22" r="9" fill="${palette.accent}" stroke="${palette.glow}" stroke-width="2"/></g>`;
    }
  }

  return `<span class="equipment-preview" style="display:block;margin-top:12px;padding:12px 13px 13px;border:1px solid ${palette.border};border-radius:18px;background:linear-gradient(140deg, rgba(7,11,18,.98), rgba(22,17,31,.96));box-shadow:inset 0 0 40px rgba(0,0,0,.48),0 8px 24px rgba(0,0,0,.28);">
    <span style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:11px;color:rgba(255,255,255,.78);letter-spacing:.08em;">
      <b style="font-weight:700;">装備イメージ</b>
      <span style="color:${palette.accent};font-weight:700;">${escapeHtml(rarity)}</span>
    </span>
    <span style="display:grid;grid-template-columns:minmax(0,1fr) 258px;gap:12px;align-items:stretch;">
      <span style="display:flex;flex-direction:column;justify-content:space-between;padding:14px 14px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01));box-shadow:inset 0 0 24px rgba(255,255,255,.02);min-height:198px;">
        <span>
          <span style="display:block;font-size:24px;line-height:1.15;font-weight:800;color:rgba(255,255,255,.98);text-shadow:0 0 12px rgba(0,0,0,.32);margin-bottom:10px;">${label}</span>
          <span style="display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;border:1px solid ${palette.border};background:rgba(255,255,255,.03);font-size:11px;color:rgba(255,255,255,.84);margin-bottom:10px;">
            <b style="color:${palette.accent};">${statLabel}</b><span>${escapeHtml(String(statValue))}</span>
          </span>
          <span style="display:block;font-size:11px;letter-spacing:.08em;color:rgba(255,255,255,.58);margin-bottom:5px;">固有能力</span>
          <span style="display:block;font-size:18px;line-height:1.2;font-weight:700;color:${palette.glow};margin-bottom:7px;">${abilityName}</span>
          <span style="display:block;font-size:13px;line-height:1.55;color:rgba(255,255,255,.88);">${ability}</span>
        </span>
        <span style="display:block;font-size:11px;line-height:1.5;color:rgba(255,255,255,.46);padding-top:10px;border-top:1px solid rgba(255,255,255,.06);">名前と固有能力に合わせて見た目を個別化した装備プレビュー。</span>
      </span>
      <span style="display:flex;align-items:center;justify-content:center;padding:10px;border-radius:16px;border:1px solid ${palette.border};background:radial-gradient(circle at 50% 35%, rgba(255,255,255,.05), rgba(255,255,255,.015) 58%, rgba(0,0,0,.08) 100%);box-shadow:inset 0 0 34px rgba(0,0,0,.34);">
        <svg viewBox="0 0 188 158" width="100%" height="184" role="img" aria-label="${label}" style="display:block;max-width:236px;">
          <defs>
            <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="rgba(0,0,0,.78)"/></filter>
            <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <radialGradient id="halo" cx="50%" cy="45%" r="55%"><stop offset="0%" stop-color="${rarityAura}" stop-opacity=".30"/><stop offset="55%" stop-color="${rarityAura}" stop-opacity=".08"/><stop offset="100%" stop-color="${rarityAura}" stop-opacity="0"/></radialGradient>
          </defs>
          <rect x="1" y="1" width="186" height="156" rx="15" fill="rgba(5,8,14,.24)" stroke="${palette.border}"/>
          <ellipse cx="94" cy="78" rx="78" ry="61" fill="url(#halo)"/>
          <circle cx="94" cy="78" r="51" fill="none" stroke="${rarityAura}" stroke-width="1.1" opacity=".25"/>
          <circle cx="94" cy="78" r="39" fill="none" stroke="${rarityAura}" stroke-width=".8" opacity=".18" stroke-dasharray="4 5"/>
          ${themeParts.join('')}
          ${abilityAccent}
          ${art}
          <circle cx="${74 + ((seed >>> 4) % 30)}" cy="${51 + ((seed >>> 9) % 24)}" r="2.8" fill="${palette.glow}" opacity=".68" filter="url(#glow)"/>
        </svg>
      </span>
    </span>
  </span>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[char] ?? char);
}
