'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { TagCategory } from '@/hooks/useTags';

interface CategoryManagerProps {
  tagCategories: TagCategory[];
  currentItemType: 'character' | 'weapon' | 'summon';
  onSaveCategory: (category: any, isEdit: boolean) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  getCategoryValues: (categoryId: string) => any[];
}

interface CategoryForm {
  id?: string;
  name: string;
  multipleSelect: boolean;
  required: boolean;
}

export function CategoryManager({
  tagCategories,
  currentItemType,
  onSaveCategory,
  onDeleteCategory,
  getCategoryValues,
}: CategoryManagerProps) {
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({
    name: '',
    multipleSelect: false,
    required: false,
  });
  const [editMode, setEditMode] = useState<boolean>(false);

  // フォームリセット
  const resetForm = () => {
    setCategoryForm({
      name: '',
      multipleSelect: false,
      required: false,
    });
    setEditMode(false);
  };

  // カテゴリ編集モード
  const handleEditCategory = (category: TagCategory) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
      multipleSelect: category.multipleSelect || category.multiple_select,
      required: category.required,
    });
    setEditMode(true);
  };

  // カテゴリ送信
  const handleCategorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    try {
      await onSaveCategory({
        id: categoryForm.id,
        name: categoryForm.name,
        itemType: currentItemType,
        multipleSelect: categoryForm.multipleSelect,
        required: categoryForm.required,
      }, editMode);
      
      // フォームをリセット
      resetForm();
    } catch (err) {
      console.error('Error saving tag category:', err);
    }
  };

  return (
    <Box>
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
              onClick={resetForm}
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
                      onClick={() => onDeleteCategory(category.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
        </List>
      )}
    </Box>
  );
}
