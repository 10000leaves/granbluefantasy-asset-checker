# グラブル所持チェッカー

グラブルのキャラ、武器、召喚石などのアセット管理ツールです。

## 機能

- キャラ、武器、召喚石の管理
- 画像アップロード
- タグによる分類と検索
- CSVと画像のまとめてアップロード
- 実装年月日による並び替え

## 技術スタック

- Next.js
- TypeScript
- Material UI
- PostgreSQL
- Vercel Blob Storage (画像ストレージ)

## セットアップ

### 必要条件

- Node.js 18.x以上
- PostgreSQL 14.x以上

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/granbluefantasy-asset-checker.git
cd granbluefantasy-asset-checker

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localを編集して必要な環境変数を設定

# データベースのセットアップ
psql -U postgres -f src/lib/db/schema.sql

# 開発サーバーの起動
npm run dev
```

## データベースマイグレーション

既存のデータベースを更新する場合は、以下のコマンドを実行します：

```bash
# マイグレーションスクリプトの実行
npx tsx src/lib/db/migrate.ts
```

## CSVによるまとめてアップロード

キャラ、武器、召喚石をCSVファイルと画像ファイルでまとめてアップロードできます。

### CSVフォーマット

#### キャラ
```csv
name,imageName,attribute,rarity,type,race,gender,weapons,releaseWeapon,obtainMethod,implementationDate
キャラ名,画像ファイル名.jpg,火/水/土/風/光/闇,SSR/SR/R,攻撃/防御/回復/バランス/特殊,ヒューマン/ドラフ/エルーン/ハーヴィン/その他/星晶獣,♂/♀/不明,剣|槍|斧|弓|杖|短剣|格闘|銃|刀|楽器,剣/槍/斧/弓/杖/短剣/格闘/銃/刀/楽器,恒常/リミテッド/季節限定/コラボ/その他,YYYY-MM-DD
```

#### 武器
```csv
name,imageName,attribute,weaponType,rarity,implementationDate
武器名,画像ファイル名.jpg,火/水/土/風/光/闇,剣/槍/斧/弓/杖/短剣/格闘/銃/刀/楽器,SSR/SR/R,YYYY-MM-DD
```

#### 召喚石
```csv
name,imageName,attribute,rarity,implementationDate
召喚石名,画像ファイル名.jpg,火/水/土/風/光/闇,SSR/SR/R,YYYY-MM-DD
```

### 注意事項

- `imageName`は、アップロードする画像ファイルの名前と一致させる必要があります
- `weapons`（得意武器）は複数ある場合、`|`で区切ります
- `implementationDate`は必須項目で、YYYY-MM-DD形式で指定します

## 実装年月日について

- すべてのアイテム（キャラ、武器、召喚石）には実装年月日が必須項目として設定されています
- 実装年月日は新しい順に表示されます

## ライセンス

MIT
