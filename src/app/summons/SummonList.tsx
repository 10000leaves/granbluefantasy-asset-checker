"use client";

import React, { useState, useMemo, useEffect } from "react";
import { OwnedOnlyFilter } from "@/components/common/OwnedOnlyFilter";
import { useOwnedFilter } from "@/hooks/useOwnedFilter";
import {
  Typography,
  Box,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Collapse,
  Grid,
  Chip,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  CheckBox as CheckBoxIcon,
} from "@mui/icons-material";
import { SummonCard } from "@/components/summons/SummonCard";
import { ExportPanel } from "@/components/common/ExportPanel";
import { useItems } from "@/hooks/useItems";
import { useTags } from "@/hooks/useTags";
import {
  createTagCategoryMap,
  generateItemTagData,
  getItemAttributes,
} from "@/lib/utils/helpers";

// 召喚石データの型定義
interface Summon {
  id: string;
  name: string;
  imageUrl: string;
  tags?: any[];
  tagData?: Record<string, string[]>; // タグデータを動的に保持
}

export function SummonList() {
  const {
    items,
    loading,
    error,
    toggleItem,
    selectedItems: selectedSummons,
    setSelectedItems,
  } = useItems("summon");
  const { tagCategories, tagValues } = useTags("summon");

  // 状態管理
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<Record<string, string[]>>({
    elements: [],
  });

  // タグカテゴリが読み込まれたら、動的にフィルター状態を初期化
  useEffect(() => {
    if (tagCategories.length > 0) {
      const tagCategoryMap = createTagCategoryMap(tagCategories);
      const initialFilters: Record<string, string[]> = {};

      // 全てのカテゴリに対応するフィルターキーを初期化
      Object.values(tagCategoryMap).forEach((key) => {
        initialFilters[key] = [];
      });

      setFilters(initialFilters);
    }
  }, [tagCategories]);

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

  // 召喚石データの整形
  const summons = useMemo(() => {
    return items.map((item) => {
      // タグデータを動的に生成
      const tagData = generateItemTagData(
        item,
        tagCategories,
        tagValueMap,
        tagCategoryMap,
      );

      return {
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        tags: item.tags,
        tagData,
      } as Summon;
    });
  }, [items, tagCategories, tagValueMap, tagCategoryMap]);

  // 所持のみフィルターのカスタムフック
  const { ownedOnly, setOwnedOnly } = useOwnedFilter(
    summons,
    selectedSummons || [],
    undefined,
  );

  // アクティブなフィルター数
  const activeFilterCount = Object.values(filters).reduce(
    (count, filterArray) => count + (filterArray ? filterArray.length : 0),
    0,
  );

  // フィルター処理
  const filteredSummons = useMemo(() => {
    return summons.filter((summon) => {
      // 名前での検索
      if (
        searchQuery &&
        !summon.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // 所持のみフィルター
      if (ownedOnly && selectedSummons && !selectedSummons.includes(summon.id)) {
        return false;
      }

      // タグデータによるフィルタリング
      for (const [category, selectedValues] of Object.entries(filters)) {
        if (!selectedValues || selectedValues.length === 0) continue;

        const summonValues = summon.tagData?.[category] || [];

        // いずれかの値が一致するかチェック
        const hasMatch = selectedValues.some((value) =>
          summonValues.includes(value),
        );

        if (!hasMatch) return false;
      }

      return true;
    });
  }, [searchQuery, filters, summons, ownedOnly, selectedSummons]);

  // フィルターの更新処理
  const handleFilterChange = (
    category: keyof typeof filters,
    value: string,
    checked: boolean,
  ) => {
    setFilters((prev) => {
      // カテゴリが存在しない場合は空の配列を作成
      const categoryValues = prev[category] || [];
      
      return {
        ...prev,
        [category]: checked
          ? [...categoryValues, value]
          : categoryValues.filter((item) => item !== value),
      };
    });
  };

  // フィルターのクリア
  const clearFilters = () => {
    const emptyFilters: Record<string, string[]> = {};

    // 全てのフィルターキーを空の配列で初期化
    Object.keys(filters).forEach((key) => {
      emptyFilters[key] = [];
    });

    setFilters(emptyFilters);
  };

  // 特定のフィルターのクリア
  const clearFilter = (category: keyof typeof filters, value: string) => {
    setFilters((prev) => {
      // カテゴリが存在しない場合は何もしない
      if (!prev[category]) return prev;
      
      return {
        ...prev,
        [category]: prev[category].filter((item) => item !== value),
      };
    });
  };

  // 召喚石選択処理
  const handleSummonSelect = (id: string, selected: boolean) => {
    toggleItem(id);
  };

  // すべて選択処理
  const handleSelectAll = () => {
    // フィルター後のアイテムのIDを取得
    const filteredIds = filteredSummons.map((summon) => summon.id);
    // 選択状態を更新
    setSelectedItems(filteredIds);
  };

  // フィルターセクションのレンダリング
  const renderFilterSection = (
    title: string,
    category: keyof typeof filters,
    options: { value: string; label: string }[],
  ) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: "bold" }}>
        {title}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {options.map((option) => {
          // カテゴリが存在しない場合は空の配列を使用
          const categoryValues = filters[category] || [];
          const isSelected = categoryValues.includes(option.value);
          
          return (
            <Chip
              key={option.value}
              label={option.label}
              size="small"
              variant={isSelected ? "filled" : "outlined"}
              color={isSelected ? "primary" : "default"}
              onClick={() =>
                handleFilterChange(
                  category,
                  option.value,
                  !isSelected,
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
          );
        })}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ pb: 8 }}>
      {/* 検索・フィルターエリア */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
          <TextField
            placeholder="召喚石名で検索"
            variant="outlined"
            size="small"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
              },
            }}
          />
          <IconButton
            aria-label="フィルター"
            onClick={() => setShowFilters(!showFilters)}
            sx={{
              bgcolor: showFilters ? "primary.main" : "inherit",
              color: showFilters ? "primary.contrastText" : "inherit",
              "&:hover": {
                bgcolor: showFilters ? "primary.dark" : "inherit",
              },
              borderRadius: "8px",
            }}
          >
            <FilterListIcon />
          </IconButton>
        </Box>

        {/* 所持のみフィルター */}
        <OwnedOnlyFilter ownedOnly={ownedOnly} onChange={setOwnedOnly} />

        {/* アクティブフィルター表示 */}
        {activeFilterCount > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
            {Object.entries(filters).map(([category, values]) => {
              // valuesが存在しない場合は空の配列を使用
              if (!values) return null;
              
              return values.map((value) => {
                let label = value;
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
                    label={`${categoryName}: ${label}`}
                    size="small"
                    onDelete={() =>
                      clearFilter(category as keyof typeof filters, value)
                    }
                    deleteIcon={<CloseIcon fontSize="small" />}
                    color="primary"
                    variant="outlined"
                    sx={{ borderRadius: "16px" }}
                  />
                );
              });
            })}
            <Chip
              label="クリア"
              size="small"
              onClick={clearFilters}
              color="default"
              sx={{ borderRadius: "16px" }}
            />
          </Box>
        )}

        {/* フィルターオプション - 縦が種類で横が内容 */}
        <Collapse in={showFilters}>
          <Divider sx={{ my: 1.5 }} />
          <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Grid container spacing={2}>
                {tagCategories.map((category) => {
                  // カテゴリに対応するフィルターキーを取得
                  const filterKey = Object.entries(tagCategoryMap).find(
                    ([id, _]) => id === category.id,
                  )?.[1] as keyof typeof filters;

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
                    <Grid item xs={12} key={category.id}>
                      {renderFilterSection(category.name, filterKey, options)}
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Collapse>
      </Paper>

      {/* 召喚石一覧エリア */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 2,
            alignItems: "center",
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
          >
            召喚石一覧 ({filteredSummons.length})
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CheckBoxIcon />}
              onClick={handleSelectAll}
              sx={{ borderRadius: "20px" }}
            >
              すべて選択
            </Button>
            <Chip
              label={`選択中: ${selectedSummons ? selectedSummons.length : 0}`}
              color="primary"
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(4, 1fr)",
                lg: "repeat(5, 1fr)",
                xl: "repeat(6, 1fr)",
              },
              gap: { xs: 1, sm: 1.5, md: 2 },
              width: "100%",
            }}
          >
            {filteredSummons.map((summon) => {
              // タグデータから属性とレアリティを取得
              const { element, rarity } = getItemAttributes(
                summon,
                summon.tagData || {},
              );

              return (
                <SummonCard
                  key={summon.id}
                  id={summon.id}
                  name={summon.name}
                  imageUrl={summon.imageUrl}
                  element={
                    element as
                      | "fire"
                      | "water"
                      | "earth"
                      | "wind"
                      | "light"
                      | "dark"
                  }
                  rarity={rarity as "SSR" | "SR" | "R"}
                  selected={selectedSummons ? selectedSummons.includes(summon.id) : false}
                  onSelect={handleSummonSelect}
                />
              );
            })}
          </Box>
        )}
      </Paper>

      {/* エクスポートパネル */}
      <ExportPanel selectedCount={selectedSummons ? selectedSummons.length : 0} />
    </Box>
  );
}
