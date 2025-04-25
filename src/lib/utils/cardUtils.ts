import {
  Whatshot as FireIcon,
  Water as WaterIcon,
  Grass as EarthIcon,
  Air as WindIcon,
  LightMode as LightIcon,
  DarkMode as DarkIcon,
} from '@mui/icons-material';
import { SxProps } from '@mui/material';

// 属性アイコンと色のマッピング
export const elementIcons = {
  fire: { icon: FireIcon, color: '#FF4444' },
  water: { icon: WaterIcon, color: '#4444FF' },
  earth: { icon: EarthIcon, color: '#BB8844' },
  wind: { icon: WindIcon, color: '#44BB44' },
  light: { icon: LightIcon, color: '#FFBB44' },
  dark: { icon: DarkIcon, color: '#AA44FF' },
};

// レア度の色マッピング
export const rarityColors = {
  SSR: '#FFD700',
  SR: '#C0C0C0',
  R: '#CD7F32',
};

// 覚醒タイプの色マッピング
export const awakeningColors = {
  '攻撃': '#FF4444',
  '防御': '#44AAFF',
  '特殊': '#FFAA44',
  '連撃': '#AA44FF',
  '回復': '#44FF44',
  '奥義': '#FFFF44',
  'アビD': '#FF44FF',
};

// チェックボックスのスタイル
export const checkboxStyle: SxProps = {
  position: 'absolute',
  top: 8,
  right: 8,
  bgcolor: 'rgba(255, 255, 255, 0.8)',
  borderRadius: 1,
  color: '#000',
  '&:hover': {
    bgcolor: 'rgba(255, 255, 255, 0.9)',
  },
  '& .MuiSvgIcon-root': {
    color: '#000',
  },
};

// 属性アイコンのスタイル
export const elementIconStyle = (element: string): SxProps => ({
  position: 'absolute',
  top: 8,
  left: 8,
  bgcolor: elementIcons[element as keyof typeof elementIcons]?.color || '#888888',
  color: 'white',
  '&:hover': {
    bgcolor: elementIcons[element as keyof typeof elementIcons]?.color || '#888888',
  },
});

// 備考ボタンのスタイル
export const noteButtonStyle = (hasNote: boolean): SxProps => ({
  position: 'absolute',
  bottom: 8,
  right: 8,
  bgcolor: hasNote ? 'primary.main' : 'rgba(255, 255, 255, 0.8)',
  color: hasNote ? 'white' : '#000',
  '&:hover': { 
    bgcolor: hasNote ? 'primary.dark' : 'rgba(255, 255, 255, 0.9)',
    opacity: 0.9
  },
  '& .MuiSvgIcon-root': {
    color: hasNote ? 'white' : '#000',
  },
});

// カードのスタイル
export const cardStyle: SxProps = {
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
};

// 備考テキストのスタイル
export const noteTextStyle: SxProps = {
  display: 'block',
  color: 'text.secondary',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

// レア度チップのスタイル
export const rarityChipStyle = (rarity: string): SxProps => ({
  bgcolor: rarityColors[rarity as keyof typeof rarityColors] || '#888888',
  color: rarity === 'SSR' ? '#000' : 'white',
  fontWeight: 'bold',
  minWidth: 40,
});
