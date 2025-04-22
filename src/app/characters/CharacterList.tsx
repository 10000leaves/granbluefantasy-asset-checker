'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { OwnedOnlyFilter } from '@/components/common/OwnedOnlyFilter';
import { useOwnedFilter } from '@/hooks/useOwnedFilter';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  CheckBox as CheckBoxIcon,
} from '@mui/icons-material';
import { CharacterCard } from '@/components/characters/CharacterCard';
import { ExportPanel } from '@/components/common/ExportPanel';
import { useItems } from '@/hooks/useItems';
import { useTags } from '@/hooks/useTags';
import {
  createTagCategoryMap,
  generateItemTagData,
  getItemAttributes
} from '@/lib/utils/helpers';

export function CharacterList() {
  const { items: characters, loading, error, selectedItems, toggleItem, selectItems } = useItems('character');
  const { tagCategories, tagValues } = useTags('character');

  // 状態管理
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<Record<string, string[]>>({
    elements: []
  });

  // 所持のみフィルターのカスタムフック
  const { ownedOnly, setOwnedOnly } = useOwnedFilter(
    characters || [],
    selectedItems,
    undefined
  );

  // タグカテゴリが読み込まれたら、動的にフィルター状態を初期化
  useEffect(() => {
    if (tagCategories.length > 0) {
      const tagCategoryMap = createTagCategoryMap(tagCategories);
      const initialFilters: Record<string, string[]> = {};
      
      // 全てのカテゴリに対応するフィルターキーを初期化
      Object.values(tagCategoryMap).forEach(key => {
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
  const activeFilterCount = Object.values(filters).reduce(
    (count, filterArray) => count + filterArray.length,
    0
  );

  // キャラの属性とレアリティを取得
  const getCharacterAttributes = (character: any) => {
    if (!character.tags) return { element: 'fire', rarity: 'SSR' };
    
    // タグデータを生成
    const tagData = generateItemTagData(character, tagCategories, tagValueMap, tagCategoryMap);
    
    // 属性とレアリティを取得
    const { element, rarity } = getItemAttributes(character, tagData);
    
    return { 
      element: element as 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark', 
      rarity: rarity as 'SSR' | 'SR' | 'R' 
    };
  };

  // フィルター処理
  const filteredCharacters = useMemo(() => {
    if (!characters) return [];
    
    return characters.filter((character) => {
      // 名前での検索
      if (
        searchQuery &&
        !character.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // 所持のみフィルター
      if (ownedOnly && !selectedItems.includes(character.id)) {
        return false;
      }

      // タグでのフィルタリング
      const characterTagData = generateItemTagData(character, tagCategories, tagValueMap, tagCategoryMap);
      
      // 各フィルターカテゴリをチェック
      for (const [category, selectedValues] of Object.entries(filters)) {
        if (selectedValues.length === 0) continue;
        
        const characterValues = characterTagData[category] || [];
        
        // いずれかの値が一致するかチェック
        const hasMatch = selectedValues.some(value => characterValues.includes(value));
        
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [searchQuery, filters, characters, tagCategoryMap, tagValueMap, ownedOnly, selectedItems]);

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
    const emptyFilters: Record<string, string[]> = {};
    
    // 全てのフィルターキーを空の配列で初期化
    Object.keys(filters).forEach(key => {
      emptyFilters[key] = [];
    });
    
    setFilters(emptyFilters);
  };

  // 特定のフィルターのクリア
  const clearFilter = (category: keyof typeof filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].filter((item) => item !== value),
    }));
  };

  // キャラ選択処理
  const handleCharacterSelect = (id: string, selected: boolean) => {
    toggleItem(id);
  };

  // すべて選択処理
  const handleSelectAll = () => {
    // フィルター後のアイテムのIDを取得
    const filteredIds = filteredCharacters.map(character => character.id);
    // 選択状態を更新
    selectItems(filteredIds);
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
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
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
    <Box sx={{ pb: 8 }}>

      {/* 検索・フィルターエリア */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <TextField
            placeholder="キャラ名で検索"
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
              },
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

        {/* 所持のみフィルター */}
        <OwnedOnlyFilter 
          ownedOnly={ownedOnly} 
          onChange={setOwnedOnly} 
        />

        {/* アクティブフィルター表示 */}
        {activeFilterCount > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
            {Object.entries(filters).map(([category, values]) =>
              values.map((value) => {
                let label = value;
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
                {tagCategories.map((category) => {
                  // カテゴリに対応するフィルターキーを取得
                  const filterKey = Object.entries(tagCategoryMap).find(
                    ([id, _]) => id === category.id
                  )?.[1] as keyof typeof filters;
                  
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

      {/* キャラ一覧エリア */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            キャラ一覧 ({filteredCharacters.length})
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CheckBoxIcon />}
              onClick={handleSelectAll}
              sx={{ borderRadius: '20px' }}
            >
              すべて選択
            </Button>
            <Chip
              label={`選択中: ${selectedItems.length}`}
              color="primary"
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(4, 1fr)',
                lg: 'repeat(5, 1fr)',
                xl: 'repeat(6, 1fr)',
              },
              gap: { xs: 1, sm: 1.5, md: 2 },
              width: '100%',
            }}
          >
          {filteredCharacters.map((character) => {
            const { element, rarity } = getCharacterAttributes(character);
            return (
              <CharacterCard
                key={character.id}
                id={character.id}
                name={character.name}
                imageUrl={character.imageUrl || '/placeholder.jpg'}
                element={element as 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark'}
                rarity={rarity as 'SSR' | 'SR' | 'R'}
                selected={selectedItems.includes(character.id)}
                onSelect={handleCharacterSelect}
              />
            );
          })}
        </Box>
      </Paper>

      {/* エクスポートパネル */}
      <ExportPanel
        selectedCount={selectedItems.length}
      />
    </Box>
  );
}
