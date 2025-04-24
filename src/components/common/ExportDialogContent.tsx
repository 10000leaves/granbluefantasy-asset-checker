'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
} from '@mui/material';
import { useInputItems } from '@/hooks/useInputItems';
import { useTags } from '@/hooks/useTags';
import { ExportFilterSettings, ExportFilterSettingsComponent } from './ExportFilterSettings';
import { ExportContentItems } from './ExportContentItems';
import { ExportActionButtons } from './ExportActionButtons';
import { WeaponAwakenings } from '@/atoms';
import { createTagCategoryMap, generateItemTagData } from '@/lib/utils/helpers';
import { useItems } from '@/hooks/useItems';

interface ExportDialogContentProps {
  exportType: 'image' | 'pdf' | 'csv';
  isExporting: boolean;
  exportedImageUrl: string | null;
  tabValue: number;
  handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  handleDownload: () => void;
  handleExport: () => void;
  selectedItems: {
    characters: any[];
    weapons: {
      id: string;
      name: string;
      imageUrl: string;
      count?: number;
      awakenings?: WeaponAwakenings;
      [key: string]: any;
    }[];
    summons: any[];
  };
  sessionData: any;
}

/**
 * エクスポートダイアログのコンテンツコンポーネント
 */
export function ExportDialogContent({
  exportType,
  isExporting,
  exportedImageUrl,
  handleTabChange,
  handleDownload,
  handleExport,
  selectedItems,
  sessionData
}: ExportDialogContentProps) {
  // 入力項目の情報を取得
  const { inputGroups } = useInputItems();
  
  // タブ状態
  const [currentItemType, setCurrentItemType] = useState<'character' | 'weapon' | 'summon'>('character');
  
  // 画像プレビュー表示状態
  const [showImagePreview, setShowImagePreview] = useState(false);
  
  // 全アイテムを取得
  const { items: allCharacters } = useItems('character');
  const { items: allWeapons } = useItems('weapon');
  const { items: allSummons } = useItems('summon');
  
  // タグ情報を取得
  const { tagCategories: characterTagCategories, tagValues: characterTagValues } = useTags('character');
  const { tagCategories: weaponTagCategories, tagValues: weaponTagValues } = useTags('weapon');
  const { tagCategories: summonTagCategories, tagValues: summonTagValues } = useTags('summon');
  
  // 全てのタグカテゴリとタグ値を結合
  const allTagCategories = useMemo(() => {
    return [...characterTagCategories, ...weaponTagCategories, ...summonTagCategories];
  }, [characterTagCategories, weaponTagCategories, summonTagCategories]);
  
  const allTagValues = useMemo(() => {
    return [...characterTagValues, ...weaponTagValues, ...summonTagValues];
  }, [characterTagValues, weaponTagValues, summonTagValues]);
  
  // エクスポートフィルター設定
  const [filterSettings, setFilterSettings] = useState<ExportFilterSettings>({
    showUserInfo: true,
    showCharacters: true,
    showWeapons: true,
    showSummons: true,
    includeUnowned: false,
    tagFilters: {
      character: {},
      weapon: {},
      summon: {}
    }
  });

  // タグカテゴリのマッピングを動的に生成
  const tagCategoryMap = useMemo(() => {
    return createTagCategoryMap(allTagCategories);
  }, [allTagCategories]);

  // タグカテゴリが読み込まれたら、動的にフィルター状態を初期化
  useEffect(() => {
    if (allTagCategories.length > 0) {
      const tagCategoryMap = createTagCategoryMap(allTagCategories);
      const initialTagFilters = {
        character: {} as Record<string, string[]>,
        weapon: {} as Record<string, string[]>,
        summon: {} as Record<string, string[]>
      };
      
      // 全てのカテゴリに対応するフィルターキーを初期化
      Object.entries(tagCategoryMap).forEach(([categoryId, key]) => {
        // カテゴリIDからアイテムタイプを判断
        let itemType: 'character' | 'weapon' | 'summon' = 'character';
        
        if (characterTagCategories.some(cat => cat.id === categoryId)) {
          itemType = 'character';
        } else if (weaponTagCategories.some(cat => cat.id === categoryId)) {
          itemType = 'weapon';
        } else if (summonTagCategories.some(cat => cat.id === categoryId)) {
          itemType = 'summon';
        }
        
        initialTagFilters[itemType][key] = [];
      });
      
      setFilterSettings(prev => ({
        ...prev,
        tagFilters: initialTagFilters
      }));
    }
  }, [allTagCategories, characterTagCategories, weaponTagCategories, summonTagCategories]);

  // フィルター設定の変更ハンドラー
  const handleFilterChange = (setting: keyof ExportFilterSettings, checked: boolean) => {
    setFilterSettings({
      ...filterSettings,
      [setting]: checked,
    });
  };

  // タグフィルターの変更ハンドラー
  const handleTagFilterChange = (
    itemType: 'character' | 'weapon' | 'summon',
    category: string,
    value: string,
    checked: boolean
  ) => {
    setFilterSettings(prev => ({
      ...prev,
      tagFilters: {
        ...prev.tagFilters,
        [itemType]: {
          ...prev.tagFilters[itemType],
          [category]: checked
            ? [...(prev.tagFilters[itemType][category] || []), value]
            : (prev.tagFilters[itemType][category] || []).filter(item => item !== value)
        }
      }
    }));
  };

  // 特定のタグフィルターのクリア
  const handleClearTagFilter = (
    itemType: 'character' | 'weapon' | 'summon',
    category: string,
    value: string
  ) => {
    setFilterSettings(prev => ({
      ...prev,
      tagFilters: {
        ...prev.tagFilters,
        [itemType]: {
          ...prev.tagFilters[itemType],
          [category]: (prev.tagFilters[itemType][category] || []).filter(item => item !== value)
        }
      }
    }));
  };

  // 全てのタグフィルターのクリア
  const handleClearAllTagFilters = (itemType: 'character' | 'weapon' | 'summon') => {
    const emptyTagFilters = { ...filterSettings.tagFilters };
    
    // 指定されたアイテムタイプのフィルターをクリア
    Object.keys(emptyTagFilters[itemType]).forEach(key => {
      emptyTagFilters[itemType][key] = [];
    });
    
    setFilterSettings(prev => ({
      ...prev,
      tagFilters: emptyTagFilters
    }));
  };
  
  // 項目IDから項目名を取得するマップを作成
  const itemNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    
    inputGroups.forEach(group => {
      group.items.forEach(item => {
        map[item.id] = item.name;
      });
    });
    
    return map;
  }, [inputGroups]);
  
  // 項目IDから項目名を取得する関数
  const getItemName = (itemId: string): string => {
    return itemNameMap[itemId] || itemId;
  };

  // 未所持アイテムを含める処理
  const itemsWithUnowned = useMemo(() => {
    if (!filterSettings.includeUnowned) {
      return {
        characters: selectedItems.characters,
        weapons: selectedItems.weapons,
        summons: selectedItems.summons
      };
    }

    // 選択されたアイテムのIDを取得
    const selectedCharacterIds = new Set(selectedItems.characters.map(item => item.id));
    const selectedWeaponIds = new Set(selectedItems.weapons.map(item => item.id));
    const selectedSummonIds = new Set(selectedItems.summons.map(item => item.id));

    // 全アイテムから未所持アイテムを抽出
    const unownedCharacters = allCharacters
      ? allCharacters
          .filter(item => !selectedCharacterIds.has(item.id))
          .map(item => ({ ...item, isUnowned: true }))
      : [];
    
    const unownedWeapons = allWeapons
      ? allWeapons
          .filter(item => !selectedWeaponIds.has(item.id))
          .map(item => ({ ...item, isUnowned: true }))
      : [];
    
    const unownedSummons = allSummons
      ? allSummons
          .filter(item => !selectedSummonIds.has(item.id))
          .map(item => ({ ...item, isUnowned: true }))
      : [];

    // 選択されたアイテムと未所持アイテムを結合
    return {
      characters: [...selectedItems.characters, ...unownedCharacters],
      weapons: [...selectedItems.weapons, ...unownedWeapons],
      summons: [...selectedItems.summons, ...unownedSummons]
    };
  }, [selectedItems, filterSettings.includeUnowned, allCharacters, allWeapons, allSummons]);

  // タグ値のマッピングを作成
  const tagValueMap = useMemo(() => {
    const map: Record<string, { categoryId: string, value: string }> = {};
    allTagValues.forEach(value => {
      map[value.id] = {
        categoryId: value.categoryId,
        value: value.value,
      };
    });
    return map;
  }, [allTagValues]);

  // フィルター処理されたアイテム
  const filteredItems = useMemo(() => {
    // アイテムタイプごとのタグフィルターを取得
    const characterTagFilters = filterSettings.tagFilters.character;
    const weaponTagFilters = filterSettings.tagFilters.weapon;
    const summonTagFilters = filterSettings.tagFilters.summon;
    
    // タグフィルターが空かどうかをチェック
    const hasCharacterFilters = Object.values(characterTagFilters).some(filters => filters.length > 0);
    const hasWeaponFilters = Object.values(weaponTagFilters).some(filters => filters.length > 0);
    const hasSummonFilters = Object.values(summonTagFilters).some(filters => filters.length > 0);

    // キャラクターのフィルタリング
    const filteredCharacters = hasCharacterFilters
      ? itemsWithUnowned.characters.filter(character => {
          // タグでのフィルタリング
          const characterTagData = generateItemTagData(character, characterTagCategories, tagValueMap, tagCategoryMap);
          
          // 各フィルターカテゴリをチェック
          for (const [category, selectedValues] of Object.entries(characterTagFilters)) {
            // 選択されていないカテゴリはスキップ
            if (selectedValues.length === 0) continue;
            
            const characterValues = characterTagData[category] || [];
            
            // いずれかの値が一致するかチェック
            const hasMatch = selectedValues.some(value => characterValues.includes(value));
            
            // 一致しない場合はフィルタリング
            if (!hasMatch) return false;
          }

          return true;
        })
      : itemsWithUnowned.characters;

    // 武器のフィルタリング
    const filteredWeapons = hasWeaponFilters
      ? itemsWithUnowned.weapons.filter(weapon => {
          // タグでのフィルタリング
          const weaponTagData = generateItemTagData(weapon, weaponTagCategories, tagValueMap, tagCategoryMap);
          
          // 各フィルターカテゴリをチェック
          for (const [category, selectedValues] of Object.entries(weaponTagFilters)) {
            // 選択されていないカテゴリはスキップ
            if (selectedValues.length === 0) continue;
            
            const weaponValues = weaponTagData[category] || [];
            
            // いずれかの値が一致するかチェック
            const hasMatch = selectedValues.some(value => weaponValues.includes(value));
            
            // 一致しない場合はフィルタリング
            if (!hasMatch) return false;
          }

          return true;
        })
      : itemsWithUnowned.weapons;

    // 召喚石のフィルタリング
    const filteredSummons = hasSummonFilters
      ? itemsWithUnowned.summons.filter(summon => {
          // タグでのフィルタリング
          const summonTagData = generateItemTagData(summon, summonTagCategories, tagValueMap, tagCategoryMap);
          
          // 各フィルターカテゴリをチェック
          for (const [category, selectedValues] of Object.entries(summonTagFilters)) {
            // 選択されていないカテゴリはスキップ
            if (selectedValues.length === 0) continue;
            
            const summonValues = summonTagData[category] || [];
            
            // いずれかの値が一致するかチェック
            const hasMatch = selectedValues.some(value => summonValues.includes(value));
            
            // 一致しない場合はフィルタリング
            if (!hasMatch) return false;
          }

          return true;
        })
      : itemsWithUnowned.summons;

    return {
      characters: filteredCharacters,
      weapons: filteredWeapons,
      summons: filteredSummons
    };
  }, [
    itemsWithUnowned, 
    filterSettings.tagFilters, 
    characterTagCategories, 
    weaponTagCategories, 
    summonTagCategories, 
    tagCategoryMap
  ]);
  
  // エクスポート中の表示
  if (isExporting) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          {exportType === 'image' ? '画像を生成中...' : 
           exportType === 'pdf' ? 'PDFを生成中...' : 'CSVを生成中...'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          しばらくお待ちください
        </Typography>
      </Box>
    );
  }

  // 画像出力の場合（画像が生成済み）
  if (exportType === 'image' && exportedImageUrl && showImagePreview) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Box
          sx={{
            maxWidth: '100%',
            overflow: 'auto',
            boxShadow: 3,
            borderRadius: 2,
            mb: 3,
          }}
        >
          <img
            src={exportedImageUrl}
            alt="エクスポート画像"
            style={{ maxWidth: '100%', display: 'block' }}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setShowImagePreview(false)}
          >
            設定に戻る
          </Button>
          <ExportActionButtons
            exportType={exportType}
            exportedImageUrl={exportedImageUrl}
            handleDownload={handleDownload}
            handleExport={handleExport}
          />
        </Box>
      </Box>
    );
  }

  // CSV出力の場合（フィルター設定なし）
  if (exportType === 'csv') {
    return (
      <Box sx={{ py: 2, textAlign: 'center' }}>
        {/* アクションボタン */}
        <ExportActionButtons
          exportType={exportType}
          exportedImageUrl={exportedImageUrl}
          handleDownload={handleDownload}
          handleExport={handleExport}
        />
        
        {/* エクスポートコンテンツ（CSV出力用） - 非表示 */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <Box
            id="export-content"
            sx={{
              width: '800px',
              p: 3,
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderRadius: 1,
              boxShadow: 1,
            }}
          >
            <ExportContentItems
              filterSettings={{
                showUserInfo: true,
                showCharacters: true,
                showWeapons: true,
                showSummons: true,
                includeUnowned: false,
                tagFilters: {
                  character: {},
                  weapon: {},
                  summon: {}
                }
              }}
              selectedItems={selectedItems}
              sessionData={sessionData}
              getItemName={getItemName}
              isPdfMode={true}
            />
          </Box>
        </div>
      </Box>
    );
  }

  // PDF出力の場合またはプレビュー表示（画像出力）
  return (
    <Box sx={{ py: 2 }}>
      {/* フィルター設定 */}
      <ExportFilterSettingsComponent
        filterSettings={filterSettings}
        onFilterChange={handleFilterChange}
        onTagFilterChange={handleTagFilterChange}
        onClearTagFilter={handleClearTagFilter}
        onClearAllTagFilters={handleClearAllTagFilters}
        itemType={currentItemType}
        onItemTypeChange={setCurrentItemType}
      />

      {/* アクションボタン */}
      <ExportActionButtons
        exportType={exportType}
        exportedImageUrl={exportedImageUrl}
        handleDownload={handleDownload}
        handleExport={() => {
          if (exportType === 'image') {
            handleExport();
            // 画像生成後にプレビューを表示
            setTimeout(() => {
              setShowImagePreview(true);
            }, 100);
          } else {
            handleExport();
          }
        }}
      />

      {/* プレビュー表示 */}
      <Box
        id="export-content"
        sx={{
          p: 3,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <ExportContentItems
          filterSettings={filterSettings}
          selectedItems={filteredItems}
          sessionData={sessionData}
          getItemName={getItemName}
          isPdfMode={exportType === 'pdf'}
        />
      </Box>
    </Box>
  );
}
