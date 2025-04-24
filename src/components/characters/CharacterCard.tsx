import React, { useState } from 'react';
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
} from '@mui/material';
import { useAtom } from 'jotai';
import { characterNotesAtom } from '@/atoms';
import {
  Whatshot as FireIcon,
  Water as WaterIcon,
  Grass as EarthIcon,
  Air as WindIcon,
  LightMode as LightIcon,
  DarkMode as DarkIcon,
  BrokenImage as BrokenImageIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { NoteDialog } from '../common/NoteDialog';

import { translateElement } from '../../lib/utils/helpers';

interface CharacterCardProps {
  id: string;
  name: string;
  imageUrl: string;
  element: 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';
  rarity: 'SSR' | 'SR' | 'R';
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
}

const elementIcons = {
  fire: { icon: FireIcon, color: '#FF4444' },
  water: { icon: WaterIcon, color: '#4444FF' },
  earth: { icon: EarthIcon, color: '#BB8844' },
  wind: { icon: WindIcon, color: '#44BB44' },
  light: { icon: LightIcon, color: '#FFBB44' },
  dark: { icon: DarkIcon, color: '#AA44FF' },
};

const rarityColors = {
  SSR: '#FFD700',
  SR: '#C0C0C0',
  R: '#CD7F32',
};

export const CharacterCard = ({
  id,
  name,
  imageUrl,
  element,
  rarity,
  selected,
  onSelect,
}: CharacterCardProps) => {
  const ElementIcon = elementIcons[element].icon;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [characterNotes, setCharacterNotes] = useAtom(characterNotesAtom);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  
  // 備考を取得
  const note = characterNotes[id] || '';
  
  // 備考ダイアログを開く
  const openNoteDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNoteDialog(true);
  };
  
  // 備考を保存
  const handleSaveNote = (newNote: string) => {
    setCharacterNotes(prev => ({
      ...prev,
      [id]: newNote
    }));
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    console.error(`Image error: ${name}, URL: ${imageUrl}`);
    setLoading(false);
    setError(true);
  };

  return (
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
          <Chip
            label={rarity}
            size="small"
            sx={{
              bgcolor: rarityColors[rarity],
              color: 'white',
              fontWeight: 'bold',
              minWidth: 40,
            }}
          />
        </Box>
        
        {/* 備考エリア */}
        <Box onClick={(e) => e.stopPropagation()}>
          <Box sx={{ 
            mt: 1, 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1 
          }}>
            {note ? (
              <Typography 
                variant="caption" 
                sx={{ 
                  flexGrow: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'text.secondary'
                }}
              >
                {note}
              </Typography>
            ) : (
              <Box sx={{ flexGrow: 1 }} />
            )}
            
            <Tooltip title="備考を編集">
              <IconButton
                size="small"
                onClick={openNoteDialog}
                sx={{
                  bgcolor: note ? 'primary.main' : 'action.hover',
                  color: note ? 'white' : 'inherit',
                  '&:hover': { 
                    bgcolor: note ? 'primary.main' : 'action.selected',
                    opacity: 0.8
                  },
                  width: 24,
                  height: 24
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
      
      {/* 備考編集ダイアログ */}
      <NoteDialog
        open={showNoteDialog}
        onClose={() => setShowNoteDialog(false)}
        onSave={handleSaveNote}
        initialNote={note}
        title="備考を編集"
        itemName={name}
      />
    </Card>
  );
};
