import { query } from './index';

async function migrate() {
  try {
    console.log('Starting migration...');

    // 実装年月日カラムを追加（デフォルト値として現在の日付を設定）
    await query(`
      ALTER TABLE items
      ADD COLUMN implementation_date DATE DEFAULT CURRENT_DATE;
    `);

    console.log('Added implementation_date column to items table');

    // デフォルト値制約を削除し、NOT NULL制約を追加
    await query(`
      ALTER TABLE items
      ALTER COLUMN implementation_date SET NOT NULL;
    `);

    console.log('Set implementation_date column to NOT NULL');

    // 実装年月日のインデックスを作成
    await query(`
      CREATE INDEX idx_items_implementation_date ON items(implementation_date);
    `);

    console.log('Created index on implementation_date column');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();
