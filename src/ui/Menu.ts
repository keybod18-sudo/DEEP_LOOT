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
  const rarity = designRarityFor(item.name);
  const palette = previewPalette(item.name, rarity);
  const seed = equipmentPreviewSeed(item.name);
  const label = escapeHtml(item.name);
  const ability = item.intrinsicAbility?.description ?? '';
  const name = item.name;
  const weaponMotif = item.category === 'weapon' ? weaponPreviewMotif(name) : '';
  const armorMotif = item.category === 'armor' ? armorPreviewMotif(name) : '';

  const rarityAura =
    rarity === '伝説級' ? 'rgba(255,205,76,.86)' :
    rarity === '激レア' ? 'rgba(190,98,255,.82)' :
    rarity === '希少' ? 'rgba(78,208,255,.72)' :
    rarity === '上質' ? 'rgba(143,198,255,.58)' :
    'rgba(160,170,190,.34)';

  const tilt = -24 + (seed % 13);
  const gemX = 72 + ((seed >>> 5) % 34);
  const gemY = 55 + ((seed >>> 11) % 20);

  const themeParts: string[] = [];

  if (/月|月蝕/.test(name)) {
    themeParts.push(`
      <path d="M40 38 A34 34 0 1 0 77 88 A25 25 0 1 1 40 38 Z"
        fill="rgba(129,82,255,.22)" stroke="rgba(202,177,255,.58)" stroke-width="2"/>
      <path d="M52 42 A25 25 0 1 0 76 80" fill="none"
        stroke="rgba(177,128,255,.18)" stroke-width="7"/>
    `);
  }
  if (/影|夜|幽|夢|深淵|終夜/.test(name)) {
    themeParts.push(`
      <ellipse cx="97" cy="72" rx="58" ry="34" fill="rgba(43,16,73,.22)"/>
      <path d="M44 100 C64 80 78 104 96 82 C113 62 128 74 145 52"
        fill="none" stroke="rgba(125,76,185,.34)" stroke-width="5" stroke-linecap="round"/>
    `);
  }
  if (/火|炎|紅蓮|鬼灯/.test(name)) {
    themeParts.push(`
      <path d="M44 110 C32 92 51 84 43 67 C61 76 66 87 57 101 C76 90 84 104 74 120"
        fill="rgba(255,91,43,.25)" stroke="rgba(255,151,79,.52)" stroke-width="2"/>
      <path d="M132 104 C123 90 141 83 133 68 C151 77 155 91 145 105"
        fill="rgba(255,103,46,.18)" stroke="rgba(255,176,88,.42)" stroke-width="2"/>
    `);
  }
  if (/氷|霜|雪|凍/.test(name)) {
    themeParts.push(`
      <g fill="rgba(167,235,255,.22)" stroke="rgba(218,250,255,.66)" stroke-width="1.5">
        <path d="M40 42 L49 61 L38 76 L30 57 Z"/>
        <path d="M143 38 L152 56 L142 72 L134 53 Z"/>
        <path d="M126 105 L135 120 L125 132 L118 117 Z"/>
      </g>
      <path d="M28 94 L52 84 M39 77 L43 100 M133 85 L157 76 M145 68 L147 93"
        stroke="rgba(199,244,255,.38)" stroke-width="2"/>
    `);
  }
  if (/雷|紫電/.test(name)) {
    themeParts.push(`
      <path d="M38 37 L56 63 L46 63 L61 91 L49 86 L61 119"
        fill="none" stroke="rgba(255,231,82,.72)" stroke-width="4"
        stroke-linejoin="bevel" filter="url(#glow)"/>
      <path d="M139 45 L128 67 L138 67 L124 91"
        fill="none" stroke="rgba(188,134,255,.54)" stroke-width="3"/>
    `);
  }
  if (/苔|蟲|蛇/.test(name)) {
    themeParts.push(`
      <path d="M33 113 C48 96 55 119 70 101 C84 85 99 103 113 88"
        fill="none" stroke="rgba(85,210,102,.42)" stroke-width="4" stroke-linecap="round"/>
      <g fill="rgba(117,230,106,.34)">
        <ellipse cx="49" cy="104" rx="5" ry="10" transform="rotate(-34 49 104)"/>
        <ellipse cx="82" cy="103" rx="5" ry="10" transform="rotate(38 82 103)"/>
        <ellipse cx="119" cy="87" rx="4" ry="9" transform="rotate(-30 119 87)"/>
      </g>
    `);
  }
  if (/骨|骸|墓|竜骨/.test(name)) {
    themeParts.push(`
      <path d="M35 112 L57 93 M33 93 L58 113 M131 43 L151 61 M150 43 L132 62"
        stroke="rgba(235,226,207,.48)" stroke-width="5" stroke-linecap="round"/>
      <circle cx="45" cy="103" r="4" fill="rgba(255,247,222,.44)"/>
      <circle cx="141" cy="52" r="4" fill="rgba(255,247,222,.44)"/>
    `);
  }
  if (/星|燐光|迷い星/.test(name)) {
    themeParts.push(`
      <g fill="rgba(255,246,178,.75)" filter="url(#glow)">
        <path d="M42 45 L45 53 L54 56 L45 59 L42 68 L39 59 L30 56 L39 53 Z"/>
        <path d="M143 73 L146 80 L153 83 L146 86 L143 93 L140 86 L133 83 L140 80 Z"/>
        <circle cx="117" cy="38" r="3"/>
      </g>
    `);
  }
  if (/血|黒薔薇/.test(name)) {
    themeParts.push(`
      <path d="M40 42 C55 50 59 62 54 75 C49 89 53 96 47 110"
        fill="none" stroke="rgba(176,25,55,.42)" stroke-width="5" stroke-linecap="round"/>
      <g fill="rgba(139,21,49,.42)">
        <circle cx="139" cy="44" r="8"/><circle cx="132" cy="51" r="6"/><circle cx="146" cy="52" r="6"/>
      </g>
    `);
  }
  if (/晶|黒曜/.test(name)) {
    themeParts.push(`
      <g fill="rgba(161,227,255,.18)" stroke="rgba(203,239,255,.5)" stroke-width="1.5">
        <path d="M36 41 L46 31 L56 44 L49 61 L34 57 Z"/>
        <path d="M142 94 L153 83 L161 98 L153 113 L138 108 Z"/>
      </g>
    `);
  }
  if (/霧/.test(name)) {
    themeParts.push(`
      <path d="M26 104 C50 91 64 110 84 99 C106 86 122 107 157 93"
        fill="none" stroke="rgba(210,226,238,.22)" stroke-width="9" stroke-linecap="round"/>
      <path d="M38 116 C61 104 77 119 100 111 C119 104 132 112 151 105"
        fill="none" stroke="rgba(226,236,244,.15)" stroke-width="6" stroke-linecap="round"/>
    `);
  }
  if (/竜|太古|王墓|灰冠/.test(name)) {
    themeParts.push(`
      <path d="M39 47 C47 34 58 32 66 41 C55 39 49 47 51 58 C45 56 41 52 39 47 Z"
        fill="rgba(214,180,115,.28)" stroke="rgba(244,216,157,.44)" stroke-width="2"/>
      <path d="M141 48 C134 36 124 34 116 42 C126 41 132 49 130 59 C136 56 140 52 141 48 Z"
        fill="rgba(214,180,115,.28)" stroke="rgba(244,216,157,.44)" stroke-width="2"/>
    `);
  }
  if (/金継ぎ|金喰い/.test(name)) {
    themeParts.push(`
      <path d="M36 111 L61 87 L74 101 L96 75 L112 91 L146 57"
        fill="none" stroke="rgba(255,214,83,.56)" stroke-width="3" filter="url(#glow)"/>
    `);
  }
  if (/蝙蝠/.test(name)) {
    themeParts.push(`
      <path d="M34 56 C47 43 58 44 69 55 L61 61 L69 69 C57 65 47 68 34 81
        C39 68 39 66 34 56 Z"
        fill="rgba(95,54,135,.34)" stroke="rgba(157,103,209,.44)" stroke-width="1.5"/>
      <path d="M147 56 C134 43 123 44 112 55 L120 61 L112 69 C124 65 134 68 147 81
        C142 68 142 66 147 56 Z"
        fill="rgba(95,54,135,.34)" stroke="rgba(157,103,209,.44)" stroke-width="1.5"/>
    `);
  }

  const abilityAccent =
    /移動速度/.test(ability) ? `<path d="M32 79 H51 M37 71 H57 M29 88 H45" stroke="${palette.accent}" stroke-width="2.5" opacity=".66"/>` :
    /自動回復|HP/.test(ability) ? `<path d="M145 42 V61 M135 51.5 H155" stroke="rgba(132,255,161,.68)" stroke-width="5" stroke-linecap="round"/>` :
    /完全無効|耐性|状態異常/.test(ability) ? `<path d="M140 36 L154 42 V55 C154 67 147 74 140 78 C133 74 126 67 126 55 V42 Z" fill="rgba(116,205,255,.14)" stroke="rgba(167,230,255,.58)" stroke-width="2"/>` :
    /追撃|魔法|ファイア|フリーズ/.test(ability) ? `<circle cx="145" cy="50" r="10" fill="rgba(255,239,146,.18)" stroke="rgba(255,243,178,.58)" stroke-width="2" filter="url(#glow)"/>` :
    '';

  let art = '';

  if (item.category === 'weapon') {
    if (weaponMotif === 'dagger') {
      art = `
        <g transform="translate(95 78) rotate(${tilt})" filter="url(#shadow)">
          <path d="M-58 -8 L-31 -8 L-23 -3 L25 -3 L58 0 L25 3 L-23 3 L-31 8 L-58 8 Z"
            fill="${palette.shade}" stroke="rgba(12,15,22,.8)" stroke-width="2"/>
          <path d="M-21 -4 H30 L64 0 L30 4 H-21 Z"
            fill="${palette.metal}" stroke="${palette.accent}" stroke-width="1.6"/>
          <path d="M26 -2 L62 0 L26 2 Z" fill="${palette.glow}" opacity=".72"/>
          <rect x="-75" y="-6" width="18" height="12" rx="4" fill="${palette.shade}" stroke="${palette.glow}" stroke-width="1.5"/>
          <circle cx="-28" cy="0" r="5" fill="${palette.glow}" stroke="${palette.accent}" stroke-width="1.5"/>
        </g>`;
    } else if (weaponMotif === 'katana') {
      art = `
        <g transform="translate(93 79) rotate(${tilt / 2})" filter="url(#shadow)">
          <path d="M-72 7 Q-20 -11 45 -5 Q61 -4 73 0 Q57 6 44 8 Q-22 13 -72 7 Z"
            fill="${palette.metal}" stroke="${palette.accent}" stroke-width="1.6"/>
          <path d="M-70 3 Q-20 -7 43 -4" fill="none" stroke="rgba(255,255,255,.62)" stroke-width="2"/>
          <rect x="-90" y="-6" width="20" height="12" rx="3" fill="${palette.shade}"/>
          <rect x="-108" y="-5" width="18" height="10" rx="3" fill="${palette.glow}"/>
          <path d="M-75 -10 L-65 0 L-75 10 L-85 0 Z" fill="${palette.accent}" opacity=".75"/>
        </g>`;
    } else if (weaponMotif === 'spear') {
      art = `
        <g transform="translate(94 79) rotate(-17)" filter="url(#shadow)">
          <rect x="-95" y="-4" width="150" height="8" rx="4" fill="${palette.shade}" stroke="rgba(0,0,0,.55)" stroke-width="2"/>
          <path d="M52 0 L88 -14 L77 0 L88 14 Z" fill="${palette.metal}" stroke="${palette.accent}" stroke-width="1.6"/>
          <path d="M44 -9 L58 0 L44 9 Z" fill="${palette.glow}" opacity=".68"/>
          <circle cx="-57" cy="0" r="5" fill="${palette.glow}"/>
        </g>`;
    } else if (weaponMotif === 'axe') {
      art = `
        <g transform="translate(92 80) rotate(-16)" filter="url(#shadow)">
          <rect x="-7" y="-62" width="14" height="118" rx="5" fill="${palette.shade}" stroke="rgba(0,0,0,.58)" stroke-width="2"/>
          <path d="M5 -43 C45 -60 63 -22 48 7 C35 25 19 31 5 26 Z"
            fill="${palette.metal}" stroke="${palette.accent}" stroke-width="1.8"/>
          <path d="M-5 -41 C-34 -54 -51 -21 -38 6 C-28 22 -17 27 -5 24 Z"
            fill="${palette.glow}" opacity=".7" stroke="${palette.accent}" stroke-width="1.2"/>
          <circle cx="0" cy="-20" r="6" fill="${palette.accent}"/>
        </g>`;
    } else if (weaponMotif === 'bow') {
      art = `
        <g transform="translate(94 77) rotate(-7)" filter="url(#shadow)">
          <path d="M-37 -57 C35 -28 35 28 -37 57" fill="none" stroke="${palette.metal}" stroke-width="12" stroke-linecap="round"/>
          <path d="M30 -53 C-42 -23 -42 23 30 53" fill="none" stroke="${palette.shade}" stroke-width="9" stroke-linecap="round"/>
          <line x1="-37" y1="-57" x2="30" y2="53" stroke="${palette.accent}" stroke-width="2.2"/>
          <line x1="-15" y1="-7" x2="59" y2="-7" stroke="${palette.glow}" stroke-width="4"/>
          <path d="M59 -7 L46 -14 L50 -7 L46 0 Z" fill="${palette.glow}"/>
        </g>`;
    } else if (weaponMotif === 'staff') {
      art = `
        <g transform="translate(92 83) rotate(-15)" filter="url(#shadow)">
          <rect x="-8" y="-64" width="16" height="124" rx="7" fill="${palette.shade}" stroke="rgba(0,0,0,.6)" stroke-width="2"/>
          <circle cx="0" cy="-73" r="24" fill="rgba(255,255,255,.04)" stroke="${palette.metal}" stroke-width="4"/>
          <circle cx="0" cy="-73" r="13" fill="${palette.glow}" stroke="${palette.accent}" stroke-width="2" filter="url(#glow)"/>
          <path d="M-24 -67 C-44 -74 -45 -93 -25 -103 M24 -67 C44 -74 45 -93 25 -103"
            fill="none" stroke="${palette.metal}" stroke-width="5" stroke-linecap="round"/>
        </g>`;
    } else if (weaponMotif === 'scythe') {
      art = `
        <g transform="translate(91 83) rotate(-14)" filter="url(#shadow)">
          <rect x="-7" y="-62" width="14" height="121" rx="5" fill="${palette.shade}"/>
          <path d="M3 -54 C64 -74 89 -31 79 5 C53 -8 29 -10 3 3 Z"
            fill="${palette.metal}" stroke="${palette.accent}" stroke-width="1.8"/>
          <path d="M16 -45 C47 -49 63 -35 67 -18" fill="none" stroke="${palette.glow}" stroke-width="2.5"/>
        </g>`;
    } else if (weaponMotif === 'claw') {
      art = `
        <g transform="translate(88 79) rotate(-8)" filter="url(#shadow)">
          <path d="M-45 19 C-15 -30 27 -46 73 -31 C34 -18 7 5 -10 34 Z" fill="${palette.shade}" stroke="${palette.accent}" stroke-width="1.4"/>
          <path d="M-20 21 C0 -30 38 -52 75 -43 C50 -24 29 4 21 36 Z" fill="${palette.metal}" stroke="${palette.accent}" stroke-width="1.4"/>
          <path d="M10 22 C33 -22 61 -36 88 -31 C70 -12 58 9 52 36 Z" fill="${palette.glow}" opacity=".76"/>
          <circle cx="-23" cy="18" r="7" fill="${palette.accent}"/>
        </g>`;
    } else {
      art = `
        <g transform="translate(94 79) rotate(${tilt})" filter="url(#shadow)">
          <rect x="-88" y="-7" width="25" height="14" rx="5" fill="${palette.shade}" stroke="rgba(0,0,0,.55)" stroke-width="2"/>
          <rect x="-65" y="-10" width="12" height="20" rx="4" fill="${palette.glow}" opacity=".82"/>
          <path d="M-53 -7 H42 L84 0 L42 7 H-53 Z"
            fill="${palette.metal}" stroke="${palette.accent}" stroke-width="1.8"/>
          <path d="M-47 -4 H41 L75 0 L41 2 H-47 Z"
            fill="rgba(255,255,255,.42)"/>
          <path d="M42 -5 L83 0 L42 5 Z" fill="${palette.glow}" opacity=".63"/>
          <circle cx="-56" cy="0" r="6" fill="${palette.accent}" stroke="${palette.glow}" stroke-width="2"/>
        </g>`;
    }
  } else {
    if (armorMotif === 'cloak') {
      art = `
        <g transform="translate(94 79)" filter="url(#shadow)">
          <path d="M0 -58 C30 -58 50 -42 54 -13 C59 29 32 54 0 66 C-32 54 -59 29 -54 -13 C-50 -42 -30 -58 0 -58 Z"
            fill="${palette.shade}" stroke="${palette.accent}" stroke-width="2"/>
          <path d="M-21 -49 C-7 -24 -9 29 -27 53 C-44 35 -50 12 -45 -16 C-42 -31 -33 -43 -21 -49 Z"
            fill="${palette.metal}" opacity=".9"/>
          <path d="M21 -49 C7 -24 9 29 27 53 C44 35 50 12 45 -16 C42 -31 33 -43 21 -49 Z"
            fill="${palette.glow}" opacity=".66"/>
          <circle cx="0" cy="-30" r="8" fill="${palette.accent}" stroke="${palette.glow}" stroke-width="2"/>
          <path d="M-7 -58 L7 -58 L11 -40 H-11 Z" fill="${palette.metal}"/>
        </g>`;
    } else if (armorMotif === 'robe') {
      art = `
        <g transform="translate(94 80)" filter="url(#shadow)">
          <path d="M-42 -54 H42 L52 57 L19 57 L0 32 L-19 57 L-52 57 Z"
            fill="${palette.shade}" stroke="${palette.accent}" stroke-width="2"/>
          <path d="M-25 -50 H25 L18 52 H-18 Z" fill="${palette.metal}" opacity=".84"/>
          <path d="M0 -49 V53" stroke="${palette.accent}" stroke-width="4"/>
          <circle cx="0" cy="-25" r="8" fill="${palette.glow}" filter="url(#glow)"/>
          <path d="M-25 -10 H25 M-21 18 H21" stroke="${palette.glow}" stroke-width="2.5" opacity=".6"/>
        </g>`;
    } else if (armorMotif === 'breastplate') {
      art = `
        <g transform="translate(94 79)" filter="url(#shadow)">
          <path d="M-53 -48 L-15 -61 H15 L53 -48 L48 36 C35 52 18 61 0 67 C-18 61 -35 52 -48 36 Z"
            fill="${palette.shade}" stroke="${palette.accent}" stroke-width="2.2"/>
          <path d="M-36 -35 H36 L31 27 C22 38 11 44 0 48 C-11 44 -22 38 -31 27 Z"
            fill="${palette.metal}" opacity=".92"/>
          <path d="M0 -58 V48 M-42 -8 H42" stroke="${palette.accent}" stroke-width="3" opacity=".8"/>
          <circle cx="0" cy="-22" r="8" fill="${palette.glow}"/>
        </g>`;
    } else {
      art = `
        <g transform="translate(94 79)" filter="url(#shadow)">
          <path d="M-57 -52 L-25 -65 H25 L57 -52 L51 -4 L39 39 C27 55 13 63 0 68 C-13 63 -27 55 -39 39 L-51 -4 Z"
            fill="${palette.shade}" stroke="${palette.accent}" stroke-width="2.2"/>
          <path d="M-39 -38 L-16 -48 H16 L39 -38 L35 0 L24 31 C16 40 8 45 0 48 C-8 45 -16 40 -24 31 L-35 0 Z"
            fill="${palette.metal}" opacity=".94"/>
          <path d="M0 -47 V48 M-37 -9 H37" stroke="${palette.glow}" stroke-width="3" opacity=".72"/>
          <circle cx="0" cy="-22" r="9" fill="${palette.accent}" stroke="${palette.glow}" stroke-width="2"/>
          <path d="M-50 -33 L-65 -19 L-50 -9 M50 -33 L65 -19 L50 -9"
            fill="none" stroke="${palette.metal}" stroke-width="6" stroke-linecap="round"/>
        </g>`;
    }
  }

  return `<span class="equipment-preview" style="display:block;margin-top:12px;padding:10px 11px 11px;border:1px solid ${palette.border};border-radius:14px;background:${palette.bg};box-shadow:inset 0 0 28px rgba(0,0,0,.42),0 0 0 1px rgba(255,255,255,.025);">
    <span style="display:flex;justify-content:space-between;align-items:center;font-size:11px;opacity:.78;margin-bottom:5px;">
      <b style="font-weight:700;letter-spacing:.08em;">装備イメージ</b>
      <span>${escapeHtml(rarity)}</span>
    </span>
    <svg viewBox="0 0 188 158" width="100%" height="158" role="img" aria-label="${label}" style="display:block;">
      <defs>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="rgba(0,0,0,.78)"/>
        </filter>
        <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="halo" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stop-color="${rarityAura}" stop-opacity=".28"/>
          <stop offset="55%" stop-color="${rarityAura}" stop-opacity=".08"/>
          <stop offset="100%" stop-color="${rarityAura}" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <rect x="1" y="1" width="186" height="156" rx="13" fill="rgba(3,7,13,.38)" stroke="${palette.border}"/>
      <ellipse cx="94" cy="76" rx="76" ry="61" fill="url(#halo)"/>
      <circle cx="94" cy="76" r="50" fill="none" stroke="${rarityAura}" stroke-width="1.2" opacity=".28"/>
      <circle cx="94" cy="76" r="39" fill="none" stroke="${rarityAura}" stroke-width=".8" opacity=".18" stroke-dasharray="4 5"/>
      ${themeParts.join('')}
      ${abilityAccent}
      ${art}
      <circle cx="${gemX}" cy="${gemY}" r="2.6" fill="${palette.glow}" opacity=".68" filter="url(#glow)"/>
      <text x="12" y="145" font-size="12" fill="rgba(255,255,255,.96)" font-weight="700">${label}</text>
    </svg>
  </span>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[char] ?? char);
}
