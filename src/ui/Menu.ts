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
  onDiscard: (category: ItemCategory, index: number) => void;
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

    const discardButton = target.closest<HTMLElement>('[data-discard-category][data-discard-index]');
    if (discardButton) {
      event.stopPropagation();
      const index = Number(discardButton.dataset.discardIndex);
      const category = discardButton.dataset.discardCategory as ItemCategory;
      if (
        Number.isInteger(index) &&
        (category === 'weapon' || category === 'armor' || category === 'consumable')
      ) {
        this.actions.onDiscard(category, index);
      }
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
  const rarity = item.dropRarity ?? equipmentRarityForDesign(item.designRarity ?? designRarityFor(item.name));
  const palette = previewPalette(item.name, rarity);
  return `<div class="equipment-entry${equipped ? ' equipped' : ''}" data-category="weapon" data-slot-index="${index}" style="border-color:${palette.border};background:${palette.bg};box-shadow:inset 0 0 22px rgba(0,0,0,.26);">
    <span class="inventory-slot-index">所持枠 ${index + 1}</span>
    <span class="equipment-name" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <span>${escapeHtml(item.name)}</span>
      ${equipped ? '<span style="padding:2px 8px;border-radius:999px;border:1px solid rgba(255,220,120,.38);background:rgba(255,210,80,.09);font-size:10px;font-weight:700;color:#ffd777;white-space:nowrap;">装備中</span>' : ''}
    </span>
    <span class="equipment-actions">
      <button class="discard-button" type="button" data-discard-category="weapon" data-discard-index="${index}" ${equipped ? 'disabled title="装備中は捨てられません"' : ''}>捨てる</button>
    </span>
    <span class="equipment-summary"></span>
    ${equipmentPreviewHtml(item)}
    <span class="ability-slot-grid">${abilitySlotsHtml(item.abilitySlots, rarity)}</span>
  </div>`;
}

function armorCardHtml(item: ArmorItem, index: number, equipped: boolean): string {
  const rarity = item.dropRarity ?? equipmentRarityForDesign(item.designRarity ?? designRarityFor(item.name));
  const palette = previewPalette(item.name, rarity);
  return `<div class="equipment-entry${equipped ? ' equipped' : ''}" data-category="armor" data-slot-index="${index}" style="border-color:${palette.border};background:${palette.bg};box-shadow:inset 0 0 22px rgba(0,0,0,.26);">
    <span class="inventory-slot-index">所持枠 ${index + 1}</span>
    <span class="equipment-name" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <span>${escapeHtml(item.name)}</span>
      ${equipped ? '<span style="padding:2px 8px;border-radius:999px;border:1px solid rgba(255,220,120,.38);background:rgba(255,210,80,.09);font-size:10px;font-weight:700;color:#ffd777;white-space:nowrap;">装備中</span>' : ''}
    </span>
    <span class="equipment-actions">
      <button class="discard-button" type="button" data-discard-category="armor" data-discard-index="${index}" ${equipped ? 'disabled title="装備中は捨てられません"' : ''}>捨てる</button>
    </span>
    <span class="equipment-summary"></span>
    ${equipmentPreviewHtml(item)}
    <span class="ability-slot-grid">${abilitySlotsHtml(item.abilitySlots, rarity)}</span>
  </div>`;
}

function abilitySlotsHtml(
  slots: ReadonlyArray<WeaponAbility | ArmorAbility | null>,
  rarity: string,
): string {
  const palette = previewPalette('', rarity);
  return slots.map((ability, index) => {
    if (!ability) {
      return `<span class="ability-slot empty" style="border-color:${palette.border};background:${palette.bg};opacity:.72;"><b>${index + 1}</b><span>＋ 空き</span></span>`;
    }
    return `<span class="ability-slot filled" style="border-color:${palette.border};background:${palette.bg};"><b>${index + 1}</b><span>${escapeHtml(ability.description)}</span></span>`;
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
  return `<div class="item-slot" data-category="consumable" data-slot-index="${index}">
    <span class="slot-index">${index + 1}</span>
    <strong>${escapeHtml(item.name)}</strong>
    <small>${escapeHtml(item.description)}</small>
    <em>クリックで使用</em>
    <button class="discard-button item-discard-button" type="button" data-discard-category="consumable" data-discard-index="${index}">捨てる</button>
  </div>`;
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

function equipmentRarityForDesign(rarity: string | undefined): string {
  if (rarity === '伝説級') return '赤神話';
  if (rarity === '激レア') return '金';
  if (rarity === '希少') return '銀';
  return '銅';
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
    rarity === '赤神話' ? 'rgba(255,68,84,.90)' :
    rarity === '金' ? 'rgba(255,214,84,.82)' :
    rarity === '銀' ? 'rgba(215,229,242,.70)' :
    'rgba(190,118,67,.62)';
  const bg =
    rarity === '赤神話' ? 'linear-gradient(135deg,#26090d,#60151d)' :
    rarity === '金' ? 'linear-gradient(135deg,#1b1609,#4b3410)' :
    rarity === '銀' ? 'linear-gradient(135deg,#121923,#344353)' :
    'linear-gradient(135deg,#1b120d,#3a2418)';

  return { metal, glow, shade, accent, border, bg };
}

function equipmentPreviewHtml(item: WeaponItem | ArmorItem): string {
  const rarity = item.dropRarity ?? equipmentRarityForDesign(item.designRarity ?? designRarityFor(item.name));
  const powerLevel = item.powerLevel ?? 1;
  const slotCount = item.abilitySlots.length;
  const palette = previewPalette(item.name, rarity);
  const abilityName = escapeHtml(item.intrinsicAbility?.name ?? '固有能力なし');
  const ability = escapeHtml(item.intrinsicAbility?.description ?? '固有能力なし');
  const statLabel = item.category === 'weapon' ? '攻撃' : '防御';
  const statValue = item.category === 'weapon' ? item.attack : item.defense;
  const weaponCodes: Record<string,string> = {"鉄の剣":"WPN-001","山賊の剣":"WPN-002","古びた長剣":"WPN-003","青鋼の剣":"WPN-004","黒鉄の剣":"WPN-005","錆喰いの剣":"WPN-006","洞窟刀":"WPN-007","月影の短剣":"WPN-008","火打ちの剣":"WPN-009","骨断ち":"WPN-010","風切丸":"WPN-011","泥濘の刃":"WPN-012","赤銅の長剣":"WPN-013","白銀の小剣":"WPN-014","影縫い":"WPN-015","雷鳴の剣":"WPN-016","苔むす剣":"WPN-017","深層の刃":"WPN-018","血煙丸":"WPN-019","岩砕き":"WPN-020","狩人の曲刀":"WPN-021","亡者の剣":"WPN-022","星屑の剣":"WPN-023","夜渡り":"WPN-024","燐光剣":"WPN-025","黒曜の刃":"WPN-026","朽王の剣":"WPN-027","竜骨剣":"WPN-028","鉱夫の鉈":"WPN-029","迷宮の剣":"WPN-030","霧裂き":"WPN-031","紅蓮の短剣":"WPN-032","氷脈の剣":"WPN-033","紫電の刃":"WPN-034","鬼灯丸":"WPN-035","夢喰い":"WPN-036","蟲狩りの剣":"WPN-037","蛇殺し":"WPN-038","蝙蝠切り":"WPN-039","晶砕き":"WPN-040","影子守":"WPN-041","断層剣":"WPN-042","墓守の剣":"WPN-043","祈り砕き":"WPN-044","灰冠の剣":"WPN-045","金喰いの刃":"WPN-046","幽世の剣":"WPN-047","月蝕刀":"WPN-048","黒薔薇":"WPN-049","太古の剣":"WPN-050","深淵の牙":"WPN-051","旅人の名剣":"WPN-052","迷い星":"WPN-053","終夜の剣":"WPN-054"};
  const armorCodes: Record<string,string> = {"革の鎧":"ARM-001","鉄の胸当て":"ARM-002","探索者の鎧":"ARM-003","青鋼の鎧":"ARM-004","黒革の鎧":"ARM-005","錆鉄の鎧":"ARM-006","苔衣":"ARM-007","鉱夫の胸当て":"ARM-008","月影の外套":"ARM-009","骨組み鎧":"ARM-010","風除けのコート":"ARM-011","泥壁の鎧":"ARM-012","赤銅の胸甲":"ARM-013","白銀の鎧":"ARM-014","影縫いの衣":"ARM-015","雷除け胴":"ARM-016","深層探索服":"ARM-017","血染めの鎧":"ARM-018","岩殻の鎧":"ARM-019","狩人の胴衣":"ARM-020","亡者の鎧":"ARM-021","星屑の外套":"ARM-022","夜渡りの服":"ARM-023","燐光の鎧":"ARM-024","黒曜の鎧":"ARM-025","朽王の外套":"ARM-026","竜骨鎧":"ARM-027","坑道作業服":"ARM-028","迷宮騎士鎧":"ARM-029","霧衣":"ARM-030","紅蓮の胸甲":"ARM-031","氷脈の鎧":"ARM-032","紫電の外套":"ARM-033","鬼灯の鎧":"ARM-034","夢守りの衣":"ARM-035","蟲殻の鎧":"ARM-036","蛇革の胴衣":"ARM-037","蝙蝠羽の外套":"ARM-038","晶殻鎧":"ARM-039","影子守の衣":"ARM-040","断層の鎧":"ARM-041","墓守の鎧":"ARM-042","祈祷師の法衣":"ARM-043","灰冠の鎧":"ARM-044","金継ぎの鎧":"ARM-045","幽世の衣":"ARM-046","月蝕の鎧":"ARM-047","黒薔薇のドレス":"ARM-048","太古の甲冑":"ARM-049","深淵の鎧":"ARM-050","旅人の外套":"ARM-051","迷い星の鎧":"ARM-052","終夜の外套":"ARM-053","王墓の甲冑":"ARM-054"};
  const code = item.category === 'weapon' ? weaponCodes[item.name] : armorCodes[item.name];
  const artSrc = code ? `/equipment_art/${item.category === 'weapon' ? 'weapons' : 'armors'}/${code}.jpg` : '';
  const accent = palette.accent;
  const border = palette.border;

  return `<span class="equipment-preview" style="display:block;margin-top:4px;padding:6px 8px;border-radius:10px;border:1px solid ${border};background:${palette.bg};box-shadow:inset 0 0 18px rgba(0,0,0,.32);">
    <span style="display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:8px;align-items:center;">
      <span style="display:flex;flex-direction:column;justify-content:center;min-width:0;padding:1px 0;">
        <span style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:4px;">
          <span style="padding:2px 6px;border-radius:999px;border:1px solid rgba(255,255,255,.08);font-size:10px;color:rgba(255,255,255,.88);white-space:nowrap;"><b style="color:${accent};">${statLabel}</b> ${escapeHtml(String(statValue))}</span>
          <span style="padding:2px 6px;border-radius:999px;border:1px solid ${border};font-size:10px;color:rgba(255,255,255,.94);white-space:nowrap;"><b style="color:${accent};">レア度</b> ${escapeHtml(rarity)}</span>
          <span style="padding:2px 6px;border-radius:999px;border:1px solid rgba(255,255,255,.10);font-size:10px;color:rgba(255,255,255,.94);white-space:nowrap;"><b style="color:#ffdb74;">強さ</b> ${powerLevel}/10</span>
          <span style="padding:2px 6px;border-radius:999px;border:1px solid rgba(255,255,255,.10);font-size:10px;color:rgba(255,255,255,.88);white-space:nowrap;"><b style="color:#9fd3ff;">能力枠</b> ${slotCount}</span>
          <span style="padding:2px 6px;border-radius:999px;border:1px solid rgba(255,255,255,.08);font-size:10px;color:${palette.glow};white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis;">${abilityName}</span>
        </span>
        <span style="font-size:10px;line-height:1.36;color:rgba(255,255,255,.8);">${ability}</span>
      </span>
      <span style="display:flex;align-items:center;justify-content:center;padding:3px;border-radius:8px;border:1px solid ${border};background:#080b12;height:86px;overflow:hidden;">
        ${artSrc ? `<img src="${artSrc}" alt="${escapeHtml(item.name)}" style="width:100%;height:100%;max-height:86px;object-fit:contain;display:block;border-radius:5px;" />` : `<span style="font-size:10px;color:rgba(255,255,255,.4);">NO IMAGE</span>`}
      </span>
    </span>
  </span>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[char] ?? char);
}
