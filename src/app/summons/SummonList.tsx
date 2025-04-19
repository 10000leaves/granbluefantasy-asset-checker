'use client';

import React, { useState, useMemo } from 'react';
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
  useTheme,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { SummonCard } from '@/components/summons/SummonCard';
import { ExportPanel } from '@/components/common/ExportPanel';
import { useItems } from '@/hooks/useItems';
import { useTags } from '@/hooks/useTags';

// 属性の日本語マッピング
const elementMap = {
  fire: '火',
  water: '水',
  earth: '土',
  wind: '風',
  light: '光',
  dark: '闇',
};

// 召喚石データの型定義
interface Summon {
  id: string;
  name: string;
  imageUrl: string;
  element?: 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';
  rarity?: 'SSR' | 'SR' | 'R';
  tags?: any[];
}

export function SummonList() {
  const theme = useTheme();
  const { items, loading, error, toggleItem, selectedItems: selectedSummons } = useItems('summon');
  const { tagCategories, tagValues } = useTags('summon');
  
  // 状態管理
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    elements: [] as string[],
    rarities: [] as string[],
  });
  
  // タグカテゴリのマッピング
  const tagCategoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    tagCategories.forEach(category => {
      switch (category.name.toLowerCase()) {
        case '属性':
          map[category.id] = 'elements';
          break;
        case 'レアリティ':
          map[category.id] = 'rarities';
          break;
      }
    });
    return map;
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
  
  // 召喚石データの整形
  const summons = useMemo(() => {
    return items.map(item => {
      // タグからメタデータを抽出
      const elementTag = item.tags?.find((tag: any) => {
        const category = tagCategories.find(c => c.id === tag.categoryId);
        return category && category.name.toLowerCase() === '属性';
      });
      
      const rarityTag = item.tags?.find((tag: any) => {
        const category = tagCategories.find(c => c.id === tag.categoryId);
        return category && category.name.toLowerCase() === 'レアリティ';
      });
      
      // 属性の取得と変換
      let element: 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark' = 'fire';
      if (elementTag) {
        const elementValue = tagValueMap[elementTag.valueId]?.value.toLowerCase();
        if (elementValue === 'fire' || elementValue === 'water' || elementValue === 'earth' || 
            elementValue === 'wind' || elementValue === 'light' || elementValue === 'dark' ||
            elementValue === '火' || elementValue === '水' || elementValue === '土' || 
            elementValue === '風' || elementValue === '光' || elementValue === '闇') {
          // 日本語から英語への変換
          if (elementValue === '火') element = 'fire';
          else if (elementValue === '水') element = 'water';
          else if (elementValue === '土') element = 'earth';
          else if (elementValue === '風') element = 'wind';
          else if (elementValue === '光') element = 'light';
          else if (elementValue === '闇') element = 'dark';
          else element = elementValue as any;
        }
      }
      
      // レアリティの取得と変換
      let rarity: 'SSR' | 'SR' | 'R' = 'SSR';
      if (rarityTag) {
        const rarityValue = tagValueMap[rarityTag.valueId]?.value.toUpperCase();
        if (rarityValue === 'SSR' || rarityValue === 'SR' || rarityValue === 'R') {
          rarity = rarityValue as any;
        }
      }
      
      return {
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        element,
        rarity,
        tags: item.tags
      } as Summon;
    });
  }, [items, tagCategories, tagValueMap]);

  // アクティブなフィルター数
  const activeFilterCount = Object.values(filters).reduce(
    (count, filterArray) => count + filterArray.length,
    0
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

      // 属性フィルター
      if (
        filters.elements.length > 0 &&
        (!summon.element || !filters.elements.includes(summon.element))
      ) {
        return false;
      }

      // レアリティフィルター
      if (
        filters.rarities.length > 0 &&
        (!summon.rarity || !filters.rarities.includes(summon.rarity))
      ) {
        return false;
      }

      return true;
    });
  }, [searchQuery, filters, summons]);

  // フィルターの更新処理
  const handleFilterChange = (
    category: keyof typeof filters,
    value: string,
    checked: boolean
  ) => {
    setFilters((prev) => ({
      ...prev,
      [category]: checked
        ? [...prev[category], value]
        : prev[category].filter((item) => item !== value),
    }));
  };

  // フィルターのクリア
  const clearFilters = () => {
    setFilters({
      elements: [],
      rarities: [],
    });
  };

  // 特定のフィルターのクリア
  const clearFilter = (category: keyof typeof filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].filter((item) => item !== value),
    }));
  };

  // 召喚石選択処理
  const handleSummonSelect = (id: string, selected: boolean) => {
    toggleItem(id);
  };

  // フィルターセクションのレンダリング
  const renderFilterSection = (
    title: string,
    category: keyof typeof filters,
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
            variant={filters[category].includes(option.value) ? "filled" : "outlined"}
            color={filters[category].includes(option.value) ? "primary" : "default"}
            onClick={() => 
              handleFilterChange(
                category, 
                option.value, 
                !filters[category].includes(option.value)
              )
            }
            sx={{ 
              borderRadius: '16px',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }
            }}
          />
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ pb: 8 }}>

      {/* 検索・フィルターエリア */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
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
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              }
            }}
          />
          <IconButton
            aria-label="フィルター"
            onClick={() => setShowFilters(!showFilters)}
            sx={{
              bgcolor: showFilters ? 'primary.main' : 'inherit',
              color: showFilters ? 'primary.contrastText' : 'inherit',
              '&:hover': {
                bgcolor: showFilters ? 'primary.dark' : 'inherit',
              },
              borderRadius: '8px',
            }}
          >
            <FilterListIcon />
          </IconButton>
        </Box>

        {/* アクティブフィルター表示 */}
        {activeFilterCount > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
            {Object.entries(filters).map(([category, values]) =>
              values.map((value) => {
                let label = value;
                let categoryName = '';
                
                // カテゴリ名の日本語化
                switch (category) {
                  case 'elements':
                    categoryName = '属性';
                    label = elementMap[value as keyof typeof elementMap] || value;
                    break;
                  case 'rarities':
                    categoryName = 'レアリティ';
                    break;
                }
                
                return (
                  <Chip
                    key={`${category}-${value}`}
                    label={`${categoryName}: ${label}`}
                    size="small"
                    onDelete={() => clearFilter(category as keyof typeof filters, value)}
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
              onClick={clearFilters}
              color="default"
              sx={{ borderRadius: '16px' }}
            />
          </Box>
        )}

        {/* フィルターオプション - 縦が種類で横が内容 */}
        <Collapse in={showFilters}>
          <Divider sx={{ my: 1.5 }} />
          <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  {renderFilterSection('属性', 'elements', [
                    { value: 'fire', label: '火' },
                    { value: 'water', label: '水' },
                    { value: 'earth', label: '土' },
                    { value: 'wind', label: '風' },
                    { value: 'light', label: '光' },
                    { value: 'dark', label: '闇' },
                  ])}
                </Grid>
                
                <Grid item xs={12}>
                  {renderFilterSection('レアリティ', 'rarities', [
                    { value: 'SSR', label: 'SSR' },
                    { value: 'SR', label: 'SR' },
                    { value: 'R', label: 'R' },
                  ])}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Collapse>
      </Paper>

      {/* 召喚石一覧エリア */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            召喚石一覧 ({filteredSummons.length})
          </Typography>
          <Chip
            label={`選択中: ${selectedSummons.length}`}
            color="primary"
            size="small"
            variant="outlined"
          />
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(4, 1fr)',
                lg: 'repeat(5, 1fr)',
              },
              gap: { xs: 1, sm: 2 },
            }}
          >
            {filteredSummons.map((summon) => (
              <SummonCard
                key={summon.id}
                id={summon.id}
                name={summon.name}
                imageUrl={summon.imageUrl}
                element={summon.element as any}
                rarity={summon.rarity as any || 'SSR'}
                selected={selectedSummons.includes(summon.id)}
                onSelect={handleSummonSelect}
              />
            ))}
          </Box>
        )}
      </Paper>

      {/* エクスポートパネル */}
      <ExportPanel
        selectedCount={selectedSummons.length}
      />
    </Box>
  );
}
