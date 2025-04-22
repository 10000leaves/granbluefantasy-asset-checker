'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import { useInputItems } from '@/hooks/useInputItems';
import { useTags } from '@/hooks/useTags';
import { ExportFilterSettings, ExportFilterSettingsComponent } from './ExportFilterSettings';
import { ExportContentItems } from './ExportContentItems';
import { ExportActionButtons } from './ExportActionButtons';
import { WeaponAwakenings } from '@/atoms';
import { createTagCategoryMap, generateItemTagData } from '@/lib/utils/helpers';

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
    tagFilters: {},
  });

  // タグカテゴリのマッピングを動的に生成
  const tagCategoryMap = useMemo(() => {
    return createTagCategoryMap(allTagCategories);
  }, [allTagCategories]);

  // タグカテゴリが読み込まれたら、動的にフィルター状態を初期化
  useEffect(() => {
    if (allTagCategories.length > 0) {
      const tagCategoryMap = createTagCategoryMap(allTagCategories);
      const initialTagFilters: Record<string, string[]> = {};
      
      // 全てのカテゴリに対応するフィルターキーを初期化
      Object.values(tagCategoryMap).forEach(key => {
        initialTagFilters[key] = [];
      });
      
      setFilterSettings(prev => ({
        ...prev,
        tagFilters: initialTagFilters
      }));
    }
  }, [allTagCategories]);

  // フィルター設定の変更ハンドラー
  const handleFilterChange = (setting: keyof ExportFilterSettings, checked: boolean) => {
    setFilterSettings({
      ...filterSettings,
      [setting]: checked,
    });
  };

  // タグフィルターの変更ハンドラー
  const handleTagFilterChange = (
    category: string,
    value: string,
    checked: boolean
  ) => {
    setFilterSettings(prev => ({
      ...prev,
      tagFilters: {
        ...prev.tagFilters,
        [category]: checked
          ? [...(prev.tagFilters[category] || []), value]
          : (prev.tagFilters[category] || []).filter(item => item !== value)
      }
    }));
  };

  // 特定のタグフィルターのクリア
  const handleClearTagFilter = (category: string, value: string) => {
    setFilterSettings(prev => ({
      ...prev,
      tagFilters: {
        ...prev.tagFilters,
        [category]: (prev.tagFilters[category] || []).filter(item => item !== value)
      }
    }));
  };

  // 全てのタグフィルターのクリア
  const handleClearAllTagFilters = () => {
    const emptyTagFilters: Record<string, string[]> = {};
    
    // 全てのフィルターキーを空の配列で初期化
    Object.keys(filterSettings.tagFilters).forEach(key => {
      emptyTagFilters[key] = [];
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
  const getItemsWithUnowned = useMemo(() => {
    if (!filterSettings.includeUnowned) {
      return selectedItems;
    }

    // 未所持アイテムを含めるロジック
    // ここでは、選択されたアイテムに未所持フラグを追加する
    return {
      characters: selectedItems.characters.map(character => ({
        ...character,
        isUnowned: !selectedItems.characters.some(item => item.id === character.id)
      })),
      weapons: selectedItems.weapons.map(weapon => ({
        ...weapon,
        isUnowned: !selectedItems.weapons.some(item => item.id === weapon.id)
      })),
      summons: selectedItems.summons.map(summon => ({
        ...summon,
        isUnowned: !selectedItems.summons.some(item => item.id === summon.id)
      }))
    };
  }, [selectedItems, filterSettings.includeUnowned]);

  // フィルター処理されたアイテム
  const filteredItems = useMemo(() => {
    // タグフィルターが空の場合は全てのアイテムを表示
    const hasActiveTagFilters = Object.values(filterSettings.tagFilters).some(
      filters => filters.length > 0
    );

    const itemsToFilter = getItemsWithUnowned;

    if (!hasActiveTagFilters) {
      return itemsToFilter;
    }

    // キャラクターのフィルタリング
    const filteredCharacters = itemsToFilter.characters.filter(character => {
      // タグでのフィルタリング
      const characterTagData = generateItemTagData(character, allTagCategories, {}, tagCategoryMap);
      
      // 各フィルターカテゴリをチェック
      for (const [category, selectedValues] of Object.entries(filterSettings.tagFilters)) {
        if (selectedValues.length === 0) continue;
        
        const characterValues = characterTagData[category] || [];
        
        // いずれかの値が一致するかチェック
        const hasMatch = selectedValues.some(value => characterValues.includes(value));
        
        if (!hasMatch) return false;
      }

      return true;
    });

    // 武器のフィルタリング
    const filteredWeapons = itemsToFilter.weapons.filter(weapon => {
      // タグでのフィルタリング
      const weaponTagData = generateItemTagData(weapon, allTagCategories, {}, tagCategoryMap);
      
      // 各フィルターカテゴリをチェック
      for (const [category, selectedValues] of Object.entries(filterSettings.tagFilters)) {
        if (selectedValues.length === 0) continue;
        
        const weaponValues = weaponTagData[category] || [];
        
        // いずれかの値が一致するかチェック
        const hasMatch = selectedValues.some(value => weaponValues.includes(value));
        
        if (!hasMatch) return false;
      }

      return true;
    });

    // 召喚石のフィルタリング
    const filteredSummons = itemsToFilter.summons.filter(summon => {
      // タグでのフィルタリング
      const summonTagData = generateItemTagData(summon, allTagCategories, {}, tagCategoryMap);
      
      // 各フィルターカテゴリをチェック
      for (const [category, selectedValues] of Object.entries(filterSettings.tagFilters)) {
        if (selectedValues.length === 0) continue;
        
        const summonValues = summonTagData[category] || [];
        
        // いずれかの値が一致するかチェック
        const hasMatch = selectedValues.some(value => summonValues.includes(value));
        
        if (!hasMatch) return false;
      }

      return true;
    });

    return {
      characters: filteredCharacters,
      weapons: filteredWeapons,
      summons: filteredSummons
    };
  }, [getItemsWithUnowned, filterSettings.tagFilters, allTagCategories, tagCategoryMap]);
  
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
  if (exportType === 'image' && exportedImageUrl) {
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
        <ExportActionButtons
          exportType={exportType}
          exportedImageUrl={exportedImageUrl}
          handleDownload={handleDownload}
          handleExport={handleExport}
        />
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
                tagFilters: {}
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
      {/* タブ切り替え */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={currentItemType} 
          onChange={(_, newValue) => setCurrentItemType(newValue)}
          variant="fullWidth"
          aria-label="アイテムタイプ"
        >
          <Tab label="キャラ" value="character" />
          <Tab label="武器" value="weapon" />
          <Tab label="召喚石" value="summon" />
        </Tabs>
      </Box>

      {/* フィルター設定 */}
      <ExportFilterSettingsComponent
        filterSettings={filterSettings}
        onFilterChange={handleFilterChange}
        onTagFilterChange={handleTagFilterChange}
        onClearTagFilter={handleClearTagFilter}
        onClearAllTagFilters={handleClearAllTagFilters}
        itemType={currentItemType}
      />

      {/* アクションボタン */}
      <ExportActionButtons
        exportType={exportType}
        exportedImageUrl={exportedImageUrl}
        handleDownload={handleDownload}
        handleExport={handleExport}
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
