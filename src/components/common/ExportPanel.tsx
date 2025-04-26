"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Input,
} from "@mui/material";
import {
  Share as ShareIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  Upload as UploadIcon,
  FileDownload as FileDownloadIcon,
} from "@mui/icons-material";
import { useAtom } from "jotai";
import {
  selectedCharactersAtom,
  selectedWeaponsAtom,
  selectedSummonsAtom,
  inputValuesAtom,
  selectedCharacterItemsAtom,
  selectedWeaponItemsAtom,
  selectedSummonItemsAtom,
  weaponCountsAtom,
  weaponAwakeningsAtom,
  characterNotesAtom,
  weaponNotesAtom,
  summonNotesAtom,
} from "@/atoms";
import { useInputItems } from "@/hooks/useInputItems";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import html2canvas from "html2canvas";
import { ExportDialogContent } from "./ExportDialogContent";
import { generatePDF, generateCSV, importCSV } from "./ExportUtils";

interface ExportPanelProps {
  selectedCount: number;
}

export function ExportPanel({ selectedCount }: ExportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  // jotaiを使用して状態を管理
  const [selectedCharacters, setSelectedCharacters] = useAtom(
    selectedCharactersAtom,
  );
  const [selectedWeapons, setSelectedWeapons] = useAtom(selectedWeaponsAtom);
  const [selectedSummons, setSelectedSummons] = useAtom(selectedSummonsAtom);
  const [inputValues, setInputValues] = useAtom(inputValuesAtom);
  const [selectedCharacterItems] = useAtom(selectedCharacterItemsAtom);
  const [selectedWeaponItems] = useAtom(selectedWeaponItemsAtom);
  const [selectedSummonItems] = useAtom(selectedSummonItemsAtom);
  const [weaponCounts, setWeaponCounts] = useAtom(weaponCountsAtom);
  const [weaponAwakenings, setWeaponAwakenings] = useAtom(weaponAwakeningsAtom);
  // 備考用のatomを追加
  const [characterNotes, setCharacterNotes] = useAtom(characterNotesAtom);
  const [weaponNotes, setWeaponNotes] = useAtom(weaponNotesAtom);
  const [summonNotes, setSummonNotes] = useAtom(summonNotesAtom);

  // ローカルストレージとの連携
  useLocalStorage();

  const { inputGroups } = useInputItems();

  // 選択されたアイテムの状態
  const [selectedItemsState, setSelectedItemsState] = useState<{
    characters: any[];
    weapons: any[];
    summons: any[];
  }>({ characters: [], weapons: [], summons: [] });

  const [isExporting, setIsExporting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [exportedImageUrl, setExportedImageUrl] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success",
  );
  const [exportMenuAnchorEl, setExportMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [exportType, setExportType] = useState<"image" | "pdf" | "csv">(
    "image",
  );

  // 選択されたアイテムを更新
  useEffect(() => {
    // キャラクターに備考情報を追加
    const charactersWithNotes = selectedCharacterItems.map((character) => ({
      ...character,
      note: characterNotes[character.id] || "",
    }));

    // 武器に所持数と覚醒情報、備考情報を追加
    const weaponsWithCountsAndAwakenings = selectedWeaponItems.map((weapon) => ({
      ...weapon,
      count: weaponCounts[weapon.id] || 0,
      awakenings: weaponAwakenings[weapon.id] || {},
      note: weaponNotes[weapon.id] || "",
    }));

    // 召喚石に備考情報を追加
    const summonsWithNotes = selectedSummonItems.map((summon) => ({
      ...summon,
      note: summonNotes[summon.id] || "",
    }));

    setSelectedItemsState({
      characters: charactersWithNotes,
      weapons: weaponsWithCountsAndAwakenings,
      summons: summonsWithNotes,
    });
  }, [
    selectedCharacterItems,
    selectedWeaponItems,
    selectedSummonItems,
    weaponCounts,
    weaponAwakenings,
    characterNotes,
    weaponNotes,
    summonNotes,
  ]);

  // 現在のページに基づいて表示するアイテムを決定
  const getCurrentPageItems = () => {
    // エクスポート時には常にすべての情報を含める
    return selectedItemsState;
  };

  // エクスポートメニューを開く
  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchorEl(event.currentTarget);
  };

  // エクスポートメニューを閉じる
  const handleExportMenuClose = () => {
    setExportMenuAnchorEl(null);
  };

  // エクスポートタイプを選択
  const handleExportTypeSelect = (type: "image" | "pdf" | "csv") => {
    setExportType(type);
    setExportMenuAnchorEl(null);
    setIsDialogOpen(true);
  };

  // エクスポートダイアログが開いたときに実行
  useEffect(() => {
    if (isDialogOpen) {
      // ダイアログが開いたら、少し遅延を入れてから画像を生成
      if (exportType === "image") {
        // 画像出力の場合は既存の画像URLをクリア
        setExportedImageUrl(null);

        const timer = setTimeout(() => {
          captureContent();
        }, 500);
        return () => clearTimeout(timer);
      } else {
        // PDF/CSV出力の場合も既存の画像URLをクリア
        setExportedImageUrl(null);
      }
    }
  }, [isDialogOpen, exportType]);

  // コンテンツをキャプチャする関数
  const captureContent = async () => {
    try {
      setIsExporting(true);

      // ダイアログ内のコンテンツを画像化
      const element = document.getElementById("export-content");
      if (!element) {
        console.error(
          "Export content element not found. DOM:",
          document.body.innerHTML,
        );
        throw new Error("Export content not found");
      }

      const canvas = await html2canvas(element, {
        scale: 2, // 高解像度
        useCORS: true, // 外部画像の読み込みを許可
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // 画像をDataURLに変換
      const dataUrl = canvas.toDataURL("image/png");
      setExportedImageUrl(dataUrl);

      setSnackbarMessage("画像の生成に成功しました");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error exporting image:", error);
      setSnackbarMessage("画像の生成に失敗しました");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsExporting(false);
    }
  };

  // 画像出力処理
  const handleImageExport = () => {
    captureContent();
  };

  // PDF出力処理
  const handlePdfExport = async () => {
    try {
      setIsExporting(true);

      // 既存の画像URLをクリア
      setExportedImageUrl(null);

      // 現在のページのアイテムを取得
      const pageItems = getCurrentPageItems();

      // 画像キャプチャを使用してPDFを生成
      const element = document.getElementById("export-content");
      if (!element) {
        throw new Error("Export content not found");
      }

      // セッションデータの代わりにinputValuesを使用
      const sessionDataObj = { inputValues };

      await generatePDF(element, inputGroups, sessionDataObj, pageItems);

      setSnackbarMessage("PDFの生成に成功しました");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      setSnackbarMessage("PDFの生成に失敗しました");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsExporting(false);
    }
  };

  // CSV出力処理
  const handleCsvExport = () => {
    try {
      setIsExporting(true);

      // 既存の画像URLをクリア
      setExportedImageUrl(null);

      const pageItems = getCurrentPageItems();

      // セッションデータの代わりにinputValuesを使用
      const sessionDataObj = { inputValues };

      generateCSV(pageItems, inputGroups, sessionDataObj);

      setSnackbarMessage("CSVの生成に成功しました");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      setSnackbarMessage("CSVの生成に失敗しました");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsExporting(false);
    }
  };

  // CSVインポート処理
  const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;

          // CSVインポート処理を実行
          const result = importCSV(
            csv,
            setSelectedCharacters,
            setSelectedWeapons,
            setSelectedSummons,
            setInputValues,
            setWeaponCounts,
            setWeaponAwakenings,
            selectedCharacters,
            selectedWeapons,
            selectedSummons,
            inputValues,
            weaponCounts,
            weaponAwakenings,
            setCharacterNotes,
            setWeaponNotes,
            setSummonNotes,
            characterNotes,
            weaponNotes,
            summonNotes,
          );

          // 結果に基づいてスナックバーを表示
          setSnackbarMessage(result.message);
          setSnackbarSeverity(result.success ? "success" : "error");
          setSnackbarOpen(true);
        } catch (error) {
          console.error("Error parsing CSV:", error);
          setSnackbarMessage("CSVの解析に失敗しました");
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Error importing CSV:", error);
      setSnackbarMessage("CSVのインポートに失敗しました");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }

    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // エクスポート処理
  const handleExport = () => {
    switch (exportType) {
      case "image":
        handleImageExport();
        break;
      case "pdf":
        handlePdfExport();
        break;
      case "csv":
        handleCsvExport();
        break;
    }
  };

  // 画像のダウンロード
  const handleDownload = () => {
    if (!exportedImageUrl) return;

    const link = document.createElement("a");
    link.download = `granblue-asset-checker-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = exportedImageUrl;
    link.click();
  };

  // 共有処理
  const handleShare = async () => {
    try {
      if (navigator.share && exportedImageUrl) {
        // Web Share APIが利用可能な場合
        const blob = await fetch(exportedImageUrl).then((r) => r.blob());
        const file = new File([blob], "granblue-asset-checker.png", {
          type: "image/png",
        });

        await navigator.share({
          title: "グラブル所持チェッカー",
          text: "私の所持キャラ/武器/召喚石リストです",
          files: [file],
        });
      } else {
        // URLのコピーの代わりに画像をダウンロード
        handleDownload();
        setSnackbarMessage("画像をダウンロードしました");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error sharing:", error);
      setSnackbarMessage("共有に失敗しました");
      setSnackbarSeverity("error");
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

  return (
    <>
      {/* 固定表示のエクスポートパネル */}
      <Paper
        elevation={3}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          p: { xs: 1.5, sm: 2 },
          borderRadius: { xs: "16px 16px 0 0", sm: 0 },
          zIndex: 10,
          backgroundColor: "background.paper",
          boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: "medium" }}>
            {selectedCount > 0
              ? `${selectedCount}個のアイテムを選択中`
              : "アイテムを選択してください"}
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: { xs: 0.5, sm: 1 },
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              mt: { xs: 1, sm: 0 },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: { xs: 0.5, sm: 1 },
                width: "100%",
                justifyContent: "space-between",
              }}
            >
              <Button
                variant="outlined"
                color="primary"
                startIcon={isMobile ? null : <UploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                size={isMobile ? "small" : "medium"}
                fullWidth={isMobile}
                sx={{ minWidth: isMobile ? 0 : undefined }}
              >
                {isMobile ? <UploadIcon fontSize="small" /> : "CSVインポート"}
              </Button>
              <Input
                type="file"
                inputRef={fileInputRef}
                onChange={handleCsvImport}
                sx={{ display: "none" }}
                inputProps={{ accept: ".csv" }}
              />
              <Button
                variant="outlined"
                color="primary"
                startIcon={isMobile ? null : <FileDownloadIcon />}
                onClick={handleExportMenuOpen}
                disabled={selectedCount === 0}
                size={isMobile ? "small" : "medium"}
                fullWidth={isMobile}
                sx={{ minWidth: isMobile ? 0 : undefined }}
              >
                {isMobile ? (
                  <FileDownloadIcon fontSize="small" />
                ) : (
                  "エクスポート"
                )}
              </Button>
              <Menu
                anchorEl={exportMenuAnchorEl}
                open={Boolean(exportMenuAnchorEl)}
                onClose={handleExportMenuClose}
              >
                <MenuItem onClick={() => handleExportTypeSelect("image")}>
                  <ListItemIcon>
                    <ImageIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="画像出力" />
                </MenuItem>
                <MenuItem onClick={() => handleExportTypeSelect("pdf")}>
                  <ListItemIcon>
                    <PdfIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="PDF出力" />
                </MenuItem>
                <MenuItem onClick={() => handleExportTypeSelect("csv")}>
                  <ListItemIcon>
                    <CsvIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="CSV出力" />
                </MenuItem>
              </Menu>
              <Button
                variant="contained"
                color="primary"
                startIcon={isMobile ? null : <ShareIcon />}
                onClick={handleShare}
                disabled={selectedCount === 0}
                size={isMobile ? "small" : "medium"}
                fullWidth={isMobile}
                sx={{ minWidth: isMobile ? 0 : undefined }}
              >
                {isMobile ? <ShareIcon fontSize="small" /> : "共有"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* エクスポートダイアログ */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          <Typography variant="h6">
            {exportType === "image"
              ? "画像出力"
              : exportType === "pdf"
                ? "PDF出力"
                : "CSV出力"}
          </Typography>
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
          <ExportDialogContent
            exportType={exportType}
            isExporting={isExporting}
            exportedImageUrl={exportedImageUrl}
            handleDownload={handleDownload}
            handleExport={handleExport}
            selectedItems={selectedItemsState}
            sessionData={{ inputValues }}
          />
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Button onClick={handleCloseDialog} color="inherit">
            閉じる
          </Button>
          {exportType === "image" && exportedImageUrl ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<FileDownloadIcon />}
              onClick={handleDownload}
            >
              ダウンロード
            </Button>
          ) : (
            <Button variant="contained" color="primary" onClick={handleExport}>
              {exportType === "pdf"
                ? "PDFを生成"
                : exportType === "csv"
                  ? "CSVを生成"
                  : "画像を生成"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* スナックバー通知 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ mb: 7 }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
