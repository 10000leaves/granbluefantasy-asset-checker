'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useItems } from '@/hooks/useItems';
import { useTags } from '@/hooks/useTags';
import { ItemList } from './item/ItemList';
import { ItemDialog } from './item/ItemDialog';
import { ItemTagDialog } from './item/ItemTagDialog';
import { BulkUploadManager } from './item/BulkUploadManager';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`item-tabpanel-${index}`}
      aria-labelledby={`item-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `item-tab-${index}`,
    'aria-controls': `item-tabpanel-${index}`,
  };
}

export function ItemManager() {
  const { items, loading, error, createItem, updateItem, deleteItem, refreshItems } = useItems();
  const { tagCategories, tagValues, loading: tagsLoading, error: tagsError } = useTags();

  // タブの状態
  const [tabValue, setTabValue] = useState(0);
  const [activeView, setActiveView] = useState<'list' | 'bulk'>('list');

  // ダイアログの状態
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [openTagDialog, setOpenTagDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // フォームの状態
  const [itemForm, setItemForm] = useState({
    id: '',
    name: '',
    category: 'character',
    imageUrl: '',
    imageFile: null as File | null,
    implementationDate: '',
  });

  // タグ選択の状態
  const [selectedTags, setSelectedTags] = useState<Record<string, string[]>>({});

  // 通知の状態
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // タブの切り替え
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // ビューの切り替え
  const handleViewChange = (view: 'list' | 'bulk') => {
    setActiveView(view);
  };

  // アイテムダイアログを開く（新規作成）
  const handleOpenItemDialog = () => {
    setIsEditMode(false);
    // 当日の日付をYYYY-MM-DD形式で取得
    const today = new Date().toISOString().split('T')[0];
    
    setItemForm({
      id: '',
      name: '',
      category: getCategoryFromTabValue(tabValue),
      imageUrl: '',
      imageFile: null,
      implementationDate: today,
    });
    setSelectedTags({});
    setOpenItemDialog(true);
  };

  // アイテムダイアログを開く（編集）
  const handleOpenEditItemDialog = (item: any) => {
    setIsEditMode(true);
    setItemForm({
      id: item.id,
      name: item.name,
      category: item.category,
      imageUrl: item.imageUrl,
      imageFile: null,
      implementationDate: item.implementationDate || '',
    });
    
    // 選択されたタグを設定
    const tags: Record<string, string[]> = {};
    if (item.tags) {
      item.tags.forEach((tag: any) => {
        if (!tags[tag.categoryId]) {
          tags[tag.categoryId] = [];
        }
        tags[tag.categoryId].push(tag.valueId);
      });
    }
    setSelectedTags(tags);
    
    setSelectedItem(item);
    setOpenItemDialog(true);
  };

  // タグダイアログを開く
  const handleOpenTagDialog = (item: any) => {
    setSelectedItem(item);
    
    // 選択されたタグを設定
    const tags: Record<string, string[]> = {};
    if (item.tags) {
      item.tags.forEach((tag: any) => {
        if (!tags[tag.categoryId]) {
          tags[tag.categoryId] = [];
        }
        tags[tag.categoryId].push(tag.valueId);
      });
    }
    setSelectedTags(tags);
    
    setOpenTagDialog(true);
  };

  // ダイアログを閉じる
  const handleCloseItemDialog = () => {
    setOpenItemDialog(false);
    setSelectedItem(null);
  };

  // タグダイアログを閉じる
  const handleCloseTagDialog = () => {
    setOpenTagDialog(false);
    setSelectedItem(null);
  };

  // タグの選択を処理
  const handleTagChange = (categoryId: string, valueId: string, checked: boolean) => {
    setSelectedTags((prev) => {
      const newTags = { ...prev };
      
      if (!newTags[categoryId]) {
        newTags[categoryId] = [];
      }
      
      if (checked) {
        // タグを追加
        newTags[categoryId] = [...newTags[categoryId], valueId];
      } else {
        // タグを削除
        newTags[categoryId] = newTags[categoryId].filter(id => id !== valueId);
      }
      
      return newTags;
    });
  };

  // アイテムを保存
  const handleSaveItem = async (item: any) => {
    try {
      if (isEditMode) {
        // 編集モードの場合は既存のタグ情報を保持
        // ItemDialog.tsxでは編集時にタグ情報を含めないようにしているので、
        // ここでは既存のタグ情報を追加する
        const existingTags = selectedItem?.tags || [];
        await updateItem({ ...item, tags: existingTags });
        setSnackbar({
          open: true,
          message: 'アイテムを更新しました',
          severity: 'success',
        });
      } else {
        // 新規作成の場合はそのまま作成（タグ情報も含まれている）
        await createItem(item);
        setSnackbar({
          open: true,
          message: 'アイテムを作成しました',
          severity: 'success',
        });
      }
      
      handleCloseItemDialog();
      refreshItems();
    } catch (error) {
      setSnackbar({
        open: true,
        message: '保存に失敗しました',
        severity: 'error',
      });
    }
  };

  // タグを保存
  const handleSaveTags = async () => {
    if (!selectedItem) return;

    try {
      // データベースのカラム名とJavaScriptのプロパティ名の違いを考慮
      const imageUrl = selectedItem.imageUrl || selectedItem.image_url || '';
      
      await updateItem({
        id: selectedItem.id,
        name: selectedItem.name,
        category: selectedItem.category,
        imageUrl: imageUrl,
        tags: Object.entries(selectedTags).flatMap(([categoryId, valueIds]) => 
          valueIds.map(valueId => ({ categoryId, valueId }))
        ),
      });
      
      setSnackbar({
        open: true,
        message: 'タグを更新しました',
        severity: 'success',
      });
      
      handleCloseTagDialog();
      refreshItems();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'タグの更新に失敗しました',
        severity: 'error',
      });
    }
  };

  // アイテムを削除
  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('このアイテムを削除してもよろしいですか？')) return;

    try {
      await deleteItem(id);
      setSnackbar({
        open: true,
        message: 'アイテムを削除しました',
        severity: 'success',
      });
      refreshItems();
    } catch (error) {
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

  // タブ値からカテゴリを取得
  const getCategoryFromTabValue = (value: number): string => {
    switch (value) {
      case 0:
        return 'character';
      case 1:
        return 'weapon';
      case 2:
        return 'summon';
      default:
        return 'character';
    }
  };

  if (loading || tagsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || tagsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || tagsError}</Alert>
      </Box>
    );
  }

  // カテゴリ別のアイテム
  const characterItems = items.filter(item => item.category === 'character');
  const weaponItems = items.filter(item => item.category === 'weapon');
  const summonItems = items.filter(item => item.category === 'summon');

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">アイテム管理</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={activeView === 'list' ? 'contained' : 'outlined'}
            onClick={() => handleViewChange('list')}
          >
            リスト表示
          </Button>
          <Button
            variant={activeView === 'bulk' ? 'contained' : 'outlined'}
            onClick={() => handleViewChange('bulk')}
          >
            まとめてアップロード
          </Button>
        </Box>
      </Box>

      {activeView === 'list' ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', flex: 1 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="item category tabs"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="キャラ" {...a11yProps(0)} />
                <Tab label="武器" {...a11yProps(1)} />
                <Tab label="召喚石" {...a11yProps(2)} />
              </Tabs>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenItemDialog}
              sx={{ ml: 2 }}
            >
              アイテムを追加
            </Button>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <ItemList
              items={characterItems}
              tagCategories={tagCategories}
              tagValues={tagValues}
              onEdit={handleOpenEditItemDialog}
              onDelete={handleDeleteItem}
              onTagEdit={handleOpenTagDialog}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <ItemList
              items={weaponItems}
              tagCategories={tagCategories}
              tagValues={tagValues}
              onEdit={handleOpenEditItemDialog}
              onDelete={handleDeleteItem}
              onTagEdit={handleOpenTagDialog}
              emptyMessage="武器がありません。「アイテムを追加」ボタンをクリックして作成してください。"
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <ItemList
              items={summonItems}
              tagCategories={tagCategories}
              tagValues={tagValues}
              onEdit={handleOpenEditItemDialog}
              onDelete={handleDeleteItem}
              onTagEdit={handleOpenTagDialog}
              emptyMessage="召喚石がありません。「アイテムを追加」ボタンをクリックして作成してください。"
            />
          </TabPanel>
        </>
      ) : (
        <BulkUploadManager />
      )}

      {/* アイテム作成/編集ダイアログ */}
      <ItemDialog
        open={openItemDialog}
        onClose={handleCloseItemDialog}
        onSave={handleSaveItem}
        isEditMode={isEditMode}
        initialData={itemForm}
        tagCategories={tagCategories}
        tagValues={tagValues}
        selectedTags={selectedTags}
        onTagChange={handleTagChange}
      />

      {/* タグ編集ダイアログ */}
      <ItemTagDialog
        open={openTagDialog}
        onClose={handleCloseTagDialog}
        onSave={handleSaveTags}
        item={selectedItem}
        tagCategories={tagCategories}
        tagValues={tagValues}
        selectedTags={selectedTags}
        onTagChange={handleTagChange}
      />

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
