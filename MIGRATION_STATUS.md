# DEEP LOOT ローカル移行ステータス

## 今回移植済み

- Canvas 736x420
- 現行ステージ足場配置
- 主人公移動 / ジャンプ
- 主人公5フレーム剣攻撃
- 攻撃10ダメージ / 1攻撃1ヒット
- 青スライム
  - crawl
  - cling
  - drop
  - pounce
- ゴブリン
  - walk
  - swing
  - leap
  - smash
- スライム / ゴブリン被弾ノックバック
- 現行HUD
- リセット

## 先祖返り対策

- 採用済み画像を `assets/` へ個別ファイルとして固定
- SHA-256 manifest を追加
- `npm run verify:assets` で画像変更を検出
- 旧HTMLを `legacy/` に保存
- 元画像保管場所 `assets/reference/` を分離

## 今回まだやっていないこと

- 元のフルサイズ比較アニメーションシートの同梱
  - 現在の作業環境に実ファイルが存在しないため、ゲーム画面切り抜きで代用していない
- Phaser / Godot / Unity への移行
- ステージエディタ
- セーブデータ
- 敵データJSONの完全外部化
- 歩行専用主人公アニメーションの追加

## ビルド検証

- `npm run verify` : PASS
  - 採用素材SHA-256: PASS
  - TypeScript `tsc --noEmit`: PASS
- Vite本ビルド: この作業環境では `npm install` が通信タイムアウトしたため未実行
  - ローカル側で `npm install` 後 `npm run build` を実行する

## v5 - 装備能力スロットUI
- 武器・防具の「名前」と「能力スロット」を分離。
- 装備カード上段: 名前 / 基礎攻撃・防御 / 固有能力。
- 装備カード下段: 能力スロット 1〜8 を4列×2段で常時表示。
- 空き能力スロットは「＋ 空き」と明示。
- 武器・防具の所持枠は従来どおり各8枠を維持。
- 古びた長剣は固有能力なし。
- ドロップ装備には最低1つのスロット能力をランダム付与。


## v6
- Equipment ability slots redesigned for readability.
- Added CONNECT_GITHUB.bat / UPDATE.bat.
- START_LOCAL.bat now pulls from GitHub automatically when connected.
- Portable Git bootstrap added; no global Git installation required.


- v9: 主人公とモンスターの頭上に赤色HPゲージを表示。


## v13 dungeon overhaul
- 主人公6フレーム歩行PNGへ変更。
- ゴブリン歩行6 / 棍棒5 / 飛び掛かり3 / 叩きつけ4フレームを実画像化。
- 宝箱を各階に配置し、E/Enterで装備またはアイテム＋Gを取得。
- ワールドを1472x840へ拡張し、カメラ追従＋4層の分岐/落下ルートを持つダンジョンを自動生成。

## v14
- Removed the large rectangular room-outline decoration that looked like a UI window.
- Bat HP reduced to 13.
- HP bars moved above each visible sprite head.
- Added K-key fireball projectile with 8-frame animation.
- Added Roper with 4-frame idle / 4-frame tentacle attack.
- Added small Slug with 6-frame crawl.
- Added small Rat with 6-frame run / bite animation.
- Added Skeleton with 6-frame walk / 4-frame sword attack.
