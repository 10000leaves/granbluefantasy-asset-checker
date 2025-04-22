import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { query } from '@/lib/db';
import { parse } from 'csv-parse/sync';

// CSVデータの型定義
interface CharacterCsvData {
  name: string;
  imageName: string;
  attribute: string;
  rarity?: string;
  type?: string;
  race?: string;
  gender?: string;
  weapons?: string;
  releaseWeapon?: string;
  obtainMethod?: string;
  implementationDate?: string;
  [key: string]: string | undefined;
}

interface WeaponCsvData {
  name: string;
  imageName: string;
  attribute: string;
  weaponType: string;
  rarity?: string;
  implementationDate?: string;
  [key: string]: string | undefined;
}

interface SummonCsvData {
  name: string;
  imageName: string;
  attribute: string;
  rarity?: string;
  implementationDate?: string;
  [key: string]: string | undefined;
}

type CsvData = CharacterCsvData | WeaponCsvData | SummonCsvData;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const category = formData.get('category') as string;
    const csvFile = formData.get('csv') as File;
    
    if (!csvFile || !category) {
      return NextResponse.json(
        { error: 'CSV file and category are required' },
        { status: 400 }
      );
    }

    // CSVファイルの内容を取得
    const csvText = await csvFile.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvData[];

    // 画像ファイルの処理
    const imageFiles = new Map<string, File>();
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('images[') && value instanceof File) {
        const imageName = key.match(/images\[(.*?)\]/)?.[1];
        if (imageName) {
          imageFiles.set(imageName, value as File);
        }
      }
    }

    // 結果を格納する配列
    const results = [];
    const errors = [];

    // 各レコードを処理
    for (const record of records) {
      try {
        // 画像名からファイルを取得
        const imageFile = imageFiles.get(record.imageName);
        if (!imageFile) {
          errors.push({
            record,
            error: `Image file not found for ${record.imageName}`,
          });
          continue;
        }

        // 画像をアップロード
        const blob = await put(imageFile.name, imageFile, {
          access: 'public',
        });
        const imageUrl = blob.url;

        // アイテムをデータベースに保存
        const { rows: [item] } = await query(
          'INSERT INTO items (name, image_url, category, implementation_date) VALUES ($1, $2, $3, $4) RETURNING id, name, image_url, category, implementation_date',
          [record.name, imageUrl, category, record.implementationDate]
        );

        // カテゴリに応じたタグを取得
        const { rows: tagCategories } = await query(
          'SELECT * FROM tag_categories WHERE item_type = $1',
          [category]
        );

        // タグを保存
        for (const tagCategory of tagCategories) {
          // カテゴリ名をスネークケースに変換してレコードのキーと照合
          const categoryKey = tagCategory.name.toLowerCase().replace(/\s+/g, '_');
          
          // 特殊処理: 得意武器（複数可能）
          if (tagCategory.name === '得意武器' && record.weapons) {
            // パイプ区切りで複数の武器を処理
            const weaponValues = record.weapons.split('|');
            for (const weaponValue of weaponValues) {
              if (weaponValue.trim()) {
                // タグ値を検索または作成
                const { rows: [existingTagValue] } = await query(
                  'SELECT * FROM tag_values WHERE category_id = $1 AND value = $2',
                  [tagCategory.id, weaponValue.trim()]
                );

                let tagValueId;
                if (existingTagValue) {
                  tagValueId = existingTagValue.id;
                } else {
                  // 新しいタグ値を作成
                  const { rows: [newTagValue] } = await query(
                    'INSERT INTO tag_values (category_id, value, order_index) VALUES ($1, $2, (SELECT COALESCE(MAX(order_index), 0) + 1 FROM tag_values WHERE category_id = $1)) RETURNING id',
                    [tagCategory.id, weaponValue.trim()]
                  );
                  tagValueId = newTagValue.id;
                }

                // アイテムとタグを関連付け
                await query(
                  'INSERT INTO item_tags (item_id, tag_value_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                  [item.id, tagValueId]
                );
              }
            }
          }
          // 特殊処理: 解放武器
          else if (tagCategory.name === '解放武器' && record.releaseWeapon) {
            // タグ値を検索または作成
            const { rows: [existingTagValue] } = await query(
              'SELECT * FROM tag_values WHERE category_id = $1 AND value = $2',
              [tagCategory.id, record.releaseWeapon]
            );

            let tagValueId;
            if (existingTagValue) {
              tagValueId = existingTagValue.id;
            } else {
              // 新しいタグ値を作成
              const { rows: [newTagValue] } = await query(
                'INSERT INTO tag_values (category_id, value, order_index) VALUES ($1, $2, (SELECT COALESCE(MAX(order_index), 0) + 1 FROM tag_values WHERE category_id = $1)) RETURNING id',
                [tagCategory.id, record.releaseWeapon]
              );
              tagValueId = newTagValue.id;
            }

            // アイテムとタグを関連付け
            await query(
              'INSERT INTO item_tags (item_id, tag_value_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [item.id, tagValueId]
            );
          }
          // 通常処理: その他のタグ
          else {
            const tagValue = record[categoryKey];
            
            if (tagValue) {
              // タグ値を検索または作成
              const { rows: [existingTagValue] } = await query(
                'SELECT * FROM tag_values WHERE category_id = $1 AND value = $2',
                [tagCategory.id, tagValue]
              );

              let tagValueId;
              if (existingTagValue) {
                tagValueId = existingTagValue.id;
              } else {
                // 新しいタグ値を作成
                const { rows: [newTagValue] } = await query(
                  'INSERT INTO tag_values (category_id, value, order_index) VALUES ($1, $2, (SELECT COALESCE(MAX(order_index), 0) + 1 FROM tag_values WHERE category_id = $1)) RETURNING id',
                  [tagCategory.id, tagValue]
                );
                tagValueId = newTagValue.id;
              }

              // アイテムとタグを関連付け
              await query(
                'INSERT INTO item_tags (item_id, tag_value_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [item.id, tagValueId]
              );
            }
          }
        }

        results.push({
          id: item.id,
          name: item.name,
          imageUrl: item.image_url,
          category: item.category,
        });
      } catch (error) {
        console.error('Error processing record:', record, error);
        errors.push({
          record,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      errors,
      total: records.length,
      processed: results.length,
      failed: errors.length,
    });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
