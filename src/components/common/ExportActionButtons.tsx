'use client';

import React from 'react';
import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import {
  Download as DownloadIcon,
} from '@mui/icons-material';

interface ExportActionButtonsProps {
  exportType: 'image' | 'pdf' | 'csv';
  exportedImageUrl: string | null;
  handleDownload: () => void;
  handleExport: () => void;
}

/**
 * エクスポートアクションボタンコンポーネント
 */
export function ExportActionButtons({
  exportType,
  exportedImageUrl,
  handleDownload,
  handleExport
}: ExportActionButtonsProps) {
  // 画像出力の場合（画像が生成済み）
  if (exportType === 'image' && exportedImageUrl) {
    return (
      <Box sx={{ my: 3, textAlign: 'center' }}>
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
    );
  }

  // PDF/CSV出力の場合、または画像出力で画像がまだ生成されていない場合
  return (
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
        {exportType === 'image' ? '画像を出力' : 
         exportType === 'pdf' ? 'PDFを出力' : 'CSVを出力'}
      </Typography>
      <Typography variant="body1" align="center">
        選択したアイテムと入力情報を{exportType === 'image' ? '画像' : 
                                    exportType === 'pdf' ? 'PDF' : 'CSV'}形式で出力します。
      </Typography>
      <Button
        variant="contained"
        color="secondary"
        size="large"
        onClick={handleExport}
        sx={{ mt: 2, px: 4, py: 1, fontWeight: 'bold' }}
      >
        {exportType === 'image' ? '画像を生成' : 
         exportType === 'pdf' ? 'PDFを生成' : 'CSVを生成'}
      </Button>
    </Box>
  );
}
