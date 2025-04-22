'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Typography,
  Grid,
  FormControlLabel,
  Checkbox,
  Divider,
  FormGroup,
  Paper,
  Box,
  Chip,
  Collapse,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTags } from '@/hooks/useTags';
import {
  createTagCategoryMap,
  generateItemTagData,
} from '@/lib/utils/helpers';

// エクスポートフィルター設定の型定義
export interface ExportFilterSettings {
  showUserInfo: boolean;
  showCharacters: boolean;
  showWeapons: boolean;
  showSummons: boolean;
  includeUnowned: boolean;
  tagFilters: Record<string, string[]>;
}

interface ExportFilterSettingsProps {
  filterSettings: ExportFilterSettings;
  onFilterChange: (setting: keyof ExportFilterSettings, checked: boolean) => void;
  onTagFilterChange?: (category: string, value: string, checked: boolean) => void;
  onClearTagFilter?: (category: string, value: string) => void;
  onClearAllTagFilters?: () => void;
  itemType?: 'character' | 'weapon' | 'summon';
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
  itemType = 'character'
}: ExportFilterSettingsProps) {
  const [showTagFilters, setShowTagFilters] = useState(false);
  const { tagCategories, tagValues } = useTags(itemType);

  // タグカテゴリのマッピングを動的に生成
  const tagCategoryMap = useMemo(() => {
    return createTagCategoryMap(tagCategories);
  }, [tagCategories]);

  // タグ値のマッピング
  const tagValueMap = useMemo(() => {
    const map: Record<string, { categoryId: string, value: string }> = {};
    tagValues.forEach(value => {
      map[value.id] = {
        categoryId: value.categoryId,
        value: value.value,
      };
    });
    return map;
  }, [tagValues]);

  // アクティブなフィルター数
  const activeFilterCount = Object.values(filterSettings.tagFilters || {}).reduce(
    (count, filterArray) => count + filterArray.length,
    0
  );

  // フィルター設定の変更ハンドラー
  const handleFilterChange = (setting: keyof ExportFilterSettings) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange(setting, event.target.checked);
  };

  // タグフィルターの変更ハンドラー
  const handleTagFilterChange = (
    category: string,
    value: string,
    checked: boolean
  ) => {
    if (onTagFilterChange) {
      onTagFilterChange(category, value, checked);
    }
  };

  // フィルターセクションのレンダリング
  const renderFilterSection = (
    title: string,
    category: string,
    options: { value: string; label: string }[]
  ) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            size="small"
            variant={filterSettings.tagFilters[category]?.includes(option.value) ? "filled" : "outlined"}
            color={filterSettings.tagFilters[category]?.includes(option.value) ? "primary" : "default"}
            onClick={() =>
              handleTagFilterChange(
                category,
                option.value,
                !filterSettings.tagFilters[category]?.includes(option.value)
              )
            }
            sx={{
              borderRadius: '16px',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
        出力設定
      </Typography>
      <FormGroup>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filterSettings.showUserInfo}
                  onChange={handleFilterChange('showUserInfo')}
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
                  onChange={handleFilterChange('showCharacters')}
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
                  onChange={handleFilterChange('showWeapons')}
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
                  onChange={handleFilterChange('showSummons')}
                />
              }
              label="召喚石を表示"
            />
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filterSettings.includeUnowned}
                    onChange={handleFilterChange('includeUnowned')}
                  />
                }
                label="未所持アイテムも含める"
              />
              <IconButton
                aria-label="タグフィルター"
                onClick={() => setShowTagFilters(!showTagFilters)}
                sx={{
                  bgcolor: showTagFilters ? 'primary.main' : 'inherit',
                  color: showTagFilters ? 'primary.contrastText' : 'inherit',
                  '&:hover': {
                    bgcolor: showTagFilters ? 'primary.dark' : 'inherit',
                  },
                  borderRadius: '8px',
                  ml: 1,
                }}
                size="small"
              >
                <FilterListIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </FormGroup>

      {/* アクティブタグフィルター表示 */}
      {activeFilterCount > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2, mb: 1 }}>
          {Object.entries(filterSettings.tagFilters || {}).map(([category, values]) =>
            values.map((value) => {
              let categoryName = '';

              // カテゴリIDを逆引き
              const categoryId = Object.entries(tagCategoryMap).find(
                ([_, key]) => key === category
              )?.[0];
              
              // カテゴリ名を取得
              if (categoryId) {
                const categoryObj = tagCategories.find(c => c.id === categoryId);
                if (categoryObj) {
                  categoryName = categoryObj.name;
                }
              }

              return (
                <Chip
                  key={`${category}-${value}`}
                  label={`${categoryName}: ${value}`}
                  size="small"
                  onDelete={() => onClearTagFilter && onClearTagFilter(category, value)}
                  deleteIcon={<CloseIcon fontSize="small" />}
                  color="primary"
                  variant="outlined"
                  sx={{ borderRadius: '16px' }}
                />
              );
            })
          )}
          <Chip
            label="クリア"
            size="small"
            onClick={() => onClearAllTagFilters && onClearAllTagFilters()}
            color="default"
            sx={{ borderRadius: '16px' }}
          />
        </Box>
      )}

      {/* タグフィルターオプション */}
      <Collapse in={showTagFilters}>
        <Divider sx={{ my: 1.5 }} />
        <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <Grid container spacing={2}>
              {tagCategories.map((category) => {
                // カテゴリに対応するフィルターキーを取得
                const filterKey = Object.entries(tagCategoryMap).find(
                  ([id, _]) => id === category.id
                )?.[1];
                
                if (!filterKey) return null;
                
                // カテゴリに属するタグ値を取得
                const categoryValues = tagValues.filter(
                  (value) => value.categoryId === category.id
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
  );
}
