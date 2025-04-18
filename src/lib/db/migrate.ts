import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// 環境変数の読み込み
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}

async function migrate() {
  if (!process.env.DATABASE_URL_UNPOOLED) {
    console.error('DATABASE_URL_UNPOOLED is not defined');
    process.exit(1);
  }

  // データベースプールの設定
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL_UNPOOLED,
    ssl: {
      rejectUnauthorized: true,
    },
  });

  try {
    console.log('Starting database migration...');
    console.log('Using database URL:', process.env.DATABASE_URL_UNPOOLED);

    // ドロップスクリプトを読み込む
    const dropPath = path.join(process.cwd(), 'src', 'lib', 'db', 'drop.sql');
    const dropSQL = fs.readFileSync(dropPath, 'utf8');

    // スキーマファイルを読み込む
    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // シードファイルを読み込む
    const seedPath = path.join(process.cwd(), 'src', 'lib', 'db', 'seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    // トランザクションを開始
    await pool.query('BEGIN');

    try {
      console.log('Dropping existing tables...');
      // 既存のテーブルを削除
      await pool.query(dropSQL);

      console.log('Creating tables...');
      // スキーマを適用
      await pool.query(schemaSQL);

      console.log('Inserting seed data...');
      // シードデータを投入
      await pool.query(seedSQL);

      // トランザクションをコミット
      await pool.query('COMMIT');

      console.log('Migration completed successfully!');
    } catch (err) {
      // エラーが発生した場合はロールバック
      await pool.query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // データベース接続を閉じる
    await pool.end();
  }
}

// スクリプトが直接実行された場合のみマイグレーションを実行
if (require.main === module) {
  migrate();
}

export default migrate;
