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

function equipmentPreviewHtml(item: WeaponItem | ArmorItem): string {
  const rarity = item.designRarity ?? item.rarity ?? designRarityFor(item.name);
  const palette = previewPalette(item.name, rarity);
  const label = escapeHtml(item.name);
  const abilityName = escapeHtml(item.intrinsicAbility?.name ?? '固有能力なし');
  const ability = escapeHtml(item.intrinsicAbility?.description ?? '固有能力なし');
  const statLabel = item.category === 'weapon' ? '攻撃力' : '防御力';
  const statValue = item.category === 'weapon' ? item.attack : item.defense;
  const weaponCodes = {"鉄の剣":"WPN-001","山賊の剣":"WPN-002","古びた長剣":"WPN-003","青鋼の剣":"WPN-004","黒鉄の剣":"WPN-005","錆喰いの剣":"WPN-006","洞窟刀":"WPN-007","月影の短剣":"WPN-008","火打ちの剣":"WPN-009","骨断ち":"WPN-010","風切丸":"WPN-011","泥濘の刃":"WPN-012","赤銅の長剣":"WPN-013","白銀の小剣":"WPN-014","影縫い":"WPN-015","雷鳴の剣":"WPN-016","苔むす剣":"WPN-017","深層の刃":"WPN-018","血煙丸":"WPN-019","岩砕き":"WPN-020","狩人の曲刀":"WPN-021","亡者の剣":"WPN-022","星屑の剣":"WPN-023","夜渡り":"WPN-024","燐光剣":"WPN-025","黒曜の刃":"WPN-026","朽王の剣":"WPN-027","竜骨剣":"WPN-028","鉱夫の鉈":"WPN-029","迷宮の剣":"WPN-030","霧裂き":"WPN-031","紅蓮の短剣":"WPN-032","氷脈の剣":"WPN-033","紫電の刃":"WPN-034","鬼灯丸":"WPN-035","夢喰い":"WPN-036","蟲狩りの剣":"WPN-037","蛇殺し":"WPN-038","蝙蝠切り":"WPN-039","晶砕き":"WPN-040","影子守":"WPN-041","断層剣":"WPN-042","墓守の剣":"WPN-043","祈り砕き":"WPN-044","灰冠の剣":"WPN-045","金喰いの刃":"WPN-046","幽世の剣":"WPN-047","月蝕刀":"WPN-048","黒薔薇":"WPN-049","太古の剣":"WPN-050","深淵の牙":"WPN-051","旅人の名剣":"WPN-052","迷い星":"WPN-053","終夜の剣":"WPN-054"} as const;
  const armorCodes = {"革の鎧":"ARM-001","鉄の胸当て":"ARM-002","探索者の鎧":"ARM-003","青鋼の鎧":"ARM-004","黒革の鎧":"ARM-005","錆鉄の鎧":"ARM-006","苔衣":"ARM-007","鉱夫の胸当て":"ARM-008","月影の外套":"ARM-009","骨組み鎧":"ARM-010","風除けのコート":"ARM-011","泥壁の鎧":"ARM-012","赤銅の胸甲":"ARM-013","白銀の鎧":"ARM-014","影縫いの衣":"ARM-015","雷除け胴":"ARM-016","深層探索服":"ARM-017","血染めの鎧":"ARM-018","岩殻の鎧":"ARM-019","狩人の胴衣":"ARM-020","亡者の鎧":"ARM-021","星屑の外套":"ARM-022","夜渡りの服":"ARM-023","燐光の鎧":"ARM-024","黒曜の鎧":"ARM-025","朽王の外套":"ARM-026","竜骨鎧":"ARM-027","坑道作業服":"ARM-028","迷宮騎士鎧":"ARM-029","霧衣":"ARM-030","紅蓮の胸甲":"ARM-031","氷脈の鎧":"ARM-032","紫電の外套":"ARM-033","鬼灯の鎧":"ARM-034","夢守りの衣":"ARM-035","蟲殻の鎧":"ARM-036","蛇革の胴衣":"ARM-037","蝙蝠羽の外套":"ARM-038","晶殻鎧":"ARM-039","影子守の衣":"ARM-040","断層の鎧":"ARM-041","墓守の鎧":"ARM-042","祈祷師の法衣":"ARM-043","灰冠の鎧":"ARM-044","金継ぎの鎧":"ARM-045","幽世の衣":"ARM-046","月蝕の鎧":"ARM-047","黒薔薇のドレス":"ARM-048","太古の甲冑":"ARM-049","深淵の鎧":"ARM-050","旅人の外套":"ARM-051","迷い星の鎧":"ARM-052","終夜の外套":"ARM-053","王墓の甲冑":"ARM-054"} as const;
  const code = item.category === 'weapon'
    ? weaponCodes[item.name as keyof typeof weaponCodes]
    : armorCodes[item.name as keyof typeof armorCodes];
  const imgSrc = code ? `/v45_icons/${item.category === 'weapon' ? 'weapons' : 'armors'}/${code}.png` : '';
  const accent = palette.accent;
  const frameGlow = rarity === '伝説級' ? 'rgba(255,215,120,.45)' : rarity === '激レア' ? 'rgba(201,117,255,.42)' : rarity === '希少' ? 'rgba(108,214,255,.36)' : 'rgba(160,188,225,.24)';
  const flavor = escapeHtml(item.category === 'weapon' ? '闇深い迷宮で見つかる異形の武器。' : '迷宮の瘴気と加護をまとった防具。');
  const artBlock = imgSrc
    ? `<div style="position:relative;display:flex;align-items:center;justify-content:center;min-height:282px;border-radius:20px;border:1px solid ${palette.border};background:radial-gradient(circle at 50% 32%, ${frameGlow}, rgba(255,255,255,0) 46%),radial-gradient(circle at 50% 68%, rgba(255,255,255,.06), rgba(255,255,255,0) 56%),linear-gradient(180deg, rgba(20,26,38,.96), rgba(9,12,19,.98));box-shadow: inset 0 0 42px rgba(0,0,0,.48), 0 0 24px rgba(0,0,0,.24);overflow:hidden;">
         <div style="position:absolute;inset:16px;border-radius:16px;border:1px solid rgba(255,255,255,.08);"></div>
         <div style="position:absolute;width:210px;height:210px;border-radius:50%;border:1px solid rgba(255,255,255,.08);box-shadow:0 0 28px ${frameGlow}, inset 0 0 28px rgba(255,255,255,.03);"></div>
         <img src="${imgSrc}" alt="${label}" style="position:relative;z-index:2;width:224px;height:224px;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 14px 16px rgba(0,0,0,.55)) drop-shadow(0 0 18px ${frameGlow});" />
         <div style="position:absolute;left:18px;bottom:14px;padding:6px 10px;border-radius:999px;background:rgba(8,12,18,.72);border:1px solid rgba(255,255,255,.08);font-size:11px;color:rgba(255,255,255,.82);letter-spacing:.06em;">${label}</div>
       </div>`
    : `<div style="display:flex;align-items:center;justify-content:center;min-height:282px;border-radius:20px;border:1px solid ${palette.border};background:linear-gradient(180deg, rgba(20,26,38,.96), rgba(9,12,19,.98));color:rgba(255,255,255,.45);font-size:12px;">NO IMAGE</div>`;

  return `<span class="equipment-preview" style="display:block;margin-top:14px;padding:16px;border:1px solid ${palette.border};border-radius:22px;background:radial-gradient(circle at 82% 18%, rgba(255,255,255,.06), rgba(255,255,255,0) 24%),linear-gradient(135deg, rgba(13,18,28,.98), rgba(18,14,27,.98));box-shadow:inset 0 0 55px rgba(0,0,0,.46),0 12px 28px rgba(0,0,0,.24);">
    <span style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:12px;">
      <span style="display:flex;flex-direction:column;gap:4px;">
        <span style="font-size:12px;letter-spacing:.1em;color:rgba(255,255,255,.58);">EQUIPMENT VISION</span>
        <span style="font-size:25px;font-weight:800;line-height:1.1;color:rgba(255,255,255,.98);">${label}</span>
      </span>
      <span style="display:inline-flex;align-items:center;padding:7px 12px;border-radius:999px;border:1px solid ${palette.border};color:${accent};background:rgba(255,255,255,.03);font-size:12px;font-weight:700;">${escapeHtml(rarity)}</span>
    </span>
    <span style="display:grid;grid-template-columns:minmax(0,1.12fr) minmax(260px,.88fr);gap:16px;align-items:stretch;">
      <span style="display:flex;flex-direction:column;justify-content:space-between;padding:16px 17px;border-radius:18px;border:1px solid rgba(255,255,255,.07);background:linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,.01));min-height:282px;">
        <span>
          <span style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
            <span style="display:inline-flex;gap:6px;align-items:center;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);font-size:12px;color:rgba(255,255,255,.88);"><b style="color:${accent};">${statLabel}</b><span>${escapeHtml(String(statValue))}</span></span>
            <span style="display:inline-flex;gap:6px;align-items:center;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);font-size:12px;color:rgba(255,255,255,.88);"><b style="color:${accent};">分類</b><span>${item.category === 'weapon' ? '武器' : '防具'}</span></span>
          </span>
          <span style="display:block;font-size:12px;letter-spacing:.12em;color:rgba(255,255,255,.52);margin-bottom:7px;">固有能力</span>
          <span style="display:block;font-size:20px;line-height:1.18;font-weight:800;color:${palette.glow};margin-bottom:8px;">${abilityName}</span>
          <span style="display:block;font-size:14px;line-height:1.7;color:rgba(255,255,255,.9);margin-bottom:14px;">${ability}</span>
          <span style="display:block;height:1px;background:linear-gradient(90deg, rgba(255,255,255,.12), rgba(255,255,255,0));margin:10px 0 14px;"></span>
          <span style="display:block;font-size:12px;letter-spacing:.12em;color:rgba(255,255,255,.52);margin-bottom:7px;">装備解説</span>
          <span style="display:block;font-size:13px;line-height:1.7;color:rgba(255,255,255,.76);">${flavor}</span>
        </span>
        <span style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-top:14px;">
          <span style="font-size:11px;line-height:1.6;color:rgba(255,255,255,.45);">名前・レア度・固有能力に合わせて装備絵を個別表示。</span>
          <span style="font-size:11px;letter-spacing:.12em;color:${accent};">DEEP LOOT</span>
        </span>
      </span>
      ${artBlock}
    </span>
  </span>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[char] ?? char);
}
