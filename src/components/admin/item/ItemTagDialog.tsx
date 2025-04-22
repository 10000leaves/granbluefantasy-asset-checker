'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { TagCategory, TagValue } from '@/hooks/useTags';

interface ItemTagDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  item: any | null;
  tagCategories: TagCategory[];
  tagValues: TagValue[];
  selectedTags: Record<string, string[]>;
  onTagChange: (categoryId: string, valueId: string, checked: boolean) => void;
}

export function ItemTagDialog({
  open,
  onClose,
  onSave,
  item,
  tagCategories,
  tagValues,
  selectedTags,
  onTagChange,
}: ItemTagDialogProps) {
  // カテゴリに対応するタグカテゴリを取得
  const getCategoryTags = (category: string) => {
    return tagCategories.filter(cat => cat.itemType === category || cat.item_type === category);
  };

  // タグ値を取得
  const getTagValues = (categoryId: string) => {
    return tagValues.filter(val => val.categoryId === categoryId || val.category_id === categoryId);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>タグを編集</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              component="img"
              src={item.imageUrl || '/placeholder.jpg'}
              alt={item.name}
              sx={{ width: 60, height: 60, mr: 2, objectFit: 'cover' }}
            />
            <Typography variant="h6">{item.name}</Typography>
          </Box>
          
          {getCategoryTags(item.category).map((category) => (
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
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={onSave} color="primary">
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}
