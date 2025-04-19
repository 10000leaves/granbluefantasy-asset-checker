'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useTags, TagCategory, TagValue } from '@/hooks/useTags';

interface TagManagerProps {
  itemType?: 'character' | 'weapon' | 'summon';
  onTagsUpdated?: () => void;
}

interface TagCategoryForm {
  id?: string;
  name: string;
  multipleSelect: boolean;
  required: boolean;
}

interface TagValueForm {
  id?: string;
  value: string;
  categoryId?: string;
}

export function TagManager({ itemType = 'character', onTagsUpdated }: TagManagerProps) {
  const { tagCategories, tagValues, loading, error, refreshTags } = useTags(itemType);
  
  const [currentItemType, setCurrentItemType] = useState<'character' | 'weapon' | 'summon'>(itemType);
  const [categoryForm, setCategoryForm] = useState<TagCategoryForm>({
    name: '',
    multipleSelect: false,
    required: false,
  });

  const [valueForm, setValueForm] = useState<TagValueForm>({
    value: '',
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editValueMode, setEditValueMode] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // タブ切り替え
  const handleItemTypeChange = (_: React.SyntheticEvent, newValue: 'character' | 'weapon' | 'summon') => {
    setCurrentItemType(newValue);
    setSelectedCategory('');
    resetForms();
  };

  // フォームリセット
  const resetForms = () => {
    setCategoryForm({
      name: '',
      multipleSelect: false,
      required: false,
    });
    setValueForm({
      value: '',
    });
    setEditMode(false);
    setEditValueMode(false);
  };

  // カテゴリ編集モード
  const handleEditCategory = (category: TagCategory) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
      multipleSelect: category.multipleSelect,
      required: category.required,
    });
    setEditMode(true);
  };

  // タグ値編集モード
  const handleEditValue = (value: TagValue) => {
    setValueForm({
      id: value.id,
      value: value.value,
      categoryId: value.categoryId,
    });
    setEditValueMode(true);
  };

  // カテゴリ送信
  const handleCategorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch('/api/tags', {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: categoryForm.id,
          name: categoryForm.name,
          itemType: currentItemType,
          multipleSelect: categoryForm.multipleSelect,
          required: categoryForm.required,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save tag category');
      }

      // フォームをリセット
      resetForms();
      refreshTags();
      
      setSnackbar({
        open: true,
        message: editMode ? 'カテゴリを更新しました' : 'カテゴリを追加しました',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error saving tag category:', err);
      setSnackbar({
        open: true,
        message: '保存に失敗しました',
        severity: 'error',
      });
    }
  };

  // タグ値送信
  const handleValueSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedCategory && !valueForm.categoryId) return;

    try {
      const response = await fetch('/api/tags/values', {
        method: editValueMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: valueForm.id,
          value: valueForm.value,
          categoryId: editValueMode ? valueForm.categoryId : selectedCategory,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save tag value');
      }

      // フォームをリセット
      setValueForm({ value: '' });
      setEditValueMode(false);
      refreshTags();
      
      setSnackbar({
        open: true,
        message: editValueMode ? 'タグ値を更新しました' : 'タグ値を追加しました',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error saving tag value:', err);
      setSnackbar({
        open: true,
        message: '保存に失敗しました',
        severity: 'error',
      });
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
          <Typography variant="h6" gutterBottom>
            タグカテゴリの管理
          </Typography>
          <Box
            component="form"
            onSubmit={handleCategorySubmit}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              mb: 3,
            }}
          >
            <TextField
              fullWidth
              label="カテゴリ名"
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={categoryForm.multipleSelect}
                  onChange={(e) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      multipleSelect: e.target.checked,
                    }))
                  }
                />
              }
              label="複数選択可"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={categoryForm.required}
                  onChange={(e) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      required: e.target.checked,
                    }))
                  }
                />
              }
              label="必須"
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={editMode ? <SaveIcon /> : <AddIcon />}
                sx={{ flex: 1 }}
              >
                {editMode ? '更新' : '追加'}
              </Button>
              
              {editMode && (
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    resetForms();
                  }}
                >
                  キャンセル
                </Button>
              )}
            </Box>
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            カテゴリ一覧
          </Typography>
          
          {tagCategories.filter(cat => cat.itemType === currentItemType || cat.item_type === currentItemType).length === 0 ? (
            <Alert severity="info">
              カテゴリがありません。上のフォームから追加してください。
            </Alert>
          ) : (
            <List>
              {tagCategories
                .filter(category => category.itemType === currentItemType || category.item_type === currentItemType)
                .map((category, index) => (
                  <React.Fragment key={category.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">{category.name}</Typography>
                            {category.required && (
                              <Chip
                                label="必須"
                                size="small"
                                color="error"
                                sx={{ height: 20 }}
                              />
                            )}
                            {(category.multipleSelect || category.multiple_select) && (
                              <Chip
                                label="複数選択"
                                size="small"
                                color="primary"
                                sx={{ height: 20 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={`${getCategoryValues(category.id).length}個の値`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={() => handleEditCategory(category)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                ))}
            </List>
          )}
        </Paper>

        {/* タグ値管理 */}
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            タグ値の管理
          </Typography>
          <Box
            component="form"
            onSubmit={handleValueSubmit}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              mb: 3,
            }}
          >
            <FormControl fullWidth required>
              <InputLabel>カテゴリ</InputLabel>
              <Select
                value={editValueMode ? valueForm.categoryId : selectedCategory}
                label="カテゴリ"
                onChange={(e) => {
                  if (!editValueMode) {
                    setSelectedCategory(e.target.value);
                  } else {
                    setValueForm(prev => ({ ...prev, categoryId: e.target.value }));
                  }
                }}
                disabled={editValueMode}
              >
                <MenuItem value="">選択してください</MenuItem>
                {tagCategories
                  .filter(category => category.itemType === currentItemType || category.item_type === currentItemType)
                  .map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="タグ値"
              value={valueForm.value}
              onChange={(e) =>
                setValueForm((prev) => ({ ...prev, value: e.target.value }))
              }
              required
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={editValueMode ? <SaveIcon /> : <AddIcon />}
                disabled={!selectedCategory && !valueForm.categoryId}
                sx={{ flex: 1 }}
              >
                {editValueMode ? '更新' : '追加'}
              </Button>
              
              {editValueMode && (
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    setValueForm({ value: '' });
                    setEditValueMode(false);
                  }}
                >
                  キャンセル
                </Button>
              )}
            </Box>
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            タグ値一覧
          </Typography>

          {!selectedCategory && !editValueMode ? (
            <Alert severity="info">
              左側からカテゴリを選択してください。
            </Alert>
          ) : (
            <>
              <Typography variant="subtitle2" gutterBottom>
                {editValueMode 
                  ? tagCategories.find(c => c.id === valueForm.categoryId)?.name 
                  : tagCategories.find(c => c.id === selectedCategory)?.name}
              </Typography>
              
              {getCategoryValues(editValueMode ? valueForm.categoryId! : selectedCategory).length === 0 ? (
                <Alert severity="info">
                  値がありません。上のフォームから追加してください。
                </Alert>
              ) : (
                <List>
                  {getCategoryValues(editValueMode ? valueForm.categoryId! : selectedCategory).map((value, index) => (
                    <React.Fragment key={value.id}>
                      {index > 0 && <Divider />}
                      <ListItem>
                        <ListItemText primary={value.value} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            onClick={() => handleEditValue(value)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeleteValue(value.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </>
          )}
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
