'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { Image as ImageIcon } from '@mui/icons-material';
import { useImageUpload } from '@/hooks/useImageUpload';
import { TagCategory, TagValue } from '@/hooks/useTags';

interface ItemFormData {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  imageFile: File | null;
  implementationDate: string;
}

interface ItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (item: any) => void;
  isEditMode: boolean;
  initialData: ItemFormData;
  tagCategories: TagCategory[];
  tagValues: TagValue[];
  selectedTags: Record<string, string[]>;
  onTagChange: (categoryId: string, valueId: string, checked: boolean) => void;
}

export function ItemDialog({
  open,
  onClose,
  onSave,
  isEditMode,
  initialData,
  tagCategories,
  tagValues,
  selectedTags,
  onTagChange,
}: ItemDialogProps) {
  const { uploadImage, uploading } = useImageUpload();
  const [itemForm, setItemForm] = useState<ItemFormData>(initialData);
  
  // initialDataが変更されたとき、またはダイアログが開かれたときにitemFormを更新
  useEffect(() => {
    if (open) {
      setItemForm(initialData);
    }
  }, [initialData, open]);

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

  // カテゴリに対応するタグカテゴリを取得
  const getCategoryTags = (category: string) => {
    return tagCategories.filter(cat => cat.itemType === category || cat.item_type === category);
  };

  // タグ値を取得
  const getTagValues = (categoryId: string) => {
    return tagValues.filter(val => val.categoryId === categoryId || val.category_id === categoryId);
  };

  // アイテムを保存
  const handleSave = async () => {
    if (!itemForm.name.trim() || !itemForm.implementationDate) return;

    try {
      let imageUrl = itemForm.imageUrl;
      
      // 新しい画像がある場合はアップロード
      if (itemForm.imageFile) {
        imageUrl = await uploadImage(itemForm.imageFile);
      }
      
      // 基本情報
      const itemData = {
        id: itemForm.id,
        name: itemForm.name,
        category: itemForm.category,
        imageUrl,
        implementationDate: itemForm.implementationDate || new Date().toISOString().split('T')[0],
      };
      
      // 新規作成時のみタグ情報を含める（編集時はタグアイコンから編集するため）
      if (!isEditMode) {
        const tags = Object.entries(selectedTags).flatMap(([categoryId, valueIds]) => 
          valueIds.map(valueId => ({ categoryId, valueId }))
        );
        
        onSave({
          ...itemData,
          tags
        });
      } else {
        onSave(itemData);
      }
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'アイテムを編集' : 'アイテムを追加'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          name="name"
          label="アイテム名"
          fullWidth
          required
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

        <TextField
          margin="dense"
          name="implementationDate"
          label="実装年月日"
          type="date"
          fullWidth
          required
          value={itemForm.implementationDate}
          onChange={handleItemFormChange}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ mb: 2 }}
        />

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

        {/* 編集モードの場合はタグ編集機能を非表示（タグアイコンから編集）、新規作成時は表示 */}
        {!isEditMode && (
          <>
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
                        onTagChange(
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
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          onClick={handleSave}
          color="primary"
          disabled={!itemForm.name.trim() || !itemForm.implementationDate || uploading}
        >
          {uploading ? '画像アップロード中...' : (isEditMode ? '更新' : '作成')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
