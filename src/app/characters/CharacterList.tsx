'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  InputAdornment,
  IconButton,
  Collapse,
  Grid,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
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
import { CharacterCard } from '@/components/characters/CharacterCard';
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

export function CharacterList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { items: characters, loading, error, selectedItems, setSelectedItems, toggleItem } = useItems('character');
  const { tagCategories, tagValues } = useTags('character');

  // 状態管理
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    elements: [] as string[],
    rarities: [] as string[],
    weapons: [] as string[],
    races: [] as string[],
    types: [] as string[],
    obtainMethods: [] as string[],
    releaseWeapons: [] as string[],
    genders: [] as string[],
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
        case '得意武器':
          map[category.id] = 'weapons';
          break;
        case '種族':
          map[category.id] = 'races';
          break;
        case 'タイプ':
          map[category.id] = 'types';
          break;
        case '入手方法':
          map[category.id] = 'obtainMethods';
          break;
        case '解放武器':
          map[category.id] = 'releaseWeapons';
          break;
        case '性別':
          map[category.id] = 'genders';
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

  // アクティブなフィルター数
  const activeFilterCount = Object.values(filters).reduce(
    (count, filterArray) => count + filterArray.length,
    0
  );

  // キャラクターのタグを取得
  const getCharacterTags = (character: any) => {
    if (!character.tags) return {};
    
    const tags: Record<string, string[]> = {};
    
    character.tags.forEach((tag: { categoryId: string, valueId: string }) => {
      const filterKey = tagCategoryMap[tag.categoryId];
      if (!filterKey) return;
      
      const tagValue = tagValueMap[tag.valueId]?.value;
      if (!tagValue) return;
      
      if (!tags[filterKey]) {
        tags[filterKey] = [];
      }
      
      tags[filterKey].push(tagValue);
    });
    
    return tags;
  };

  // キャラクターの属性とレアリティを取得
  const getCharacterAttributes = (character: any) => {
    if (!character.tags) return { element: 'fire', rarity: 'SSR' };
    
    // 属性タグを取得
    const elementTag = character.tags.find((tag: any) => {
      const category = tagCategories.find(c => c.id === tag.categoryId);
      return category && category.name.toLowerCase() === '属性';
    });
    
    // レアリティタグを取得
    const rarityTag = character.tags.find((tag: any) => {
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
    
    return { element, rarity };
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

      // タグでのフィルタリング
      const characterTags = getCharacterTags(character);
      
      // 各フィルターカテゴリをチェック
      for (const [category, selectedValues] of Object.entries(filters)) {
        if (selectedValues.length === 0) continue;
        
        const characterValues = characterTags[category] || [];
        
        // いずれかの値が一致するかチェック
        const hasMatch = selectedValues.some(value => characterValues.includes(value));
        
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [searchQuery, filters, characters, tagCategoryMap, tagValueMap]);

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
      weapons: [],
      races: [],
      types: [],
      obtainMethods: [],
      releaseWeapons: [],
      genders: [],
    });
  };

  // 特定のフィルターのクリア
  const clearFilter = (category: keyof typeof filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].filter((item) => item !== value),
    }));
  };

  // キャラクター選択処理
  const handleCharacterSelect = (id: string, selected: boolean) => {
    toggleItem(id);
  };

  // 画像出力処理
  const handleExport = () => {
    // TODO: 画像出力の実装
    console.log('Export selected characters:', selectedItems);
  };

  // 共有処理
  const handleShare = () => {
    // TODO: 共有機能の実装
    console.log('Share selected characters:', selectedItems);
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
      {/* ヘッダー */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 2,
          borderRadius: 2,
          backgroundImage: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
          color: 'white',
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight="bold">
          キャラクター一覧
        </Typography>
        <Typography variant="body2">
          所持キャラクターを選択してください。フィルターを使用して目的のキャラクターを見つけることができます。
        </Typography>
      </Paper>

      {/* 検索・フィルターエリア */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <TextField
            placeholder="キャラクター名で検索"
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
                  case 'weapons':
                    categoryName = '得意武器';
                    break;
                  case 'races':
                    categoryName = '種族';
                    break;
                  case 'types':
                    categoryName = 'タイプ';
                    break;
                  case 'obtainMethods':
                    categoryName = '入手方法';
                    break;
                  case 'releaseWeapons':
                    categoryName = '解放武器';
                    break;
                  case 'genders':
                    categoryName = '性別';
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

                <Grid item xs={12}>
                  {renderFilterSection('得意武器', 'weapons', [
                    { value: '剣', label: '剣' },
                    { value: '槍', label: '槍' },
                    { value: '斧', label: '斧' },
                    { value: '弓', label: '弓' },
                    { value: '杖', label: '杖' },
                    { value: '短剣', label: '短剣' },
                    { value: '格闘', label: '格闘' },
                    { value: '銃', label: '銃' },
                    { value: '刀', label: '刀' },
                    { value: '楽器', label: '楽器' },
                  ])}
                </Grid>

                <Grid item xs={12}>
                  {renderFilterSection('種族', 'races', [
                    { value: 'ヒューマン', label: 'ヒューマン' },
                    { value: 'ドラフ', label: 'ドラフ' },
                    { value: 'エルーン', label: 'エルーン' },
                    { value: 'ハーヴィン', label: 'ハーヴィン' },
                    { value: 'その他', label: 'その他' },
                    { value: '星晶獣', label: '星晶獣' },
                  ])}
                </Grid>

                <Grid item xs={12}>
                  {renderFilterSection('タイプ', 'types', [
                    { value: '攻撃', label: '攻撃' },
                    { value: '防御', label: '防御' },
                    { value: '回復', label: '回復' },
                    { value: 'バランス', label: 'バランス' },
                    { value: '特殊', label: '特殊' },
                  ])}
                </Grid>

                <Grid item xs={12}>
                  {renderFilterSection('入手方法', 'obtainMethods', [
                    { value: '恒常', label: '恒常' },
                    { value: 'リミテッド', label: 'リミテッド' },
                    { value: '季節限定', label: '季節限定' },
                    { value: 'コラボ', label: 'コラボ' },
                    { value: 'その他', label: 'その他' },
                  ])}
                </Grid>

                <Grid item xs={12}>
                  {renderFilterSection('性別', 'genders', [
                    { value: '♂', label: '♂' },
                    { value: '♀', label: '♀' },
                    { value: '不明', label: '不明' },
                  ])}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Collapse>
      </Paper>

      {/* キャラクター一覧エリア */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            キャラクター一覧 ({filteredCharacters.length})
          </Typography>
          <Chip
            label={`選択中: ${selectedItems.length}`}
            color="primary"
            size="small"
            variant="outlined"
          />
        </Box>
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
        onExport={handleExport}
        onShare={handleShare}
      />
    </Box>
  );
}
