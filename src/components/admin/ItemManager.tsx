'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Label as LabelIcon,
} from '@mui/icons-material';
import { useItems } from '@/hooks/useItems';
import { useTags } from '@/hooks/useTags';
import { useImageUpload } from '@/hooks/useImageUpload';

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
  const { uploadImage, uploading } = useImageUpload();

  // タブの状態
  const [tabValue, setTabValue] = useState(0);

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

  // アイテムダイアログを開く（新規作成）
  const handleOpenItemDialog = () => {
    setIsEditMode(false);
    setItemForm({
      id: '',
      name: '',
      category: 'character',
      imageUrl: '',
      imageFile: null,
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

  // フォームの変更を処理
  const handleItemFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setItemForm({
      ...itemForm,
      [name]: value,
    });
  };

  // カテゴリの変更を処理
  const handleCategoryChange = (e: any) => {
    setItemForm({
      ...itemForm,
      category: e.target.value,
    });
  };

  // 画像の選択を処理
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setItemForm({
        ...itemForm,
        imageFile: e.target.files[0],
      });
    }
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
  const handleSaveItem = async () => {
    if (!itemForm.name.trim()) return;

    try {
      let imageUrl = itemForm.imageUrl;
      
      // 新しい画像がある場合はアップロード
      if (itemForm.imageFile) {
        imageUrl = await uploadImage(itemForm.imageFile);
      }
      
      if (isEditMode) {
        await updateItem({
          id: itemForm.id,
          name: itemForm.name,
          category: itemForm.category,
          imageUrl,
          tags: Object.entries(selectedTags).flatMap(([categoryId, valueIds]) => 
            valueIds.map(valueId => ({ categoryId, valueId }))
          ),
        });
        setSnackbar({
          open: true,
          message: 'アイテムを更新しました',
          severity: 'success',
        });
      } else {
        await createItem({
          name: itemForm.name,
          category: itemForm.category,
          imageUrl,
          tags: Object.entries(selectedTags).flatMap(([categoryId, valueIds]) => 
            valueIds.map(valueId => ({ categoryId, valueId }))
          ),
        });
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

  // カテゴリに対応するタグカテゴリを取得
  const getCategoryTags = (category: string) => {
    return tagCategories.filter(cat => cat.itemType === category);
  };

  // カテゴリ名を日本語に変換
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'character':
        return 'キャラ';
      case 'weapon':
        return '武器';
      case 'summon':
        return '召喚石';
      default:
        return category;
    }
  };

  // タグ値を取得
  const getTagValues = (categoryId: string) => {
    return tagValues.filter(val => val.categoryId === categoryId);
  };

  // タグ名を取得
  const getTagName = (categoryId: string, valueId: string) => {
    const category = tagCategories.find(cat => cat.id === categoryId);
    const value = tagValues.find(val => val.id === valueId);
    
    if (category && value) {
      return `${category.name}: ${value.value}`;
    }
    
    return '';
  };

  // アイテムのタグを表示
  const renderItemTags = (item: any) => {
    if (!item.tags || item.tags.length === 0) return null;
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
        {item.tags.map((tag: any, index: number) => (
          <Chip
            key={index}
            label={getTagName(tag.categoryId, tag.valueId)}
            size="small"
            color="primary"
            variant="outlined"
          />
        ))}
      </Box>
    );
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
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenItemDialog}
        >
          アイテムを追加
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
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

      <TabPanel value={tabValue} index={0}>
        {characterItems.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              キャラがありません。「アイテムを追加」ボタンをクリックして作成してください。
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {characterItems.map((item) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={item.id}>
                <Card sx={{ 
                  width: 280,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  margin: '0 auto',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  }
                }}>
                  <Box sx={{ position: 'relative', height: 160, width: 280, margin: '0 auto' }}>
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        style={{ objectFit: 'cover' }}
                        unoptimized
                        onError={(e) => {
                          console.error(`Image error in ItemManager: ${item.name}, URL: ${item.imageUrl}`);
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const errorDiv = document.createElement('div');
                            errorDiv.style.width = '100%';
                            errorDiv.style.height = '100%';
                            errorDiv.style.display = 'flex';
                            errorDiv.style.alignItems = 'center';
                            errorDiv.style.justifyContent = 'center';
                            errorDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                            const errorIcon = document.createElement('span');
                            errorIcon.textContent = '画像エラー';
                            errorIcon.style.color = '#999';
                            errorDiv.appendChild(errorIcon);
                            parent.appendChild(errorDiv);
                          }
                        }}
                      />
                    ) : (
                      <Box sx={{ 
                        height: '100%', 
                        width: '100%', 
                        bgcolor: 'grey.200',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Typography variant="body2" color="text.secondary">画像なし</Typography>
                      </Box>
                    )}
                  </Box>
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Typography variant="subtitle2" noWrap>{item.name}</Typography>
                    {renderItemTags(item)}
                  </CardContent>
                  <CardActions sx={{ p: 1, pt: 0 }}>
                    <IconButton size="small" onClick={() => handleOpenTagDialog(item)}>
                      <LabelIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenEditItemDialog(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteItem(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {weaponItems.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              武器がありません。「アイテムを追加」ボタンをクリックして作成してください。
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {weaponItems.map((item) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={item.id}>
                <Card sx={{ 
                  width: 280,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  margin: '0 auto',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  }
                }}>
                  <Box sx={{ position: 'relative', height: 160, width: 280, margin: '0 auto' }}>
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        style={{ objectFit: 'cover' }}
                        unoptimized
                      />
                    ) : (
                      <Box sx={{ 
                        height: '100%', 
                        width: '100%', 
                        bgcolor: 'grey.200',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Typography variant="body2" color="text.secondary">画像なし</Typography>
                      </Box>
                    )}
                  </Box>
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Typography variant="subtitle2" noWrap>{item.name}</Typography>
                    {renderItemTags(item)}
                  </CardContent>
                  <CardActions sx={{ p: 1, pt: 0 }}>
                    <IconButton size="small" onClick={() => handleOpenTagDialog(item)}>
                      <LabelIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenEditItemDialog(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteItem(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {summonItems.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              召喚石がありません。「アイテムを追加」ボタンをクリックして作成してください。
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {summonItems.map((item) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={item.id}>
                <Card sx={{ 
                  width: 280,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  margin: '0 auto',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  }
                }}>
                  <Box sx={{ position: 'relative', height: 160, width: 280, margin: '0 auto' }}>
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        style={{ objectFit: 'cover' }}
                        unoptimized
                      />
                    ) : (
                      <Box sx={{ 
                        height: '100%', 
                        width: '100%', 
                        bgcolor: 'grey.200',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Typography variant="body2" color="text.secondary">画像なし</Typography>
                      </Box>
                    )}
                  </Box>
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Typography variant="subtitle2" noWrap>{item.name}</Typography>
                    {renderItemTags(item)}
                  </CardContent>
                  <CardActions sx={{ p: 1, pt: 0 }}>
                    <IconButton size="small" onClick={() => handleOpenTagDialog(item)}>
                      <LabelIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenEditItemDialog(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteItem(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* アイテム作成/編集ダイアログ */}
      <Dialog open={openItemDialog} onClose={handleCloseItemDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditMode ? 'アイテムを編集' : 'アイテムを追加'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="アイテム名"
            fullWidth
            value={itemForm.name}
            onChange={handleItemFormChange}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>カテゴリ</InputLabel>
            <Select
              value={itemForm.category}
              onChange={handleCategoryChange}
              label="カテゴリ"
            >
              <MenuItem value="character">キャラ</MenuItem>
              <MenuItem value="weapon">武器</MenuItem>
              <MenuItem value="summon">召喚石</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mb: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="image-upload"
              type="file"
              onChange={handleImageSelect}
            />
            <label htmlFor="image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<ImageIcon />}
                sx={{ mb: 1 }}
              >
                画像を選択
              </Button>
            </label>
            {itemForm.imageFile && (
              <Typography variant="body2">
                選択済み: {itemForm.imageFile.name}
              </Typography>
            )}
            {itemForm.imageUrl && !itemForm.imageFile && (
              <Box sx={{ mt: 1 }}>
                <img
                  src={itemForm.imageUrl}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '200px' }}
                />
              </Box>
            )}
          </Box>

          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>タグ</Typography>
          {getCategoryTags(itemForm.category).map((category) => (
            <Box key={category.id} sx={{ mb: 2 }}>
              <Typography variant="subtitle2">{category.name}</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {getTagValues(category.id).map((value) => (
                  <Chip
                    key={value.id}
                    label={value.value}
                    size="small"
                    variant={selectedTags[category.id]?.includes(value.id) ? "filled" : "outlined"}
                    color={selectedTags[category.id]?.includes(value.id) ? "primary" : "default"}
                    onClick={() => 
                      handleTagChange(
                        category.id, 
                        value.id, 
                        !selectedTags[category.id]?.includes(value.id)
                      )
                    }
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseItemDialog}>キャンセル</Button>
          <Button
            onClick={handleSaveItem}
            color="primary"
            disabled={!itemForm.name.trim() || uploading}
          >
            {uploading ? '画像アップロード中...' : (isEditMode ? '更新' : '作成')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* タグ編集ダイアログ */}
      <Dialog open={openTagDialog} onClose={handleCloseTagDialog} maxWidth="sm" fullWidth>
        <DialogTitle>タグを編集</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  component="img"
                  src={selectedItem.imageUrl || '/placeholder.jpg'}
                  alt={selectedItem.name}
                  sx={{ width: 60, height: 60, mr: 2, objectFit: 'cover' }}
                />
                <Typography variant="h6">{selectedItem.name}</Typography>
              </Box>
              
              {getCategoryTags(selectedItem.category).map((category) => (
                <Box key={category.id} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">{category.name}</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {getTagValues(category.id).map((value) => (
                      <Chip
                        key={value.id}
                        label={value.value}
                        size="small"
                        variant={selectedTags[category.id]?.includes(value.id) ? "filled" : "outlined"}
                        color={selectedTags[category.id]?.includes(value.id) ? "primary" : "default"}
                        onClick={() => 
                          handleTagChange(
                            category.id, 
                            value.id, 
                            !selectedTags[category.id]?.includes(value.id)
                          )
                        }
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTagDialog}>キャンセル</Button>
          <Button onClick={handleSaveTags} color="primary">
            保存
          </Button>
        </DialogActions>
      </Dialog>

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
