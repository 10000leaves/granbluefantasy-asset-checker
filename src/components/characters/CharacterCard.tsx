import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Checkbox,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  Whatshot as FireIcon,
  Water as WaterIcon,
  Grass as EarthIcon,
  Air as WindIcon,
  LightMode as LightIcon,
  DarkMode as DarkIcon,
  BrokenImage as BrokenImageIcon,
} from '@mui/icons-material';

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

  const handleImageLoad = () => {
    console.log(`Image loaded: ${name}`);
    setLoading(false);
  };

  const handleImageError = () => {
    console.error(`Image error: ${name}, URL: ${imageUrl}`);
    setLoading(false);
    setError(true);
  };

  // コンポーネントがマウントされたときにURLをログに出力
  useEffect(() => {
    console.log(`Character image URL: ${imageUrl}`);
  }, [imageUrl]);

  return (
    <Card
      sx={{
        position: 'relative',
        width: 280,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        margin: '0 auto',
        '&:hover': {
          boxShadow: 6,
        },
      }}
    >
      <Box sx={{ position: 'relative', height: 160, width: 280 }}>
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
          <Box sx={{ position: 'relative', height: 160, width: 280 }}>
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
          onChange={(e) => onSelect(id, e.target.checked)}
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
        <Tooltip title={`${element}属性`}>
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
      </CardContent>
    </Card>
  );
};
