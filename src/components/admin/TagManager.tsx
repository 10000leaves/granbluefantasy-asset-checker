"use client";

import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import { ItemType } from "@/lib/types";
import { useTags } from "@/hooks/useTags";
import { CategoryManager } from "./tag/CategoryManager";
import { ValueManager } from "./tag/ValueManager";

export function TagManager() {
  const [currentItemType, setCurrentItemType] = useState<ItemType>("character");
  const { tagCategories, tagValues, loading, error, refreshTags } =
    useTags(currentItemType);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // タブ切り替え
  const handleItemTypeChange = (
    _: React.SyntheticEvent,
    newValue: ItemType,
  ) => {
    setCurrentItemType(newValue);
    setSelectedCategory("");
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
    return tagValues.filter(
      (value) =>
        value.categoryId === categoryId || value.category_id === categoryId,
    );
  };

  // カテゴリ保存
  const handleSaveCategory = async (category: any, isEdit: boolean) => {
    try {
      const response = await fetch("/api/tags", {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        throw new Error("Failed to save tag category");
      }

      refreshTags();

      setSnackbar({
        open: true,
        message: isEdit ? "カテゴリを更新しました" : "カテゴリを追加しました",
        severity: "success",
      });
    } catch (err) {
      console.error("Error saving tag category:", err);
      setSnackbar({
        open: true,
        message: "保存に失敗しました",
        severity: "error",
      });
      throw err;
    }
  };

  // タグ値保存
  const handleSaveValue = async (value: any, isEdit: boolean) => {
    try {
      const response = await fetch("/api/tags/values", {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(value),
      });

      if (!response.ok) {
        throw new Error("Failed to save tag value");
      }

      refreshTags();

      setSnackbar({
        open: true,
        message: isEdit ? "タグ値を更新しました" : "タグ値を追加しました",
        severity: "success",
      });
    } catch (err) {
      console.error("Error saving tag value:", err);
      setSnackbar({
        open: true,
        message: "保存に失敗しました",
        severity: "error",
      });
      throw err;
    }
  };

  // カテゴリ削除
  const handleDeleteCategory = async (id: string) => {
    if (
      !window.confirm(
        "このカテゴリを削除してもよろしいですか？関連するタグ値もすべて削除されます。",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/tags?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete tag category");
      }

      refreshTags();
      if (selectedCategory === id) {
        setSelectedCategory("");
      }

      setSnackbar({
        open: true,
        message: "カテゴリを削除しました",
        severity: "success",
      });
    } catch (err) {
      console.error("Error deleting tag category:", err);
      setSnackbar({
        open: true,
        message: "削除に失敗しました",
        severity: "error",
      });
    }
  };

  // タグ値削除
  const handleDeleteValue = async (id: string) => {
    if (!window.confirm("このタグ値を削除してもよろしいですか？")) {
      return;
    }

    try {
      const response = await fetch(`/api/tags/values?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete tag value");
      }

      refreshTags();

      setSnackbar({
        open: true,
        message: "タグ値を削除しました",
        severity: "success",
      });
    } catch (err) {
      console.error("Error deleting tag value:", err);
      setSnackbar({
        open: true,
        message: "削除に失敗しました",
        severity: "error",
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">タグ管理</Typography>
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

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
        }}
      >
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
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
