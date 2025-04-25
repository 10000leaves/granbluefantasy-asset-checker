"use client";

import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  SettingsBrightness as SystemThemeIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useThemeContext } from "./ThemeProvider";
import { useAuth } from "@/hooks/useAuth";

export const Navigation = () => {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { mode, setMode } = useThemeContext();
  const { isAdmin } = useAuth();

  // テーマメニュー用の状態
  const [themeMenuAnchor, setThemeMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const themeMenuOpen = Boolean(themeMenuAnchor);

  const isActive = (path: string) => {
    return pathname === path;
  };

  // ナビゲーションアイテム（管理者の場合のみ管理画面へのリンクを表示）
  const navItems = [
    { name: "ホーム", path: "/" },
    { name: "キャラ", path: "/characters" },
    { name: "武器", path: "/weapons" },
    { name: "召喚石", path: "/summons" },
    ...(isAdmin ? [{ name: "管理", path: "/admin" }] : []),
  ];

  const toggleDrawer =
    (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }
      setDrawerOpen(open);
    };

  // テーマメニューを開く
  const handleThemeMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setThemeMenuAnchor(event.currentTarget);
  };

  // テーマメニューを閉じる
  const handleThemeMenuClose = () => {
    setThemeMenuAnchor(null);
  };

  // テーマを変更する
  const handleThemeChange = (newMode: "light" | "dark" | "system") => {
    setMode(newMode);
    handleThemeMenuClose();
  };

  // 現在のテーマに応じたアイコンを表示
  const ThemeIcon = () => {
    switch (mode) {
      case "light":
        return <LightModeIcon />;
      case "dark":
        return <DarkModeIcon />;
      case "system":
        return <SystemThemeIcon />;
    }
  };

  const drawer = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              href={item.path}
              selected={isActive(item.path)}
            >
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar position="static" color="primary">
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ flexWrap: "wrap" }}>
          <Typography
            variant="h6"
            component={Link}
            href="/"
            sx={{
              textDecoration: "none",
              color: "inherit",
              flexGrow: 1,
              fontWeight: "bold",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            グラブル所持チェッカー
          </Typography>

          {/* テーマ切替ボタン */}
          <Tooltip title="テーマ設定">
            <IconButton
              color="inherit"
              onClick={handleThemeMenuOpen}
              sx={{ mr: 1 }}
            >
              <ThemeIcon />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={themeMenuAnchor}
            open={themeMenuOpen}
            onClose={handleThemeMenuClose}
          >
            <MenuItem
              onClick={() => handleThemeChange("light")}
              selected={mode === "light"}
            >
              <LightModeIcon sx={{ mr: 1 }} />
              ライトモード
            </MenuItem>
            <MenuItem
              onClick={() => handleThemeChange("dark")}
              selected={mode === "dark"}
            >
              <DarkModeIcon sx={{ mr: 1 }} />
              ダークモード
            </MenuItem>
            <MenuItem
              onClick={() => handleThemeChange("system")}
              selected={mode === "system"}
            >
              <SystemThemeIcon sx={{ mr: 1 }} />
              システム設定に合わせる
            </MenuItem>
          </Menu>

          {isMobile ? (
            <>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="end"
                onClick={toggleDrawer(true)}
              >
                <MenuIcon />
              </IconButton>
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={toggleDrawer(false)}
              >
                {drawer}
              </Drawer>
            </>
          ) : (
            <Box sx={{ display: "flex", gap: 2 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  component={Link}
                  href={item.path}
                  sx={{
                    fontWeight: isActive(item.path) ? "bold" : "normal",
                  }}
                >
                  {item.name}
                </Button>
              ))}
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};
