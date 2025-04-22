'use client';

import React from 'react';
import {
  Box,
  Typography,
  Grid,
} from '@mui/material';
import { WeaponAwakenings } from '@/atoms';
import { renderInputValue } from './ExportUtils';
import { ExportFilterSettings } from './ExportFilterSettings';

interface ExportContentItemsProps {
  filterSettings: ExportFilterSettings;
  selectedItems: {
    characters: any[];
    weapons: {
      id: string;
      name: string;
      imageUrl: string;
      count?: number;
      awakenings?: WeaponAwakenings;
      isUnowned?: boolean;
      [key: string]: any;
    }[];
    summons: any[];
  };
  sessionData: any;
  getItemName: (itemId: string) => string;
  isPdfMode?: boolean;
}

/**
 * エクスポートコンテンツのアイテム表示コンポーネント
 */
export function ExportContentItems({
  filterSettings,
  selectedItems,
  sessionData,
  getItemName,
  isPdfMode = false
}: ExportContentItemsProps) {
  // 選択されたアイテムの数を取得
  const totalSelectedItems = 
    selectedItems.characters.length + 
    selectedItems.weapons.length + 
    selectedItems.summons.length;

  return (
    <>
      <Typography variant="h5" gutterBottom sx={isPdfMode ? undefined : { borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}>
        グラブル所持チェッカー
      </Typography>
      
      {/* ユーザー情報 */}
      {filterSettings.showUserInfo && sessionData?.inputValues && Object.keys(sessionData.inputValues).length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={isPdfMode ? undefined : { 
            bgcolor: 'primary.main', 
            color: 'primary.contrastText', 
            px: 2, 
            py: 1, 
            borderRadius: 1 
          }}>
            ユーザー情報
          </Typography>
          {isPdfMode ? (
            <Grid container spacing={2}>
              {Object.entries(sessionData.inputValues).map(([key, value]) => (
                <Grid item xs={6} sm={4} key={key}>
                  <Typography variant="body2" color="text.secondary">
                    {getItemName(key)}:
                  </Typography>
                  <Typography variant="body1">
                    {renderInputValue({ id: key, name: getItemName(key), type: typeof value === 'boolean' ? 'checkbox' : 'text', order_index: 0, required: false, default_value: null }, value)}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ px: 2 }}>
              <Grid container spacing={2}>
                {Object.entries(sessionData.inputValues).map(([key, value]) => (
                  <Grid item xs={12} sm={6} md={4} key={key}>
                    <Box sx={{ 
                      p: 2, 
                      border: '1px solid', 
                      borderColor: 'divider', 
                      borderRadius: 1,
                      bgcolor: 'background.default',
                      height: '100%'
                    }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {getItemName(key)}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {renderInputValue({ id: key, name: getItemName(key), type: typeof value === 'boolean' ? 'checkbox' : 'text', order_index: 0, required: false, default_value: null }, value)}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      )}
      
      {/* 選択アイテムセクション */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={isPdfMode ? undefined : { 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText', 
          px: 2, 
          py: 1, 
          borderRadius: 1 
        }}>
          選択アイテム ({totalSelectedItems})
        </Typography>
        
        {/* キャラ */}
        {filterSettings.showCharacters && selectedItems.characters.length > 0 && (
          <Box sx={{ mb: 3, px: isPdfMode ? 0 : 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={isPdfMode ? undefined : { 
              borderBottom: '1px solid', 
              borderColor: 'primary.light',
              pb: 0.5,
              color: 'primary.dark',
              fontWeight: 'bold'
            }}>
              キャラ ({selectedItems.characters.length})
            </Typography>
            <Grid container spacing={1}>
              {selectedItems.characters.map((char) => (
                <Grid item xs={4} sm={3} md={2} key={char.id}>
                  <Box sx={{ 
                    position: 'relative',
                    p: 0.5, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 60,
                    width: 60,
                    margin: '0 auto'
                  }}>
                    {char.imageUrl ? (
                      <>
                        <img 
                          src={char.imageUrl} 
                          alt={char.name} 
                          style={{ 
                            maxHeight: '100%', 
                            maxWidth: '100%', 
                            objectFit: 'contain' 
                          }} 
                        />
                        {/* 未所持アイテムの場合、暗いレイヤーを追加 */}
                        {char.isUnowned && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: 'rgba(0, 0, 0, 0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                              未所持
                            </Typography>
                          </Box>
                        )}
                      </>
                    ) : (
                      <Typography variant="caption" noWrap>
                        {char.name}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        
        {/* 武器 */}
        {filterSettings.showWeapons && selectedItems.weapons.length > 0 && (
          <Box sx={{ mb: 3, px: isPdfMode ? 0 : 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={isPdfMode ? undefined : { 
              borderBottom: '1px solid', 
              borderColor: 'primary.light',
              pb: 0.5,
              color: 'primary.dark',
              fontWeight: 'bold'
            }}>
              武器 ({selectedItems.weapons.length})
            </Typography>
            <Grid container spacing={1}>
              {selectedItems.weapons.map((weapon) => (
                <Grid item xs={4} sm={3} md={2} key={weapon.id}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    {/* 武器画像 */}
                    <Box sx={{ 
                      p: 0.5, 
                      border: '1px solid', 
                      borderColor: 'divider', 
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: 60,
                      width: 60,
                      position: 'relative',
                    }}>
                      {weapon.imageUrl ? (
                        <>
                          <img 
                            src={weapon.imageUrl} 
                            alt={weapon.name} 
                            style={{ 
                              maxHeight: '100%', 
                              maxWidth: '100%', 
                              objectFit: 'contain' 
                            }} 
                          />
                          {/* 未所持アイテムの場合、暗いレイヤーを追加 */}
                          {weapon.isUnowned && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                                未所持
                              </Typography>
                            </Box>
                          )}
                        </>
                      ) : (
                        <Typography variant="caption" noWrap>
                          {weapon.name}
                        </Typography>
                      )}
                    </Box>
                    
                    {/* 所持数と覚醒情報 */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5, maxWidth: 80 }}>
                      {(weapon.count ?? 0) > 0 && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            bgcolor: 'primary.main',
                            color: 'white',
                            px: 0.5,
                            borderRadius: 1,
                            fontWeight: 'bold',
                            fontSize: '0.6rem'
                          }}
                        >
                          {weapon.count || 0}本
                        </Typography>
                      )}
                      {weapon.awakenings && Object.keys(weapon.awakenings).length > 0 && (
                        Object.entries(weapon.awakenings as WeaponAwakenings).map(([type, count]) => (
                          <Typography 
                            key={type}
                            variant="caption" 
                            sx={{ 
                              bgcolor: 
                                type === '攻撃' ? '#FF4444' :
                                type === '防御' ? '#44AAFF' :
                                type === '特殊' ? '#FFAA44' :
                                type === '連撃' ? '#AA44FF' :
                                type === '回復' ? '#44FF44' :
                                type === '奥義' ? '#FFFF44' :
                                type === 'アビD' ? '#FF44FF' :
                                '#888888',
                              color: 'white',
                              px: 0.5,
                              borderRadius: 1,
                              fontWeight: 'bold',
                              fontSize: '0.6rem'
                            }}
                          >
                            {type}{count}
                          </Typography>
                        ))
                      )}
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        
        {/* 召喚石 */}
        {filterSettings.showSummons && selectedItems.summons.length > 0 && (
          <Box sx={{ mb: 3, px: isPdfMode ? 0 : 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={isPdfMode ? undefined : { 
              borderBottom: '1px solid', 
              borderColor: 'primary.light',
              pb: 0.5,
              color: 'primary.dark',
              fontWeight: 'bold'
            }}>
              召喚石 ({selectedItems.summons.length})
            </Typography>
            <Grid container spacing={1}>
              {selectedItems.summons.map((summon) => (
                <Grid item xs={4} sm={3} md={2} key={summon.id}>
                  <Box sx={{ 
                    position: 'relative',
                    p: 0.5, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 60,
                    width: 60,
                    margin: '0 auto'
                  }}>
                    {summon.imageUrl ? (
                      <>
                        <img 
                          src={summon.imageUrl} 
                          alt={summon.name} 
                          style={{ 
                            maxHeight: '100%', 
                            maxWidth: '100%', 
                            objectFit: 'contain' 
                          }} 
                        />
                        {/* 未所持アイテムの場合、暗いレイヤーを追加 */}
                        {summon.isUnowned && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: 'rgba(0, 0, 0, 0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                              未所持
                            </Typography>
                          </Box>
                        )}
                      </>
                    ) : (
                      <Typography variant="caption" noWrap>
                        {summon.name}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        
        {/* 選択アイテムがない場合 */}
        {(!filterSettings.showCharacters || selectedItems.characters.length === 0) && 
         (!filterSettings.showWeapons || selectedItems.weapons.length === 0) && 
         (!filterSettings.showSummons || selectedItems.summons.length === 0) && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              選択されたアイテムがありません
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
}
