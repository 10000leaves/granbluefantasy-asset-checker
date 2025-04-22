'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { useTags } from '@/hooks/useTags';
import { CategoryManager } from './tag/CategoryManager';
import { ValueManager } from './tag/ValueManager';

interface TagManagerProps {
  itemType?: 'character' | 'weapon' | 'summon';
  onTagsUpdated?: () => void;
}

export function TagManager({ itemType = 'character', onTagsUpdated }: TagManagerProps) {
  const { tagCategories, tagValues, loading, error, refreshTags } = useTags(itemType);
  
  const [currentItemType, setCurrentItemType] = useState<'character' | 'weapon' | 'summon'>(itemType);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // タブ切り替え
  const handleItemTypeChange = (_: React.SyntheticEvent, newValue: 'character' | 'weapon' | 'summon') => {
    setCurrentItemType(newValue);
    setSelectedCategory('');
  };

  // スナックバーを閉じる
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // 特定のカテゴリに属するタグ値を取得
  const getCategoryValues = (categoryId: string) => {
    return tagValues.filter(value => value.categoryId === categoryId || value.category_id === categoryId);
  };

  // カテゴリ保存
  const handleSaveCategory = async (category: any, isEdit: boolean) => {
    try {
      const response = await fetch('/api/tags', {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        throw new Error('Failed to save tag category');
      }

      refreshTags();
      
      setSnackbar({
        open: true,
        message: isEdit ? 'カテゴリを更新しました' : 'カテゴリを追加しました',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error saving tag category:', err);
      setSnackbar({
        open: true,
        message: '保存に失敗しました',
        severity: 'error',
      });
      throw err;
    }
  };

  // タグ値保存
  const handleSaveValue = async (value: any, isEdit: boolean) => {
    try {
      const response = await fetch('/api/tags/values', {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(value),
      });

      if (!response.ok) {
        throw new Error('Failed to save tag value');
      }

      refreshTags();
      
      setSnackbar({
        open: true,
        message: isEdit ? 'タグ値を更新しました' : 'タグ値を追加しました',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error saving tag value:', err);
      setSnackbar({
        open: true,
        message: '保存に失敗しました',
        severity: 'error',
      });
      throw err;
    }
  };

  // カテゴリ削除
  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('このカテゴリを削除してもよろしいですか？関連するタグ値もすべて削除されます。')) {
      return;
    }

    try {
      const response = await fetch(`/api/tags?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tag category');
      }

      refreshTags();
      if (selectedCategory === id) {
        setSelectedCategory('');
      }
      
      setSnackbar({
        open: true,
        message: 'カテゴリを削除しました',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error deleting tag category:', err);
      setSnackbar({
        open: true,
        message: '削除に失敗しました',
        severity: 'error',
      });
    }
  };

  // タグ値削除
  const handleDeleteValue = async (id: string) => {
    if (!window.confirm('このタグ値を削除してもよろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/tags/values?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tag value');
      }

      refreshTags();
      
      setSnackbar({
        open: true,
        message: 'タグ値を削除しました',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error deleting tag value:', err);
      setSnackbar({
        open: true,
        message: '削除に失敗しました',
        severity: 'error',
      });
    }
  };

  // 初期設定のプリセットを追加
  const addPresetTags = async () => {
    if (!window.confirm('初期設定のタグを追加しますか？')) {
      return;
    }

    try {
      // 属性カテゴリ
      const elementResponse = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '属性',
          itemType: currentItemType,
          multipleSelect: false,
          required: true,
        }),
      });

      if (!elementResponse.ok) throw new Error('Failed to create element category');
      const elementCategory = await elementResponse.json();

      // 属性の値
      const elements = ['火', '水', '土', '風', '光', '闇'];
      for (const element of elements) {
        await fetch('/api/tags/values', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            value: element,
            categoryId: elementCategory.id,
          }),
        });
      }

      if (currentItemType === 'character') {
        // レアリティカテゴリ
        const rarityResponse = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'レアリティ',
            itemType: 'character',
            multipleSelect: false,
            required: true,
          }),
        });

        if (!rarityResponse.ok) throw new Error('Failed to create rarity category');
        const rarityCategory = await rarityResponse.json();

        // レアリティの値
        const rarities = ['SSR', 'SR', 'R'];
        for (const rarity of rarities) {
          await fetch('/api/tags/values', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              value: rarity,
              categoryId: rarityCategory.id,
            }),
          });
        }

        // 得意武器カテゴリ
        const weaponResponse = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: '得意武器',
            itemType: 'character',
            multipleSelect: true,
            required: false,
          }),
        });

        if (!weaponResponse.ok) throw new Error('Failed to create weapon category');
        const weaponCategory = await weaponResponse.json();

        // 得意武器の値
        const weapons = ['剣', '槍', '斧', '弓', '杖', '短剣', '格闘', '銃', '刀', '楽器'];
        for (const weapon of weapons) {
          await fetch('/api/tags/values', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              value: weapon,
              categoryId: weaponCategory.id,
            }),
          });
        }

        // 種族カテゴリ
        const raceResponse = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: '種族',
            itemType: 'character',
            multipleSelect: false,
            required: false,
          }),
        });

        if (!raceResponse.ok) throw new Error('Failed to create race category');
        const raceCategory = await raceResponse.json();

        // 種族の値
        const races = ['ヒューマン', 'ドラフ', 'エルーン', 'ハーヴィン', 'その他', '星晶獣'];
        for (const race of races) {
          await fetch('/api/tags/values', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              value: race,
              categoryId: raceCategory.id,
            }),
          });
        }

        // タイプカテゴリ
        const typeResponse = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'タイプ',
            itemType: 'character',
            multipleSelect: false,
            required: false,
          }),
        });

        if (!typeResponse.ok) throw new Error('Failed to create type category');
        const typeCategory = await typeResponse.json();

        // タイプの値
        const types = ['攻撃', '防御', '回復', 'バランス', '特殊'];
        for (const type of types) {
          await fetch('/api/tags/values', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              value: type,
              categoryId: typeCategory.id,
            }),
          });
        }

        // 入手方法カテゴリ
        const obtainResponse = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: '入手方法',
            itemType: 'character',
            multipleSelect: false,
            required: false,
          }),
        });

        if (!obtainResponse.ok) throw new Error('Failed to create obtain method category');
        const obtainCategory = await obtainResponse.json();

        // 入手方法の値
        const obtainMethods = ['恒常', 'リミテッド', '季節限定', 'コラボ', 'その他'];
        for (const method of obtainMethods) {
          await fetch('/api/tags/values', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              value: method,
              categoryId: obtainCategory.id,
            }),
          });
        }

        // 性別カテゴリ
        const genderResponse = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: '性別',
            itemType: 'character',
            multipleSelect: false,
            required: false,
          }),
        });

        if (!genderResponse.ok) throw new Error('Failed to create gender category');
        const genderCategory = await genderResponse.json();

        // 性別の値
        const genders = ['♂', '♀', '不明'];
        for (const gender of genders) {
          await fetch('/api/tags/values', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              value: gender,
              categoryId: genderCategory.id,
            }),
          });
        }
      } else if (currentItemType === 'weapon') {
        // 武器種カテゴリ
        const weaponTypeResponse = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: '武器種',
            itemType: 'weapon',
            multipleSelect: false,
            required: true,
          }),
        });

        if (!weaponTypeResponse.ok) throw new Error('Failed to create weapon type category');
        const weaponTypeCategory = await weaponTypeResponse.json();

        // 武器種の値
        const weaponTypes = ['剣', '槍', '斧', '弓', '杖', '短剣', '格闘', '銃', '刀', '楽器'];
        for (const type of weaponTypes) {
          await fetch('/api/tags/values', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              value: type,
              categoryId: weaponTypeCategory.id,
            }),
          });
        }
      }

      refreshTags();
      
      setSnackbar({
        open: true,
        message: '初期設定のタグを追加しました',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error adding preset tags:', err);
      setSnackbar({
        open: true,
        message: 'プリセットの追加に失敗しました',
        severity: 'error',
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">タグ管理</Typography>
        <Button
          variant="contained"
          color="secondary"
          onClick={addPresetTags}
        >
          初期設定タグを追加
        </Button>
      </Box>

      <Tabs
        value={currentItemType}
        onChange={handleItemTypeChange}
        sx={{ mb: 3 }}
        variant="fullWidth"
      >
        <Tab label="キャラ" value="character" />
        <Tab label="武器" value="weapon" />
        <Tab label="召喚石" value="summon" />
      </Tabs>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* カテゴリ管理 */}
        <Paper sx={{ p: 3, flex: 1 }}>
          <CategoryManager
            tagCategories={tagCategories}
            currentItemType={currentItemType}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
            getCategoryValues={getCategoryValues}
          />
        </Paper>

        {/* タグ値管理 */}
        <Paper sx={{ p: 3, flex: 1 }}>
          <ValueManager
            tagCategories={tagCategories}
            tagValues={tagValues}
            currentItemType={currentItemType}
            onSaveValue={handleSaveValue}
            onDeleteValue={handleDeleteValue}
            getCategoryValues={getCategoryValues}
          />
        </Paper>
      </Box>

      {/* 通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
