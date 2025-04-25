"use client";

import React, { useState, useMemo } from "react";
import {
  Typography,
  Grid,
  FormControlLabel,
  Checkbox,
  Divider,
  Paper,
  Box,
  Chip,
  Card,
  CardContent,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { ItemType } from "@/lib/types";
import { useTags } from "@/hooks/useTags";
import { createTagCategoryMap } from "@/lib/utils/helpers";

// エクスポートフィルター設定の型定義
export interface ExportFilterSettings {
  showUserInfo: boolean;
  showCharacters: boolean;
  showWeapons: boolean;
  showSummons: boolean;
  includeUnowned: boolean;
  tagFilters: {
    character: Record<string, string[]>;
    weapon: Record<string, string[]>;
    summon: Record<string, string[]>;
  };
}

interface ExportFilterSettingsProps {
  filterSettings: ExportFilterSettings;
  onFilterChange: (
    setting: keyof ExportFilterSettings,
    checked: boolean,
  ) => void;
  onTagFilterChange?: (
    itemType: ItemType,
    category: string,
    value: string,
    checked: boolean,
  ) => void;
  onClearTagFilter?: (
    itemType: ItemType,
    category: string,
    value: string,
  ) => void;
  onClearAllTagFilters?: (itemType: ItemType) => void;
  itemType?: ItemType;
  onItemTypeChange?: (itemType: ItemType) => void;
}

/**
 * エクスポート設定のフィルターコンポーネント
 */
export function ExportFilterSettingsComponent({
  filterSettings,
  onFilterChange,
  onTagFilterChange,
  onClearTagFilter,
  onClearAllTagFilters,
  itemType = "character",
  onItemTypeChange,
}: ExportFilterSettingsProps) {
  const [showTagFilters, setShowTagFilters] = useState(false);
  const { tagCategories, tagValues } = useTags(itemType);

  // タグカテゴリのマッピングを動的に生成
  const tagCategoryMap = useMemo(() => {
    return createTagCategoryMap(tagCategories);
  }, [tagCategories]);

  // タグ値のマッピング
  const tagValueMap = useMemo(() => {
    const map: Record<string, { categoryId: string; value: string }> = {};
    tagValues.forEach((value) => {
      map[value.id] = {
        categoryId: value.categoryId,
        value: value.value,
      };
    });
    return map;
  }, [tagValues]);

  // 現在のアイテムタイプのタグフィルター
  const currentTagFilters = filterSettings.tagFilters[itemType] || {};

  // アクティブなフィルター数
  const activeFilterCount = Object.values(currentTagFilters).reduce(
    (count, filterArray) => count + filterArray.length,
    0,
  );

  // フィルター設定の変更ハンドラー
  const handleFilterChange =
    (setting: keyof ExportFilterSettings) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange(setting, event.target.checked);
    };

  // タグフィルターの変更ハンドラー
  const handleTagFilterChange = (
    category: string,
    value: string,
    checked: boolean,
  ) => {
    if (onTagFilterChange) {
      onTagFilterChange(itemType, category, value, checked);
    }
  };

  // アイテムタイプの変更ハンドラー
  const handleItemTypeChange = (
    _: React.SyntheticEvent,
    newValue: ItemType,
  ) => {
    if (onItemTypeChange) {
      onItemTypeChange(newValue);
    }
  };

  // フィルターセクションのレンダリング
  const renderFilterSection = (
    title: string,
    category: string,
    options: { value: string; label: string }[],
  ) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: "bold" }}>
        {title}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            size="small"
            variant={
              currentTagFilters[category]?.includes(option.value)
                ? "filled"
                : "outlined"
            }
            color={
              currentTagFilters[category]?.includes(option.value)
                ? "primary"
                : "default"
            }
            onClick={() =>
              handleTagFilterChange(
                category,
                option.value,
                !currentTagFilters[category]?.includes(option.value),
              )
            }
            sx={{
              borderRadius: "16px",
              transition: "all 0.2s",
              "&:hover": {
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Typography
        variant="subtitle1"
        gutterBottom
        fontWeight="bold"
        sx={{ mb: 2 }}
      >
        出力設定
      </Typography>

      {/* 表示設定 */}
      <Accordion
        defaultExpanded
        elevation={0}
        sx={{
          "&:before": { display: "none" },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "8px",
          mb: 2,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            bgcolor: "background.default",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            表示設定
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filterSettings.showUserInfo}
                    onChange={handleFilterChange("showUserInfo")}
                  />
                }
                label="ユーザー情報を表示"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filterSettings.showCharacters}
                    onChange={handleFilterChange("showCharacters")}
                  />
                }
                label="キャラを表示"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filterSettings.showWeapons}
                    onChange={handleFilterChange("showWeapons")}
                  />
                }
                label="武器を表示"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filterSettings.showSummons}
                    onChange={handleFilterChange("showSummons")}
                  />
                }
                label="召喚石を表示"
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filterSettings.includeUnowned}
                    onChange={handleFilterChange("includeUnowned")}
                  />
                }
                label="未所持アイテムも含める"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* タグフィルター */}
      <Accordion
        elevation={0}
        sx={{
          "&:before": { display: "none" },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "8px",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            bgcolor: "background.default",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="subtitle2" fontWeight="bold">
              タグフィルター
            </Typography>
            {activeFilterCount > 0 && (
              <Chip
                label={`${activeFilterCount}個選択中`}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {/* アイテムタイプ切り替えタブ */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs
              value={itemType}
              onChange={handleItemTypeChange}
              variant="fullWidth"
              aria-label="アイテムタイプ"
            >
              <Tab label="キャラ" value="character" />
              <Tab label="武器" value="weapon" />
              <Tab label="召喚石" value="summon" />
            </Tabs>
          </Box>

          {/* アクティブタグフィルター表示 */}
          {activeFilterCount > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
              {Object.entries(currentTagFilters).map(([category, values]) =>
                values.map((value) => {
                  let categoryName = "";

                  // カテゴリIDを逆引き
                  const categoryId = Object.entries(tagCategoryMap).find(
                    ([_, key]) => key === category,
                  )?.[0];

                  // カテゴリ名を取得
                  if (categoryId) {
                    const categoryObj = tagCategories.find(
                      (c) => c.id === categoryId,
                    );
                    if (categoryObj) {
                      categoryName = categoryObj.name;
                    }
                  }

                  return (
                    <Chip
                      key={`${category}-${value}`}
                      label={`${categoryName}: ${value}`}
                      size="small"
                      onDelete={() =>
                        onClearTagFilter &&
                        onClearTagFilter(itemType, category, value)
                      }
                      deleteIcon={<CloseIcon fontSize="small" />}
                      color="primary"
                      variant="outlined"
                      sx={{ borderRadius: "16px" }}
                    />
                  );
                }),
              )}
              <Button
                variant="outlined"
                size="small"
                onClick={() =>
                  onClearAllTagFilters && onClearAllTagFilters(itemType)
                }
                sx={{ borderRadius: "16px", ml: 1 }}
              >
                すべてクリア
              </Button>
            </Box>
          )}

          {/* タグフィルターオプション */}
          <Stack spacing={2}>
            {tagCategories.map((category) => {
              // カテゴリに対応するフィルターキーを取得
              const filterKey = Object.entries(tagCategoryMap).find(
                ([id, _]) => id === category.id,
              )?.[1];

              if (!filterKey) return null;

              // カテゴリに属するタグ値を取得
              const categoryValues = tagValues.filter(
                (value) => value.categoryId === category.id,
              );

              // タグ値がない場合はスキップ
              if (categoryValues.length === 0) return null;

              // フィルターオプションを作成
              const options = categoryValues.map((value) => ({
                value: value.value,
                label: value.value,
              }));

              return (
                <Card
                  key={category.id}
                  variant="outlined"
                  sx={{
                    borderRadius: "8px",
                    overflow: "visible",
                  }}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    {renderFilterSection(category.name, filterKey, options)}
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}
