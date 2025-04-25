// データモデルの型定義

// ユーザー入力項目の型
export type InputItemType = 'text' | 'number' | 'checkbox' | 'radio' | 'select' | 'date';

export interface InputItem {
  id: string;
  name: string;
  type: InputItemType;
  required: boolean;
  defaultValue?: string | number | boolean;
  groupId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// ユーザー入力グループの型
export interface InputGroup {
  id: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// タグカテゴリの型
export type ItemType = 'character' | 'weapon' | 'summon';

export type ElementType = 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';
export type RarityType = 'SSR' | 'SR' | 'R';

export interface TagCategory {
  id: string;
  name: string;
  itemType: ItemType;
  multipleSelect: boolean;
  required: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// タグ値の型
export interface TagValue {
  id: string;
  categoryId: string;
  value: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// アイテムの型
export interface Item {
  id: string;
  name: string;
  imageUrl: string;
  category: ItemType;
  implementationDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// アイテムとタグの関連付けの型
export interface ItemTag {
  id: string;
  itemId: string;
  tagValueId: string;
  createdAt: Date;
}

// 管理者設定の型
export interface AdminSettings {
  itemTypes: ItemType[];
  defaultTagCategories: {
    [key in ItemType]: {
      name: string;
      multipleSelect: boolean;
      required: boolean;
      values: string[];
    }[];
  };
}

// 初期設定のタグカテゴリ
export const DEFAULT_TAG_CATEGORIES: AdminSettings['defaultTagCategories'] = {
  character: [
    {
      name: '属性',
      multipleSelect: false,
      required: true,
      values: ['火', '水', '土', '風', '光', '闇']
    },
    {
      name: '得意武器',
      multipleSelect: true,
      required: false,
      values: ['剣', '槍', '斧', '弓', '杖', '短剣', '格闘', '銃', '刀', '楽器']
    },
    {
      name: '性別',
      multipleSelect: false,
      required: false,
      values: ['♂', '♀', '不明']
    },
    {
      name: '種族',
      multipleSelect: false,
      required: false,
      values: ['ヒューマン', 'ドラフ', 'エルーン', 'ハーヴィン', 'その他', '星晶獣']
    },
    {
      name: 'タイプ',
      multipleSelect: false,
      required: true,
      values: ['攻撃', '防御', '回復', 'バランス', '特殊']
    },
    {
      name: '解放武器',
      multipleSelect: false,
      required: false,
      values: ['剣', '槍', '斧', '弓', '杖', '短剣', '格闘', '銃', '刀', '楽器']
    },
    {
      name: '入手方法',
      multipleSelect: false,
      required: false,
      values: ['恒常', 'リミテッド', '季節限定', 'コラボ', 'その他']
    }
  ],
  weapon: [
    {
      name: '属性',
      multipleSelect: false,
      required: true,
      values: ['火', '水', '土', '風', '光', '闇']
    },
    {
      name: '武器種',
      multipleSelect: false,
      required: true,
      values: ['剣', '槍', '斧', '弓', '杖', '短剣', '格闘', '銃', '刀', '楽器']
    }
  ],
  summon: [
    {
      name: '属性',
      multipleSelect: false,
      required: true,
      values: ['火', '水', '土', '風', '光', '闇']
    }
  ]
};
