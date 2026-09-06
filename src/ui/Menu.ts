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

  const heroArt: Record<string, string> = {
    '終夜の剣': '/equipment_art/weapons/WPN-054.png',
    '坑道作業服': '/equipment_art/armors/ARM-028.png',
  };

  const heroSrc = heroArt[item.name] ?? '';
  const accent = palette.accent;
  const border = palette.border;

  let motif = '迷宮の奥で見つかる装備。';
  if (/月|夜|影|終夜|月影/.test(item.name)) motif = '月光と夜気をまとった、静かで禍々しい装備。';
  else if (/炎|火|紅|焦/.test(item.name)) motif = '熱と火花を帯びた、攻撃的な装備。';
  else if (/氷|雪|霜|凍/.test(item.name)) motif = '冷気がにじむ、張りつめた装備。';
  else if (/雷|紫電/.test(item.name)) motif = '紫電が走る、瞬発力を感じさせる装備。';
  else if (/毒|蛇|蟲|苔/.test(item.name)) motif = '毒気や湿りをまとった、異質な装備。';
  else if (/骨|骸|墓/.test(item.name)) motif = '死骸や遺物の意匠を宿す、不穏な装備。';
  else if (/聖|天使|光/.test(item.name)) motif = '清浄な光の加護を帯びた神聖な装備。';
  else if (/竜|龍/.test(item.name)) motif = '竜の威圧感を思わせる重厚な装備。';

  const visual = heroSrc
    ? `<span style="display:flex;flex-direction:column;gap:10px;padding:12px;border-radius:20px;border:1px solid ${border};background:linear-gradient(180deg,rgba(11,15,24,.99),rgba(5,8,13,.99));min-height:332px;box-shadow:inset 0 0 40px rgba(0,0,0,.52);">
         <span style="display:flex;justify-content:space-between;align-items:center;">
           <span style="font-size:11px;letter-spacing:.14em;color:rgba(255,255,255,.52);">専用装備アート</span>
           <span style="font-size:11px;color:${accent};">${escapeHtml(rarity)}</span>
         </span>
         <span style="position:relative;display:flex;align-items:center;justify-content:center;flex:1;min-height:260px;border-radius:16px;border:1px solid rgba(255,255,255,.07);overflow:hidden;background:#090d14;">
           <img src="${heroSrc}" alt="${label}" style="width:100%;height:100%;object-fit:cover;display:block;" />
         </span>
       </span>`
    : `<span style="display:flex;align-items:center;justify-content:center;min-height:332px;border-radius:20px;border:1px solid ${border};background:#090d14;color:rgba(255,255,255,.45);font-size:12px;padding:18px;text-align:center;">この装備の専用アートは次の生成バッチで追加</span>`;

  return `<span class="equipment-preview" style="display:block;margin-top:14px;padding:16px;border-radius:24px;border:1px solid ${border};background:linear-gradient(135deg,rgba(8,12,19,.99),rgba(16,12,23,.99));box-shadow:inset 0 0 56px rgba(0,0,0,.48),0 14px 30px rgba(0,0,0,.24);">
    <span style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:13px;">
      <span>
        <span style="display:block;font-size:11px;letter-spacing:.16em;color:rgba(255,255,255,.50);margin-bottom:4px;">EQUIPMENT</span>
        <span style="display:block;font-size:26px;line-height:1.1;font-weight:800;color:rgba(255,255,255,.98);">${label}</span>
      </span>
      <span style="display:inline-flex;align-items:center;padding:7px 12px;border-radius:999px;border:1px solid ${border};background:rgba(255,255,255,.035);color:${accent};font-size:12px;font-weight:700;">${escapeHtml(rarity)}</span>
    </span>
    <span style="display:grid;grid-template-columns:minmax(0,1fr) minmax(290px,.92fr);gap:16px;align-items:stretch;">
      <span style="display:flex;flex-direction:column;justify-content:space-between;padding:17px 18px;border-radius:20px;border:1px solid rgba(255,255,255,.07);background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.012));min-height:332px;">
        <span>
          <span style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:15px;">
            <span style="display:inline-flex;gap:6px;align-items:center;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);font-size:12px;color:rgba(255,255,255,.9);"><b style="color:${accent};">${statLabel}</b><span>${escapeHtml(String(statValue))}</span></span>
            <span style="display:inline-flex;gap:6px;align-items:center;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);font-size:12px;color:rgba(255,255,255,.9);"><b style="color:${accent};">分類</b><span>${item.category === 'weapon' ? '武器' : '防具'}</span></span>
          </span>
          <span style="display:block;font-size:12px;letter-spacing:.14em;color:rgba(255,255,255,.50);margin-bottom:7px;">固有能力</span>
          <span style="display:block;font-size:21px;line-height:1.2;font-weight:800;color:${palette.glow};margin-bottom:9px;">${abilityName}</span>
          <span style="display:block;font-size:14px;line-height:1.72;color:rgba(255,255,255,.91);margin-bottom:17px;">${ability}</span>
          <span style="display:block;height:1px;background:linear-gradient(90deg,rgba(255,255,255,.12),rgba(255,255,255,0));margin:6px 0 15px;"></span>
          <span style="display:block;font-size:12px;letter-spacing:.14em;color:rgba(255,255,255,.50);margin-bottom:7px;">装備イメージ</span>
          <span style="display:block;font-size:13px;line-height:1.75;color:rgba(255,255,255,.76);">${escapeHtml(motif)}</span>
        </span>
      </span>
      ${visual}
    </span>
  </span>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[char] ?? char);
}
