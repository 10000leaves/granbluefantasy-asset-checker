'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Checkbox,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Whatshot as FireIcon,
  Water as WaterIcon,
  Grass as EarthIcon,
  Air as WindIcon,
  LightMode as LightIcon,
  DarkMode as DarkIcon,
  BrokenImage as BrokenImageIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  AutoAwesome as AwakeningIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAtom } from 'jotai';
import { weaponCountsAtom, weaponAwakeningsAtom, AwakeningType } from '@/atoms';

import { translateElement } from '../../lib/utils/helpers';

interface WeaponCardProps {
  id: string;
  name: string;
  imageUrl: string;
  element: 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';
  weaponType: string;
  rarity?: 'SSR' | 'SR' | 'R';
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
}

// 覚醒タイプの選択肢
const awakeningTypes: AwakeningType[] = ['攻撃', '防御', '特殊', '連撃', '回復', '奥義', 'アビD'];

// 覚醒タイプの色マッピング
const awakeningColors: Record<AwakeningType, string> = {
  '攻撃': '#FF4444',
  '防御': '#44AAFF',
  '特殊': '#FFAA44',
  '連撃': '#AA44FF',
  '回復': '#44FF44',
  '奥義': '#FFFF44',
  'アビD': '#FF44FF',
};

const elementIcons = {
  fire: { icon: FireIcon, color: '#FF4444' },
  water: { icon: WaterIcon, color: '#4444FF' },
  earth: { icon: EarthIcon, color: '#BB8844' },
  wind: { icon: WindIcon, color: '#44BB44' },
  light: { icon: LightIcon, color: '#FFBB44' },
  dark: { icon: DarkIcon, color: '#AA44FF' },
};

export const WeaponCard = ({
  id,
  name,
  imageUrl,
  element,
  weaponType,
  rarity = 'SSR',
  selected,
  onSelect,
}: WeaponCardProps) => {
  const ElementIcon = elementIcons[element].icon;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [weaponCounts, setWeaponCounts] = useAtom(weaponCountsAtom);
  const [weaponAwakenings, setWeaponAwakenings] = useAtom(weaponAwakeningsAtom);
  const count = weaponCounts[id] || 0;
  const awakenings = weaponAwakenings[id] || {};
  const [showAwakeningDialog, setShowAwakeningDialog] = useState(false);
  
  // 覚醒の合計本数を計算
  const totalAwakeningCount = useMemo(() => {
    return Object.values(awakenings).reduce((sum, count) => sum + count, 0);
  }, [awakenings]);

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    console.error(`Image error: ${name}, URL: ${imageUrl}`);
    setLoading(false);
    setError(true);
  };

  // 所持数を更新する関数
  const updateCount = (newCount: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    // 0未満にならないようにする
    const validCount = Math.max(0, newCount);
    
    setWeaponCounts(prev => ({
      ...prev,
      [id]: validCount
    }));
  };

  // 覚醒本数を更新する関数
  const updateAwakeningCount = (type: AwakeningType, newCount: number, e?: React.MouseEvent | React.ChangeEvent<any>) => {
    if (e) {
      e.stopPropagation();
    }
    
    // 現在の合計本数から対象の覚醒タイプの本数を引く
    const currentTypeCount = awakenings[type] || 0;
    const otherTypesCount = totalAwakeningCount - currentTypeCount;
    
    // 最大本数は武器の所持数
    const maxAvailable = Math.max(0, count - otherTypesCount);
    
    // 0未満または最大値より大きくならないようにする
    const validCount = Math.max(0, Math.min(maxAvailable, newCount));
    
    // 新しい覚醒情報を作成
    const newAwakenings = { ...awakenings };
    
    if (validCount === 0) {
      // 本数が0の場合はプロパティを削除
      delete newAwakenings[type];
    } else {
      // 本数を更新
      newAwakenings[type] = validCount;
    }
    
    setWeaponAwakenings(prev => ({
      ...prev,
      [id]: newAwakenings
    }));
  };

  // 覚醒ダイアログを開く
  const openAwakeningDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAwakeningDialog(true);
  };

  // 覚醒ダイアログを閉じる
  const closeAwakeningDialog = () => {
    setShowAwakeningDialog(false);
  };

  // 所持数の入力を処理する関数
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const value = e.target.value;
    
    // 空の場合は0にする
    if (value === '') {
      updateCount(0);
      return;
    }
    
    // 数値以外は無視する
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      return;
    }
    
    updateCount(numValue);
  };

  return (
    <>
      <Card
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          margin: '0 auto',
          cursor: 'pointer',
          '&:hover': {
            boxShadow: 6,
          },
        }}
        onClick={() => onSelect(id, !selected)}
      >
        <Box sx={{ position: 'relative', height: 160, width: '100%' }}>
          {loading && (
            <Skeleton
              variant="rectangular"
              width="100%"
              height={160}
              animation="wave"
              sx={{ position: 'absolute', top: 0, left: 0 }}
            />
          )}
          
          {error ? (
            <Box
              sx={{
                height: 160,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0, 0, 0, 0.1)',
              }}
            >
              <BrokenImageIcon sx={{ fontSize: 60, color: 'text.disabled' }} />
            </Box>
          ) : (
            <Box sx={{ position: 'relative', height: 160, width: '100%' }}>
              <Image
                src={imageUrl}
                alt={name}
                fill
                style={{ 
                  objectFit: 'cover',
                  filter: selected ? 'brightness(0.8)' : 'none',
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
                unoptimized
              />
            </Box>
          )}
          
          <Checkbox
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(id, e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: 1,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)',
              },
            }}
          />
          <Tooltip title={`${translateElement(element)}属性`}>
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                bgcolor: elementIcons[element].color,
                color: 'white',
                '&:hover': {
                  bgcolor: elementIcons[element].color,
                },
              }}
            >
              <ElementIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <CardContent sx={{ pt: 1, pb: '8px !important', flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="subtitle2"
              component="div"
              sx={{
                flexGrow: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Chip
                label={rarity}
                size="small"
                sx={{
                  bgcolor: rarity === 'SSR' ? '#FFD700' : rarity === 'SR' ? '#C0C0C0' : '#CD7F32',
                  color: rarity === 'SSR' ? '#000' : '#fff',
                  fontWeight: 'bold',
                  minWidth: 40,
                }}
              />
              <Chip
                label={weaponType}
                size="small"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  fontWeight: 'bold',
                  minWidth: 40,
                }}
              />
            </Box>
          </Box>
          
          {/* 所持数と覚醒入力エリア */}
          <Box onClick={(e) => e.stopPropagation()}>
            {/* 所持数入力フィールド */}
            <Box 
              sx={{ 
                mt: 1, 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1 
              }}
            >
              <IconButton 
                size="small" 
                onClick={(e) => updateCount(count - 1, e)}
                disabled={count <= 0}
                sx={{ 
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              
              <TextField
                value={count}
                onChange={handleCountChange}
                variant="outlined"
                size="small"
                type="number"
                inputProps={{ 
                  min: 0, 
                  style: { textAlign: 'center', padding: '2px 0' } 
                }}
                sx={{ 
                  width: '60px',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                  },
                }}
                onClick={(e) => e.stopPropagation()}
              />
              
              <IconButton 
                size="small" 
                onClick={(e) => updateCount(count + 1, e)}
                sx={{ 
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
            
            {/* 覚醒情報表示 */}
            <Box 
              sx={{ 
                mt: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}
            >
              <Tooltip title="覚醒タイプ">
                <IconButton
                  size="small"
                  onClick={openAwakeningDialog}
                  sx={{
                    bgcolor: Object.keys(awakenings).length > 0 ? 'primary.main' : 'action.hover',
                    color: Object.keys(awakenings).length > 0 ? 'white' : 'inherit',
                    '&:hover': { 
                      bgcolor: Object.keys(awakenings).length > 0 ? 'primary.main' : 'action.selected',
                      opacity: 0.8
                    }
                  }}
                >
                  <AwakeningIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              {Object.keys(awakenings).length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 180 }}>
                  {Object.entries(awakenings).map(([type, count]) => (
                    <Chip
                      key={type}
                      label={`${type} ${count}`}
                      size="small"
                      sx={{
                        bgcolor: awakeningColors[type as AwakeningType],
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                        height: 24
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 覚醒設定ダイアログ */}
      <Dialog 
        open={showAwakeningDialog} 
        onClose={closeAwakeningDialog}
        onClick={(e) => e.stopPropagation()}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">覚醒設定</Typography>
          <IconButton edge="end" color="inherit" onClick={closeAwakeningDialog} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            {name} - 残り: {Math.max(0, count - totalAwakeningCount)}本
          </Typography>
          
          {awakeningTypes.map((type) => {
            const typeCount = awakenings[type] || 0;
            const maxAvailable = Math.max(0, count - (totalAwakeningCount - typeCount));
            
            return (
              <Box key={type} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip
                    label={type}
                    size="small"
                    sx={{
                      bgcolor: awakeningColors[type],
                      color: 'white',
                      fontWeight: 'bold',
                      mr: 1
                    }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton 
                      size="small" 
                      onClick={(e) => updateAwakeningCount(type, typeCount - 1, e)}
                      disabled={typeCount <= 0}
                      sx={{ 
                        bgcolor: 'action.hover',
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    
                    <TextField
                      value={typeCount}
                      onChange={(e) => {
                        e.stopPropagation();
                        const value = e.target.value;
                        
                        // 空の場合は0にする
                        if (value === '') {
                          updateAwakeningCount(type, 0, e);
                          return;
                        }
                        
                        // 数値以外は無視する
                        const numValue = parseInt(value, 10);
                        if (isNaN(numValue)) {
                          return;
                        }
                        
                        updateAwakeningCount(type, numValue, e);
                      }}
                      variant="outlined"
                      size="small"
                      type="number"
                      inputProps={{ 
                        min: 0, 
                        max: maxAvailable,
                        style: { textAlign: 'center', padding: '2px 0' } 
                      }}
                      sx={{ 
                        width: '60px',
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'divider',
                          },
                        },
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <IconButton 
                      size="small" 
                      onClick={(e) => updateAwakeningCount(type, typeCount + 1, e)}
                      disabled={typeCount >= maxAvailable || maxAvailable <= 0}
                      sx={{ 
                        bgcolor: 'action.hover',
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAwakeningDialog} color="primary">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
