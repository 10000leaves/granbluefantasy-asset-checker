"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { ItemType } from "@/lib/types";
import { TagCategory, TagValue } from "@/hooks/useTags";

interface ValueManagerProps {
  tagCategories: TagCategory[];
  tagValues: TagValue[];
  currentItemType: ItemType;
  onSaveValue: (value: any, isEdit: boolean) => Promise<void>;
  onDeleteValue: (id: string) => Promise<void>;
  getCategoryValues: (categoryId: string) => any[];
}

interface ValueForm {
  id?: string;
  value: string;
  categoryId?: string;
}

export function ValueManager({
  tagCategories,
  tagValues,
  currentItemType,
  onSaveValue,
  onDeleteValue,
  getCategoryValues,
}: ValueManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [valueForm, setValueForm] = useState<ValueForm>({
    value: "",
  });
  const [editValueMode, setEditValueMode] = useState<boolean>(false);

  // フォームリセット
  const resetForm = () => {
    setValueForm({
      value: "",
    });
    setEditValueMode(false);
  };

  // タグ値編集モード
  const handleEditValue = (value: TagValue) => {
    setValueForm({
      id: value.id,
      value: value.value,
      categoryId: value.categoryId || value.category_id,
    });
    setEditValueMode(true);
  };

  // タグ値送信
  const handleValueSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedCategory && !valueForm.categoryId) return;

    try {
      await onSaveValue(
        {
          id: valueForm.id,
          value: valueForm.value,
          categoryId: editValueMode ? valueForm.categoryId : selectedCategory,
        },
        editValueMode,
      );

      // フォームをリセット
      setValueForm({ value: "" });
      setEditValueMode(false);
    } catch (err) {
      console.error("Error saving tag value:", err);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        タグ値の管理
      </Typography>
      <Box
        component="form"
        onSubmit={handleValueSubmit}
        sx={{
          display: "flex",
          flexDirection: "column",
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
                setValueForm((prev) => ({
                  ...prev,
                  categoryId: e.target.value,
                }));
              }
            }}
            disabled={editValueMode}
          >
            <MenuItem value="">選択してください</MenuItem>
            {tagCategories
              .filter(
                (category) =>
                  category.itemType === currentItemType ||
                  category.item_type === currentItemType,
              )
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

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={editValueMode ? <SaveIcon /> : <AddIcon />}
            disabled={!selectedCategory && !valueForm.categoryId}
            sx={{ flex: 1 }}
          >
            {editValueMode ? "更新" : "追加"}
          </Button>

          {editValueMode && (
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
        タグ値一覧
      </Typography>

      {!selectedCategory && !editValueMode ? (
        <Alert severity="info">左側からカテゴリを選択してください。</Alert>
      ) : (
        <>
          <Typography variant="subtitle2" gutterBottom>
            {editValueMode
              ? tagCategories.find((c) => c.id === valueForm.categoryId)?.name
              : tagCategories.find((c) => c.id === selectedCategory)?.name}
          </Typography>

          {getCategoryValues(
            editValueMode ? valueForm.categoryId! : selectedCategory,
          ).length === 0 ? (
            <Alert severity="info">
              値がありません。上のフォームから追加してください。
            </Alert>
          ) : (
            <List>
              {getCategoryValues(
                editValueMode ? valueForm.categoryId! : selectedCategory,
              ).map((value, index) => (
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
                        onClick={() => onDeleteValue(value.id)}
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
    </Box>
  );
}
