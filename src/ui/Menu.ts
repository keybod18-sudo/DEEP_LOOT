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
  const runeX = 24 + (seed % 56);
  const runeY = 16 + ((seed >>> 7) % 22);
  const tilt = -28 + ((seed >>> 12) % 15);
  const motif = item.category === 'weapon' ? weaponPreviewMotif(item.name) : armorPreviewMotif(item.name);
  const label = escapeHtml(item.name);

  let art = '';
  if (item.category === 'weapon') {
    if (motif === 'dagger') art = `<g transform="translate(92 43) rotate(${tilt})"><rect x="-26" y="-4" width="22" height="8" rx="3" fill="${palette.shade}"/><path d="M-4 -3 H42 L68 0 L42 3 H-4 Z" fill="${palette.metal}"/><path d="M40 -3 L67 0 L40 3 Z" fill="${palette.accent}"/><circle cx="-5" cy="0" r="4" fill="${palette.glow}"/></g>`;
    else if (motif === 'katana') art = `<g transform="translate(90 47) rotate(${tilt / 2})"><path d="M-58 5 Q-12 -5 40 -2 L68 0 Q48 5 40 5 Q-12 8 -58 5 Z" fill="${palette.metal}"/><rect x="-73" y="-4" width="18" height="8" rx="2" fill="${palette.shade}"/><circle cx="-55" cy="0" r="4" fill="${palette.glow}"/></g>`;
    else if (motif === 'spear') art = `<g transform="translate(91 45) rotate(-16)"><rect x="-67" y="-2.4" width="120" height="4.8" rx="2.4" fill="${palette.shade}"/><path d="M52 0 L81 -10 L72 0 L81 10 Z" fill="${palette.metal}"/><circle cx="-45" cy="0" r="4" fill="${palette.glow}"/></g>`;
    else if (motif === 'axe') art = `<g transform="translate(90 44) rotate(-18)"><rect x="-5" y="-30" width="10" height="64" rx="4" fill="${palette.shade}"/><path d="M3 -17 C30 -29 47 -7 35 11 C24 20 14 21 3 14 Z" fill="${palette.metal}"/><path d="M-3 -15 C-24 -24 -35 -5 -25 10 C-18 18 -10 20 -3 14 Z" fill="${palette.glow}"/></g>`;
    else if (motif === 'bow') art = `<g transform="translate(91 44) rotate(-8)"><path d="M-20 -30 C20 -14 20 14 -20 30" fill="none" stroke="${palette.metal}" stroke-width="8" stroke-linecap="round"/><path d="M12 -28 C-24 -8 -24 8 12 28" fill="none" stroke="${palette.shade}" stroke-width="6"/><line x1="-20" y1="-30" x2="12" y2="28" stroke="${palette.accent}" stroke-width="2"/></g>`;
    else if (motif === 'staff') art = `<g transform="translate(91 45) rotate(-20)"><rect x="-5" y="-34" width="10" height="70" rx="5" fill="${palette.shade}"/><circle cx="0" cy="-41" r="13" fill="${palette.glow}"/><circle cx="0" cy="-41" r="6" fill="${palette.accent}"/></g>`;
    else if (motif === 'scythe') art = `<g transform="translate(92 46) rotate(-16)"><rect x="-5" y="-34" width="9" height="72" rx="4" fill="${palette.shade}"/><path d="M2 -27 C42 -37 59 -10 51 12 C34 2 18 1 2 7 Z" fill="${palette.metal}"/></g>`;
    else if (motif === 'claw') art = `<g transform="translate(91 44) rotate(-10)"><path d="M-28 10 C-8 -16 20 -25 50 -18 C25 -10 6 2 -7 21 Z" fill="${palette.shade}"/><path d="M-12 10 C0 -18 25 -29 48 -25 C30 -14 17 2 12 20 Z" fill="${palette.metal}"/><path d="M7 12 C22 -13 42 -21 60 -18 C48 -6 40 5 36 20 Z" fill="${palette.glow}"/></g>`;
    else art = `<g transform="translate(92 44) rotate(${tilt})"><rect x="-47" y="-4" width="18" height="8" rx="3" fill="${palette.shade}"/><path d="M-28 -3 H42 L70 0 L42 3 H-28 Z" fill="${palette.metal}"/><path d="M40 -3 L69 0 L40 3 Z" fill="${palette.accent}"/><circle cx="-28" cy="0" r="4" fill="${palette.glow}"/></g>`;
  } else {
    if (motif === 'cloak') art = `<g transform="translate(92 44)"><path d="M0 -29 C18 -28 32 -17 33 0 C35 19 18 31 0 36 C-18 31 -35 19 -33 0 C-32 -17 -18 -28 0 -29 Z" fill="${palette.shade}"/><path d="M-11 -24 C-6 -7 -6 18 -14 31 C-24 22 -30 10 -28 -4 C-26 -14 -19 -21 -11 -24 Z" fill="${palette.metal}"/><path d="M11 -24 C6 -7 6 18 14 31 C24 22 30 10 28 -4 C26 -14 19 -21 11 -24 Z" fill="${palette.glow}"/></g>`;
    else if (motif === 'robe') art = `<g transform="translate(92 44)"><path d="M-25 -27 H25 L31 33 L11 33 L0 20 L-11 33 L-31 33 Z" fill="${palette.shade}"/><path d="M-14 -25 H14 L10 30 H-10 Z" fill="${palette.metal}"/><path d="M0 -24 V31" stroke="${palette.accent}" stroke-width="3"/></g>`;
    else if (motif === 'breastplate') art = `<g transform="translate(92 44)"><path d="M-30 -23 L-8 -31 H8 L30 -23 L27 24 C19 32 10 37 0 40 C-10 37 -19 32 -27 24 Z" fill="${palette.shade}"/><path d="M-20 -17 H20 L17 20 C12 26 7 29 0 31 C-7 29 -12 26 -17 20 Z" fill="${palette.metal}"/></g>`;
    else art = `<g transform="translate(92 44)"><path d="M-31 -25 L-13 -31 H13 L31 -25 L27 4 L20 29 C13 36 7 39 0 42 C-7 39 -13 36 -20 29 L-27 4 Z" fill="${palette.shade}"/><path d="M-20 -19 L-9 -24 H9 L20 -19 L18 5 L12 24 C8 29 4 31 0 33 C-4 31 -8 29 -12 24 L-18 5 Z" fill="${palette.metal}"/><path d="M0 -24 V32" stroke="${palette.accent}" stroke-width="3"/></g>`;
  }

  const rune = `<circle cx="${runeX}" cy="${runeY}" r="${4 + (seed % 4)}" fill="${palette.glow}" opacity=".52"/><path d="M${runeX - 8} ${runeY + 10} L${runeX} ${runeY - 4} L${runeX + 8} ${runeY + 10}" fill="none" stroke="${palette.accent}" stroke-width="1.4" opacity=".66"/>`;

  return `<span class="equipment-preview" style="display:block;margin-top:10px;padding:8px 10px;border:1px solid ${palette.border};border-radius:12px;background:${palette.bg};">
    <span style="display:block;font-size:11px;opacity:.72;margin-bottom:5px;">装備イメージ</span>
    <svg viewBox="0 0 184 88" width="100%" height="88" role="img" aria-label="${label}">
      <rect x="1" y="1" width="182" height="86" rx="12" fill="rgba(4,8,14,.20)" stroke="${palette.border}"/>
      ${rune}${art}
      <text x="12" y="76" font-size="12" fill="rgba(255,255,255,.94)">${label}</text>
    </svg>
  </span>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[char] ?? char);
}
