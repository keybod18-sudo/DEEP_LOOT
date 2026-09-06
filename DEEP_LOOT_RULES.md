# DEEP LOOT 固定ルール

1. 現行の正常版を基準に差分修正する。
2. 採用済み素材を勝手に生成画像へ差し替えない。
3. スライム・ゴブリン・主人公など、変更対象外の素材は触らない。
4. 元画像とゲーム画面切り抜きを混同しない。
5. 素材変更前後は `npm run verify:assets` で確認する。
6. 正常動作版はGitでcommitしてから次の変更へ進む。
7. 実際に確認していない項目を「確認済み」としない。

## Sprite extraction validation
- Never split generated animation sheets using equal-size grid cells unless the sheet was explicitly generated as a mathematically uniform grid.
- Detect actual opaque-pixel row/column regions and crop one complete character per frame.
- After extraction, verify transparent padding remains on all four edges of every frame.
- Reject any frame containing a neighboring body part, detached weapon from another frame, or clipped weapon/tentacle.

## Effect transparency rule
- Projectile/effect sprites must keep a transparent background.
- Do not add rectangular fill/glow panels behind fireballs, lightning, ice, slash effects, or monsters unless explicitly requested.
- Before delivery, verify all four image corners are transparent for sprite/effect PNGs and inspect render code for unintended background rectangles.

## Added visibility / implementation rule
- 新規モンスター追加時は、画像や定義だけで終わらせず、必ず出現処理・当たり判定・HPバー表示まで実装する。
- 追加直後の新規モンスターは、最初の数画面で確認できる位置へ最低1体確定配置する。


## Direction / attachment validation rule
- Every directional sprite must declare the direction the source art actually faces; do not guess flip conditions independently in each renderer.
- Before delivery, compare logical movement/attack direction against the actual source frame direction for every changed directional monster.
- Body-attached parts (fuse, weapon, tail, tentacle anchor, etc.) must share the same transform as the body unless the animation explicitly separates them.
- A moving enemy must never visually face away from its actual movement/attack target unless that behavior is intentionally specified.

## Visual background audit
- When a user reports a rectangular background behind a projectile/effect, inspect every object drawn behind it as well as the projectile itself.
- Stairs, doors, room zones, debug shapes and effect glows must not visually masquerade as a sprite background.
- Major explosions must use a multi-frame sprite animation or equivalent layered animation, not a single expanding circle.

## Runtime update completeness rule
- APPLY_UPDATE.bat must not assume that a previous asset-only update was applied successfully.
- When a change introduces or depends on runtime-loaded assets, ship the complete current assets/src/data set in the updater.
- A missing optional/obsolete projectile image must never prevent Game.start(); procedural effects should not await unused image files.
