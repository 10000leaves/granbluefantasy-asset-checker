import React, { useState, useMemo } from 'react';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { CharacterCard } from '@/components/characters/CharacterCard';

// 仮のキャラクターデータ（後でAPIから取得するように変更）
const mockCharacters = [
  {
    id: '1',
    name: 'グラン',
    imageUrl: '/characters/gran.jpg',
    element: 'wind' as const,
    rarity: 'SSR' as const,
  },
  {
    id: '2',
    name: 'ジータ',
    imageUrl: '/characters/djeeta.jpg',
    element: 'light' as const,
    rarity: 'SSR' as const,
  },
  // 他のキャラクターデータ...
];

export default function CharactersPage() {
  // 状態管理
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    elements: [] as string[],
    rarities: [] as string[],
    weapons: [] as string[],
    races: [] as string[],
  });

  // フィルター処理
  const filteredCharacters = useMemo(() => {
    return mockCharacters.filter((character) => {
      // 名前での検索
      if (
        searchQuery &&
        !character.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // 属性フィルター
      if (
        filters.elements.length > 0 &&
        !filters.elements.includes(character.element)
      ) {
        return false;
      }

      // レアリティフィルター
      if (
        filters.rarities.length > 0 &&
        !filters.rarities.includes(character.rarity)
      ) {
        return false;
      }

      return true;
    });
  }, [searchQuery, filters]);

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

  // キャラクター選択処理
  const handleCharacterSelect = (id: string, selected: boolean) => {
    setSelectedCharacters((prev) =>
      selected
        ? [...prev, id]
        : prev.filter((characterId) => characterId !== id)
    );
  };

  return (
    <Box>
      {/* ヘッダー */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Typography variant="h4" gutterBottom>
          キャラクター一覧
        </Typography>
        <Typography>
          所持キャラクターを選択してください。フィルターを使用して目的のキャラクターを見つけることができます。
        </Typography>
      </Paper>

      {/* 検索・フィルターエリア */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
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
                  <SearchIcon />
                </InputAdornment>
              ),
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
            }}
          >
            <FilterListIcon />
          </IconButton>
        </Box>

        {/* フィルターオプション */}
        <Collapse in={showFilters}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {/* 属性フィルター */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                属性
              </Typography>
              <FormGroup>
                {['fire', 'water', 'earth', 'wind', 'light', 'dark'].map(
                  (element) => (
                    <FormControlLabel
                      key={element}
                      control={
                        <Checkbox
                          size="small"
                          checked={filters.elements.includes(element)}
                          onChange={(e) =>
                            handleFilterChange(
                              'elements',
                              element,
                              e.target.checked
                            )
                          }
                        />
                      }
                      label={element}
                    />
                  )
                )}
              </FormGroup>
            </Box>

            {/* レアリティフィルター */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                レアリティ
              </Typography>
              <FormGroup>
                {['SSR', 'SR', 'R'].map((rarity) => (
                  <FormControlLabel
                    key={rarity}
                    control={
                      <Checkbox
                        size="small"
                        checked={filters.rarities.includes(rarity)}
                        onChange={(e) =>
                          handleFilterChange('rarities', rarity, e.target.checked)
                        }
                      />
                    }
                    label={rarity}
                  />
                ))}
              </FormGroup>
            </Box>
          </Box>
        </Collapse>
      </Paper>

      {/* キャラクター一覧エリア */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            キャラクター一覧 ({filteredCharacters.length})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            選択中: {selectedCharacters.length}
          </Typography>
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
            gap: 2,
          }}
        >
          {filteredCharacters.map((character) => (
            <CharacterCard
              key={character.id}
              {...character}
              selected={selectedCharacters.includes(character.id)}
              onSelect={handleCharacterSelect}
            />
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
