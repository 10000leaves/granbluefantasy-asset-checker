'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Fab,
  Zoom,
  Tooltip,
  Snackbar,
  Alert,
  IconButton,
  Grid,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useSession } from '@/hooks/useSession';
import { useInputItems } from '@/hooks/useInputItems';
import { useItems } from '@/hooks/useItems';
import html2canvas from 'html2canvas';

interface ExportPanelProps {
  selectedCount: number;
  onExport: () => void;
  onShare: () => void;
}

export function ExportPanel({ selectedCount, onExport, onShare }: ExportPanelProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { shareUrl, loadSession, sessionData } = useSession();
  const { inputGroups } = useInputItems();
  const { items: characterItems } = useItems('character');
  const { items: weaponItems } = useItems('weapon');
  const { items: summonItems } = useItems('summon');
  
  const [isExporting, setIsExporting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [exportedImageUrl, setExportedImageUrl] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // 選択されたアイテムを取得
  const getSelectedItems = () => {
    if (!sessionData) return { characters: [], weapons: [], summons: [] };
    
    const selectedCharacters = characterItems.filter(item => 
      sessionData.selectedItems.includes(item.id)
    );
    
    const selectedWeapons = weaponItems.filter(item => 
      sessionData.selectedItems.includes(item.id)
    );
    
    const selectedSummons = summonItems.filter(item => 
      sessionData.selectedItems.includes(item.id)
    );
    
    return {
      characters: selectedCharacters,
      weapons: selectedWeapons,
      summons: selectedSummons,
    };
  };

  // 画像出力処理
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setIsDialogOpen(true);
      
      // 少し遅延を入れて、ダイアログが表示されるのを待つ
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ダイアログ内のコンテンツを画像化
      const element = document.getElementById('export-content');
      if (!element) {
        throw new Error('Export content not found');
      }
      
      const canvas = await html2canvas(element, {
        scale: 2, // 高解像度
        useCORS: true, // 外部画像の読み込みを許可
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      
      // 画像をDataURLに変換
      const dataUrl = canvas.toDataURL('image/png');
      setExportedImageUrl(dataUrl);
      
      setSnackbarMessage('画像の生成に成功しました');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error exporting image:', error);
      setSnackbarMessage('画像の生成に失敗しました');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsExporting(false);
    }
  };

  // 画像のダウンロード
  const handleDownload = () => {
    if (!exportedImageUrl) return;
    
    const link = document.createElement('a');
    link.download = `gbf-checker-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = exportedImageUrl;
    link.click();
  };

  // 共有処理
  const handleShare = async () => {
    try {
      if (navigator.share && exportedImageUrl) {
        // Web Share APIが利用可能な場合
        const blob = await fetch(exportedImageUrl).then(r => r.blob());
        const file = new File([blob], 'gbf-checker.png', { type: 'image/png' });
        
        await navigator.share({
          title: 'グランブルーファンタジー所持チェッカー',
          text: '私の所持キャラ/武器/召喚石リストです',
          files: [file],
        });
      } else if (shareUrl) {
        // URLのコピー
        await navigator.clipboard.writeText(shareUrl);
        setSnackbarMessage('共有URLをクリップボードにコピーしました');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      setSnackbarMessage('共有に失敗しました');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  // スナックバーを閉じる
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // 入力項目の値を表示
  const renderInputValue = (item: any, value: any) => {
    if (item.type === 'checkbox') {
      return value ? '✓' : '✗';
    } else if (item.type === 'number' && item.name === 'キャラ与ダメ') {
      return `${value}%`;
    } else {
      return value || '-';
    }
  };

  // 選択されたアイテム
  const selectedItems = getSelectedItems();

  return (
    <>
      {/* 固定表示のエクスポートパネル */}
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: { xs: 1.5, sm: 2 },
          borderRadius: { xs: '16px 16px 0 0', sm: 0 },
          zIndex: 10,
          backgroundColor: 'background.paper',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
            {selectedCount > 0
              ? `${selectedCount}個のアイテムを選択中`
              : 'アイテムを選択してください'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ShareIcon />}
              onClick={handleShare}
              disabled={selectedCount === 0}
              size={isMobile ? 'small' : 'medium'}
            >
              共有
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ImageIcon />}
              onClick={handleExport}
              disabled={selectedCount === 0}
              size={isMobile ? 'small' : 'medium'}
            >
              画像出力
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* 画像出力ダイアログ */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <Typography variant="h6">画像出力</Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleCloseDialog}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, mt: 1 }}>
          {isExporting ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
              }}
            >
              <CircularProgress size={60} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                画像を生成中...
              </Typography>
            </Box>
          ) : exportedImageUrl ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Box
                component="img"
                src={exportedImageUrl}
                alt="Exported image"
                sx={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  border: '1px solid #ddd',
                  borderRadius: 1,
                }}
              />
            </Box>
          ) : (
            <Box id="export-content" sx={{ p: 2, bgcolor: 'white' }}>
              {/* ヘッダー */}
              <Box
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  backgroundImage: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
                  color: 'white',
                  textAlign: 'center',
                }}
              >
                <Typography variant="h5" fontWeight="bold">
                  グランブルーファンタジー所持チェッカー
                </Typography>
              </Box>

              {/* ユーザー情報 */}
              <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  ユーザー情報
                </Typography>
                
                <Grid container spacing={2}>
                  {inputGroups.map((group) => (
                    <Grid item xs={12} sm={group.group_name === '基本情報' ? 12 : 4} key={group.group_id}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {group.group_name}
                      </Typography>
                      {group.items.map((item) => (
                        <Typography key={item.id}>
                          {item.name}: {sessionData?.inputValues && renderInputValue(item, sessionData.inputValues[item.id])}
                        </Typography>
                      ))}
                    </Grid>
                  ))}
                </Grid>
              </Paper>

              {/* 選択アイテム */}
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  所持アイテム
                </Typography>
                
                <Grid container spacing={2}>
                  {/* キャラクター */}
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      キャラクター ({selectedItems.characters.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selectedItems.characters.map((character) => (
                        <Chip
                          key={character.id}
                          label={character.name}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>
                  
                  {/* 武器 */}
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      武器 ({selectedItems.weapons.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selectedItems.weapons.map((weapon) => (
                        <Chip
                          key={weapon.id}
                          label={weapon.name}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>
                  
                  {/* 召喚石 */}
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      召喚石 ({selectedItems.summons.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selectedItems.summons.map((summon) => (
                        <Chip
                          key={summon.id}
                          label={summon.name}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
              
              {/* フッター */}
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Generated by グランブルーファンタジー所持チェッカー • {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        {exportedImageUrl && (
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button
              variant="outlined"
              onClick={handleCloseDialog}
              startIcon={<CloseIcon />}
            >
              閉じる
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDownload}
              startIcon={<DownloadIcon />}
            >
              ダウンロード
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleShare}
              startIcon={<ShareIcon />}
            >
              共有
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* 通知 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
