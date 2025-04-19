'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, PaletteMode } from '@mui/material';
import { useAtom } from 'jotai';
import { themeTypeAtom } from '@/atoms';

// テーマコンテキストの作成
type ThemeContextType = {
  mode: 'light' | 'dark' | 'system';
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  systemTheme: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// テーマコンテキストを使用するためのフック
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // テーマ設定をJotaiアトムから取得
  const [themeType, setThemeType] = useAtom(themeTypeAtom);
  
  // システムのテーマ設定を取得
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('dark');
  
  // システムのテーマ設定を監視
  useEffect(() => {
    // システムのテーマ設定を取得
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    
    // 初期値を設定
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    // メディアクエリの変更を監視
    mediaQuery.addEventListener('change', handleChange);
    
    // クリーンアップ
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  
  // 現在のテーマモードを計算
  const currentMode = useMemo<PaletteMode>(() => {
    if (themeType === 'system') {
      return systemTheme;
    }
    return themeType;
  }, [themeType, systemTheme]);
  
  // テーマを作成
  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode: currentMode,
        primary: {
          main: '#1976d2',
        },
        secondary: {
          main: '#dc004e',
        },
      },
      typography: {
        fontFamily: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
        ].join(','),
      },
    });
  }, [currentMode]);
  
  // テーマコンテキストの値
  const themeContextValue = useMemo(() => {
    return {
      mode: themeType,
      setMode: setThemeType,
      systemTheme,
    };
  }, [themeType, setThemeType, systemTheme]);
  
  return (
    <ThemeContext.Provider value={themeContextValue}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
}
