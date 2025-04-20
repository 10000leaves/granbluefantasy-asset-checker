'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Grid,
} from '@mui/material';
import {
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useInputItems } from '@/hooks/useInputItems';
import { renderInputValue } from './ExportUtils';
import { WeaponAwakenings } from '@/atoms';

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


export function ExportDialogContent({
  exportType,
  isExporting,
  exportedImageUrl,
  tabValue,
  handleTabChange,
  handleDownload,
  handleExport,
  selectedItems,
  sessionData
}: ExportDialogContentProps) {
  // 入力項目の情報を取得
  const { inputGroups } = useInputItems();
  
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
  
  // 選択されたアイテムの数を取得
  const totalSelectedItems = useMemo(() => {
    return selectedItems.characters.length + 
           selectedItems.weapons.length + 
           selectedItems.summons.length;
  }, [selectedItems]);
  
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

  // 画像出力の場合
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
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{ px: 4, py: 1 }}
          >
            画像をダウンロード
          </Button>
        </Box>
      </Box>
    );
  }

  // PDF/CSV出力の場合
  if (exportType === 'pdf' || exportType === 'csv') {
    return (
      <Box sx={{ py: 2, textAlign: 'center' }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          mb: 3,
          p: 2,
          bgcolor: 'primary.light',
          color: 'primary.contrastText',
          borderRadius: 2
        }}>
          <Typography variant="h6" gutterBottom>
            {exportType === 'pdf' ? 'PDFを出力' : 'CSVを出力'}
          </Typography>
          <Typography variant="body1" align="center">
            選択したアイテムと入力情報を{exportType === 'pdf' ? 'PDF' : 'CSV'}形式で出力します。
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={handleExport}
            sx={{ mt: 2, px: 4, py: 1, fontWeight: 'bold' }}
          >
            {exportType === 'pdf' ? 'PDFを生成' : 'CSVを生成'}
          </Button>
        </Box>
        
        {/* エクスポートコンテンツ（PDF/CSV出力用） - 非表示 */}
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
            <Typography variant="h5" gutterBottom>
              グラブル所持チェッカー
            </Typography>
            
            {/* ユーザー情報 */}
            {sessionData?.inputValues && Object.keys(sessionData.inputValues).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  ユーザー情報
                </Typography>
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
              </Box>
            )}
            
            {/* キャラ */}
            {selectedItems.characters.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  キャラ ({selectedItems.characters.length})
                </Typography>
                <Grid container spacing={1}>
                  {selectedItems.characters.map(char => (
                    <Grid item xs={4} sm={3} md={2} key={char.id}>
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
                        margin: '0 auto'
                      }}>
                        {char.imageUrl ? (
                          <img 
                            src={char.imageUrl} 
                            alt={char.name} 
                            style={{ 
                              maxHeight: '100%', 
                              maxWidth: '100%', 
                              objectFit: 'contain' 
                            }} 
                          />
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
            {selectedItems.weapons.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  武器 ({selectedItems.weapons.length})
                </Typography>
                <Grid container spacing={1}>
                  {selectedItems.weapons.map(weapon => (
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
                          width: 60
                        }}>
                          {weapon.imageUrl ? (
                            <img 
                              src={weapon.imageUrl} 
                              alt={weapon.name} 
                              style={{ 
                                maxHeight: '100%', 
                                maxWidth: '100%', 
                                objectFit: 'contain' 
                              }} 
                            />
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
            {selectedItems.summons.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  召喚石 ({selectedItems.summons.length})
                </Typography>
                <Grid container spacing={1}>
                  {selectedItems.summons.map(summon => (
                    <Grid item xs={4} sm={3} md={2} key={summon.id}>
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
                        margin: '0 auto'
                      }}>
                        {summon.imageUrl ? (
                          <img 
                            src={summon.imageUrl} 
                            alt={summon.name} 
                            style={{ 
                              maxHeight: '100%', 
                              maxWidth: '100%', 
                              objectFit: 'contain' 
                            }} 
                          />
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
            {selectedItems.characters.length === 0 && 
             selectedItems.weapons.length === 0 && 
             selectedItems.summons.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  選択されたアイテムがありません
                </Typography>
              </Box>
            )}
          </Box>
        </div>
      </Box>
    );
  }

  // エクスポートコンテンツ（プレビュー）
  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        mb: 3,
        p: 2,
        bgcolor: 'primary.light',
        color: 'primary.contrastText',
        borderRadius: 2
      }}>
        <Typography variant="h6" gutterBottom>
          画像を出力
        </Typography>
        <Typography variant="body1" align="center">
          選択したアイテムと入力情報を画像形式で出力します。
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          onClick={handleExport}
          sx={{ mt: 2, px: 4, py: 1, fontWeight: 'bold' }}
        >
          画像を生成
        </Button>
      </Box>

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
        <Typography variant="h5" gutterBottom sx={{ borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}>
          グラブル所持チェッカー
        </Typography>
        
        {/* ユーザー情報セクション */}
        {sessionData?.inputValues && Object.keys(sessionData.inputValues).length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ 
              bgcolor: 'primary.main', 
              color: 'primary.contrastText', 
              px: 2, 
              py: 1, 
              borderRadius: 1 
            }}>
              ユーザー情報
            </Typography>
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
          </Box>
        )}
        
        {/* 選択アイテムセクション */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ 
            bgcolor: 'primary.main', 
            color: 'primary.contrastText', 
            px: 2, 
            py: 1, 
            borderRadius: 1 
          }}>
            選択アイテム ({totalSelectedItems})
          </Typography>
          
          {/* キャラ */}
          {selectedItems.characters.length > 0 && (
            <Box sx={{ mb: 3, px: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ 
                borderBottom: '1px solid', 
                borderColor: 'primary.light',
                pb: 0.5,
                color: 'primary.dark',
                fontWeight: 'bold'
              }}>
                キャラ ({selectedItems.characters.length})
              </Typography>
              <Grid container spacing={1}>
                {selectedItems.characters.map(char => (
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
                        <img 
                          src={char.imageUrl} 
                          alt={char.name} 
                          style={{ 
                            maxHeight: '100%', 
                            maxWidth: '100%', 
                            objectFit: 'contain' 
                          }} 
                        />
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
          {selectedItems.weapons.length > 0 && (
            <Box sx={{ mb: 3, px: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ 
                borderBottom: '1px solid', 
                borderColor: 'primary.light',
                pb: 0.5,
                color: 'primary.dark',
                fontWeight: 'bold'
              }}>
                武器 ({selectedItems.weapons.length})
              </Typography>
              <Grid container spacing={1}>
                {selectedItems.weapons.map(weapon => (
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
                        width: 60
                      }}>
                        {weapon.imageUrl ? (
                          <img 
                            src={weapon.imageUrl} 
                            alt={weapon.name} 
                            style={{ 
                              maxHeight: '100%', 
                              maxWidth: '100%', 
                              objectFit: 'contain' 
                            }} 
                          />
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
                            {weapon.count ?? 0}本
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
                              {type}{String(count)}
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
          {selectedItems.summons.length > 0 && (
            <Box sx={{ mb: 3, px: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ 
                borderBottom: '1px solid', 
                borderColor: 'primary.light',
                pb: 0.5,
                color: 'primary.dark',
                fontWeight: 'bold'
              }}>
                召喚石 ({selectedItems.summons.length})
              </Typography>
              <Grid container spacing={1}>
                {selectedItems.summons.map(summon => (
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
                        <img 
                          src={summon.imageUrl} 
                          alt={summon.name} 
                          style={{ 
                            maxHeight: '100%', 
                            maxWidth: '100%', 
                            objectFit: 'contain' 
                          }} 
                        />
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
          {totalSelectedItems === 0 && (
            <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
              <Typography variant="body1" color="text.secondary">
                選択されたアイテムがありません
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* フッター */}
        <Box sx={{ 
          mt: 4, 
          pt: 2, 
          borderTop: '1px solid', 
          borderColor: 'divider',
          textAlign: 'center'
        }}>
          <Typography variant="caption" color="text.secondary">
            Generated by granblue-asset-checker • {new Date().toLocaleDateString()}
          </Typography>
        </Box>
      </Box>
      
      {/* エクスポートオプション */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        mt: 3, 
        gap: 2,
        flexWrap: 'wrap'
      }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => handleTabChange({} as React.SyntheticEvent, 0)}
          sx={{ minWidth: 120 }}
        >
          画像出力
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            // PDFエクスポートに切り替え
            handleTabChange({} as React.SyntheticEvent, 1);
            // PDFエクスポートを実行
            handleExport();
          }}
          sx={{ minWidth: 120 }}
        >
          PDF出力
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            // CSVエクスポートに切り替え
            handleTabChange({} as React.SyntheticEvent, 2);
            // CSVエクスポートを実行
            handleExport();
          }}
          sx={{ minWidth: 120 }}
        >
          CSV出力
        </Button>
      </Box>
    </Box>
  );
}
