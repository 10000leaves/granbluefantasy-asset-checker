'use client';

import React from 'react';
import { Box, Chip } from '@mui/material';

interface OwnedOnlyFilterProps {
  ownedOnly: boolean;
  onChange: (ownedOnly: boolean) => void;
}

/**
 * 所持アイテムのみを表示するフィルターコンポーネント
 */
export function OwnedOnlyFilter({ ownedOnly, onChange }: OwnedOnlyFilterProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
      <Chip
        label="所持のみ"
        size="small"
        variant={ownedOnly ? "filled" : "outlined"}
        color={ownedOnly ? "primary" : "default"}
        onClick={() => onChange(!ownedOnly)}
        sx={{
          borderRadius: '16px',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        }}
      />
    </Box>
  );
}
