-- キャラのタグカテゴリとタグ値
WITH inserted_categories AS (
  INSERT INTO tag_categories (name, item_type, multiple_select, required, order_index)
  VALUES
    ('属性', 'character', false, true, 1),
    ('得意武器', 'character', true, false, 2),
    ('性別', 'character', false, false, 3),
    ('種族', 'character', false, false, 4),
    ('タイプ', 'character', false, true, 5),
    ('解放武器', 'character', false, false, 6),
    ('入手方法', 'character', false, false, 7),
    ('レアリティ', 'character', false, false, 8)
  RETURNING id, name
)
INSERT INTO tag_values (category_id, value, order_index)
SELECT 
  ic.id,
  v.value,
  v.order_index
FROM inserted_categories ic
CROSS JOIN (
  VALUES
    -- 属性
    ('属性', '火', 1), ('属性', '水', 2), ('属性', '土', 3),
    ('属性', '風', 4), ('属性', '光', 5), ('属性', '闇', 6),
    -- 得意武器
    ('得意武器', '剣', 1), ('得意武器', '槍', 2), ('得意武器', '斧', 3),
    ('得意武器', '弓', 4), ('得意武器', '杖', 5), ('得意武器', '短剣', 6),
    ('得意武器', '格闘', 7), ('得意武器', '銃', 8), ('得意武器', '刀', 9),
    ('得意武器', '楽器', 10),
    -- 性別
    ('性別', '♂', 1), ('性別', '♀', 2), ('性別', '不明', 3),
    -- 種族
    ('種族', 'ヒューマン', 1), ('種族', 'ドラフ', 2), ('種族', 'エルーン', 3),
    ('種族', 'ハーヴィン', 4), ('種族', 'その他', 5), ('種族', '星晶獣', 6),
    -- タイプ
    ('タイプ', '攻撃', 1), ('タイプ', '防御', 2), ('タイプ', '回復', 3),
    ('タイプ', 'バランス', 4), ('タイプ', '特殊', 5),
    -- 解放武器
    ('解放武器', '剣', 1), ('解放武器', '槍', 2), ('解放武器', '斧', 3),
    ('解放武器', '弓', 4), ('解放武器', '杖', 5), ('解放武器', '短剣', 6),
    ('解放武器', '格闘', 7), ('解放武器', '銃', 8), ('解放武器', '刀', 9),
    ('解放武器', '楽器', 10),
    -- 入手方法
    ('入手方法', '恒常', 1), ('入手方法', 'リミテッド', 2),
    ('入手方法', '季節限定', 3), ('入手方法', 'コラボ', 4),
    ('入手方法', 'その他', 5),
    -- レアリティ
    ('レアリティ', 'SSR', 1), ('レアリティ', 'SR', 2), ('レアリティ', 'R', 3)
) AS v(category_name, value, order_index)
WHERE ic.name = v.category_name;

-- 武器のタグカテゴリとタグ値
WITH inserted_categories AS (
  INSERT INTO tag_categories (name, item_type, multiple_select, required, order_index)
  VALUES
    ('属性', 'weapon', false, true, 1),
    ('武器種', 'weapon', false, true, 2),
    ('レアリティ', 'weapon', false, false, 3)
  RETURNING id, name
)
INSERT INTO tag_values (category_id, value, order_index)
SELECT 
  ic.id,
  v.value,
  v.order_index
FROM inserted_categories ic
CROSS JOIN (
  VALUES
    -- 属性
    ('属性', '火', 1), ('属性', '水', 2), ('属性', '土', 3),
    ('属性', '風', 4), ('属性', '光', 5), ('属性', '闇', 6),
    -- 武器種
    ('武器種', '剣', 1), ('武器種', '槍', 2), ('武器種', '斧', 3),
    ('武器種', '弓', 4), ('武器種', '杖', 5), ('武器種', '短剣', 6),
    ('武器種', '格闘', 7), ('武器種', '銃', 8), ('武器種', '刀', 9),
    ('武器種', '楽器', 10),
    -- レアリティ
    ('レアリティ', 'SSR', 1), ('レアリティ', 'SR', 2), ('レアリティ', 'R', 3)
) AS v(category_name, value, order_index)
WHERE ic.name = v.category_name;

-- 召喚石のタグカテゴリとタグ値
WITH inserted_categories AS (
  INSERT INTO tag_categories (name, item_type, multiple_select, required, order_index)
  VALUES
    ('属性', 'summon', false, true, 1),
    ('レアリティ', 'summon', false, false, 2)
  RETURNING id, name
)
INSERT INTO tag_values (category_id, value, order_index)
SELECT 
  ic.id,
  v.value,
  v.order_index
FROM inserted_categories ic
CROSS JOIN (
  VALUES
    ('属性', '火', 1), ('属性', '水', 2), ('属性', '土', 3),
    ('属性', '風', 4), ('属性', '光', 5), ('属性', '闇', 6),
    ('レアリティ', 'SSR', 1), ('レアリティ', 'SR', 2), ('レアリティ', 'R', 3)
) AS v(category_name, value, order_index)
WHERE ic.name = v.category_name;

-- ユーザー入力グループの作成
INSERT INTO input_groups (name, order_index)
VALUES
  ('基本情報', 1),
  ('希望', 2),
  ('マナベリ', 3),
  ('大事なもの', 4);

-- ユーザー入力項目の作成
WITH group_ids AS (
  SELECT id, name FROM input_groups
)
INSERT INTO input_items (name, type, required, default_value, group_id, order_index)
SELECT
  i.name,
  i.type,
  i.required,
  i.default_value,
  g.id,
  i.order_index
FROM group_ids g
JOIN (
  VALUES
    -- 基本情報
    ('名前', 'text', true, NULL, 'basic', 1),
    
    -- 希望
    ('手動', 'checkbox', false, 'false', 'preference', 1),
    ('フルオート', 'checkbox', false, 'false', 'preference', 2),
    
    -- マナベリ
    ('ウロボロスミニステル', 'checkbox', false, 'false', 'manaberi', 1),
    ('アガスティアダブル', 'checkbox', false, 'false', 'manaberi', 2),
    ('ダークラプチャーダブル', 'checkbox', false, 'false', 'manaberi', 3),
    ('ペルフィード', 'checkbox', false, 'false', 'manaberi', 4),
    
    -- 大事なもの
    ('レガリア2000', 'checkbox', false, 'false', 'important', 1),
    ('六龍2000', 'checkbox', false, 'false', 'important', 2),
    ('キャラ与ダメ', 'number', false, '0', 'important', 3)
) AS i(name, type, required, default_value, group_name, order_index)
ON g.name = CASE 
  WHEN i.group_name = 'basic' THEN '基本情報'
  WHEN i.group_name = 'preference' THEN '希望'
  WHEN i.group_name = 'manaberi' THEN 'マナベリ'
  WHEN i.group_name = 'important' THEN '大事なもの'
END;
