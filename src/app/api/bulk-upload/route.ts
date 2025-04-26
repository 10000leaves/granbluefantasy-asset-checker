import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { query } from "@/lib/db";
import { parse } from "csv-parse/sync";

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

// CSVヘッダーとタグカテゴリ名の対応関係
const csvHeaderToTagCategory: Record<string, string> = {
  attribute: "属性",
  rarity: "レアリティ",
  type: "タイプ",
  race: "種族",
  gender: "性別",
  weapons: "得意武器",
  releaseWeapon: "解放武器",
  obtainMethod: "入手方法",
  weaponType: "武器種",
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const category = formData.get("category") as string;
    const csvFile = formData.get("csv") as File;

    if (!csvFile || !category) {
      return NextResponse.json(
        { error: "CSV file and category are required" },
        { status: 400 },
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
      if (key.startsWith("images[") && value instanceof File) {
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
          access: "public",
        });
        const imageUrl = blob.url;

        // 実装年月日が指定されていない場合は現在の日付を使用
        const implementationDate =
          record.implementationDate || new Date().toISOString().split("T")[0];

        // アイテムをデータベースに保存
        const {
          rows: [item],
        } = await query(
          "INSERT INTO items (name, image_url, category, implementation_date) VALUES ($1, $2, $3, $4) RETURNING id, name, image_url, category, implementation_date",
          [record.name, imageUrl, category, implementationDate],
        );

        // カテゴリに応じたタグを取得
        const { rows: tagCategories } = await query(
          "SELECT * FROM tag_categories WHERE item_type = $1",
          [category],
        );

        // CSVのヘッダーとレコードの値を処理
        for (const [header, value] of Object.entries(record)) {
          // nameとimageNameとimplementationDateはタグではないのでスキップ
          if (
            header === "name" ||
            header === "imageName" ||
            header === "implementationDate"
          ) {
            continue;
          }

          // 値が空の場合はスキップ
          if (!value || value.trim() === "") {
            continue;
          }

          // CSVヘッダーに対応するタグカテゴリ名を取得
          const categoryName = csvHeaderToTagCategory[header];
          if (!categoryName) {
            console.log(`No tag category mapping for CSV header: ${header}`);
            continue;
          }

          // タグカテゴリを検索
          const tagCategory = tagCategories.find(
            (cat) => cat.name === categoryName,
          );
          if (!tagCategory) {
            console.log(`Tag category not found: ${categoryName}`);
            continue;
          }

          // 特殊処理: 得意武器（複数可能）
          if (categoryName === "得意武器" && header === "weapons") {
            // パイプ区切りで複数の武器を処理
            const weaponValues = value.split("|");
            for (const weaponValue of weaponValues) {
              if (weaponValue.trim()) {
                // タグ値を検索または作成
                const {
                  rows: [existingTagValue],
                } = await query(
                  "SELECT * FROM tag_values WHERE category_id = $1 AND value = $2",
                  [tagCategory.id, weaponValue.trim()],
                );

                let tagValueId;
                if (existingTagValue) {
                  tagValueId = existingTagValue.id;
                } else {
                  // 新しいタグ値を作成
                  const {
                    rows: [newTagValue],
                  } = await query(
                    "INSERT INTO tag_values (category_id, value, order_index) VALUES ($1, $2, (SELECT COALESCE(MAX(order_index), 0) + 1 FROM tag_values WHERE category_id = $1)) RETURNING id",
                    [tagCategory.id, weaponValue.trim()],
                  );
                  tagValueId = newTagValue.id;
                }

                // アイテムとタグを関連付け
                await query(
                  "INSERT INTO item_tags (item_id, tag_value_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                  [item.id, tagValueId],
                );
              }
            }
          } else {
            // 通常処理: その他のタグ
            // タグ値を検索または作成
            const {
              rows: [existingTagValue],
            } = await query(
              "SELECT * FROM tag_values WHERE category_id = $1 AND value = $2",
              [tagCategory.id, value],
            );

            let tagValueId;
            if (existingTagValue) {
              tagValueId = existingTagValue.id;
            } else {
              // 新しいタグ値を作成
              const {
                rows: [newTagValue],
              } = await query(
                "INSERT INTO tag_values (category_id, value, order_index) VALUES ($1, $2, (SELECT COALESCE(MAX(order_index), 0) + 1 FROM tag_values WHERE category_id = $1)) RETURNING id",
                [tagCategory.id, value],
              );
              tagValueId = newTagValue.id;
            }

            // アイテムとタグを関連付け
            await query(
              "INSERT INTO item_tags (item_id, tag_value_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
              [item.id, tagValueId],
            );
          }
        }

        results.push({
          id: item.id,
          name: item.name,
          imageUrl: item.image_url,
          category: item.category,
        });
      } catch (error) {
        console.error("Error processing record:", record, error);
        errors.push({
          record,
          error: error instanceof Error ? error.message : "Unknown error",
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
    console.error("Error in bulk upload:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
