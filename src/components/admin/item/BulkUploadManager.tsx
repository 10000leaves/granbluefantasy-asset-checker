"use client";

import React, { useState, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { useItems } from "@/hooks/useItems";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`bulk-upload-tabpanel-${index}`}
      aria-labelledby={`bulk-upload-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `bulk-upload-tab-${index}`,
    "aria-controls": `bulk-upload-tabpanel-${index}`,
  };
}

interface BulkUploadResult {
  success: boolean;
  results: any[];
  errors: any[];
  total: number;
  processed: number;
  failed: number;
}

export function BulkUploadManager() {
  const { refreshItems } = useItems();

  // タブの状態
  const [tabValue, setTabValue] = useState(0);

  // ファイル選択の状態
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [csvPreview, setCsvPreview] = useState<string>("");

  // アップロード状態
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  // ダイアログの状態
  const [openResultDialog, setOpenResultDialog] = useState(false);
  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [selectedError, setSelectedError] = useState<any>(null);

  // ファイル入力参照
  const csvInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // タブの切り替え
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // CSVファイルの選択
  const handleCsvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCsvFile(file);

      // CSVプレビューを表示
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvPreview(text.slice(0, 1000) + (text.length > 1000 ? "..." : ""));
      };
      reader.readAsText(file);
    }
  };

  // 画像ファイルの選択
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setImageFiles((prev) => [...prev, ...files]);
    }
  };

  // 画像ファイルの削除
  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ファイル選択をクリア
  const handleClearFiles = () => {
    setCsvFile(null);
    setImageFiles([]);
    setCsvPreview("");
    setUploadResult(null);
    setError(null);

    // ファイル入力をリセット
    if (csvInputRef.current) csvInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // アップロード処理
  const handleUpload = async () => {
    if (!csvFile) {
      setError("CSVファイルを選択してください");
      return;
    }

    if (imageFiles.length === 0) {
      setError("画像ファイルを選択してください");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("csv", csvFile);
      formData.append("category", getCategoryFromTabValue(tabValue));

      // 画像ファイルを追加
      imageFiles.forEach((file) => {
        formData.append(`images[${file.name}]`, file);
      });

      const response = await fetch("/api/bulk-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "アップロードに失敗しました");
      }

      const result = await response.json();
      setUploadResult(result);

      // アイテム一覧を更新
      refreshItems();

      // 結果ダイアログを表示
      setOpenResultDialog(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "アップロード中にエラーが発生しました",
      );
    } finally {
      setUploading(false);
    }
  };

  // タブ値からカテゴリを取得
  const getCategoryFromTabValue = (value: number): string => {
    switch (value) {
      case 0:
        return "character";
      case 1:
        return "weapon";
      case 2:
        return "summon";
      default:
        return "character";
    }
  };

  // エラーダイアログを開く
  const handleOpenErrorDialog = (error: any) => {
    setSelectedError(error);
    setOpenErrorDialog(true);
  };

  // エラーダイアログを閉じる
  const handleCloseErrorDialog = () => {
    setOpenErrorDialog(false);
    setSelectedError(null);
  };

  // 結果ダイアログを閉じる
  const handleCloseResultDialog = () => {
    setOpenResultDialog(false);
  };

  // CSVテンプレートをダウンロード
  const handleDownloadTemplate = () => {
    let csvContent = "";

    switch (tabValue) {
      case 0: // キャラ
        csvContent =
          "name,imageName,attribute,rarity,type,race,gender,weapons,releaseWeapon,obtainMethod,implementationDate\n" +
          "キャラ名,画像ファイル名.jpg,火/水/土/風/光/闇,SSR/SR/R,攻撃/防御/回復/バランス/特殊,ヒューマン/ドラフ/エルーン/ハーヴィン/その他/星晶獣,♂/♀/不明,剣|槍|斧|弓|杖|短剣|格闘|銃|刀|楽器,剣/槍/斧/弓/杖/短剣/格闘/銃/刀/楽器,恒常/リミテッド/季節限定/コラボ/その他,YYYY-MM-DD\n" +
          "グラン,gran.jpg,火,SSR,バランス,ヒューマン,♂,剣,剣,恒常,2014-03-10";
        break;
      case 1: // 武器
        csvContent =
          "name,imageName,attribute,weaponType,rarity,implementationDate\n" +
          "武器名,画像ファイル名.jpg,火/水/土/風/光/闇,剣/槍/斧/弓/杖/短剣/格闘/銃/刀/楽器,SSR/SR/R,YYYY-MM-DD\n" +
          "ミュルグレス,murgleis.jpg,水,剣,SSR,2016-07-09";
        break;
      case 2: // 召喚石
        csvContent =
          "name,imageName,attribute,rarity,implementationDate\n" +
          "召喚石名,画像ファイル名.jpg,火/水/土/風/光/闇,SSR/SR/R,YYYY-MM-DD\n" +
          "バハムート,bahamut.jpg,闇,SSR,2014-03-10";
        break;
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${getCategoryFromTabValue(tabValue)}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">まとめてアップロード</Typography>
        <Button
          variant="outlined"
          onClick={handleDownloadTemplate}
          startIcon={<DescriptionIcon />}
        >
          CSVテンプレートをダウンロード
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" paragraph>
        大量のデータは処理できないので、10件ずつくらいでアップロードしてください。
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="bulk upload category tabs"
          variant="fullWidth"
        >
          <Tab label="キャラ" {...a11yProps(0)} />
          <Tab label="武器" {...a11yProps(1)} />
          <Tab label="召喚石" {...a11yProps(2)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Typography variant="subtitle1" gutterBottom>
          キャラのまとめてアップロード
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          CSVファイルと画像ファイルをアップロードして、キャラをまとめて登録できます。
          CSVファイルには、キャラ名、画像ファイル名、属性などを記入してください。
        </Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="subtitle1" gutterBottom>
          武器のまとめてアップロード
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          CSVファイルと画像ファイルをアップロードして、武器をまとめて登録できます。
          CSVファイルには、武器名、画像ファイル名、属性、武器種などを記入してください。
        </Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="subtitle1" gutterBottom>
          召喚石のまとめてアップロード
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          CSVファイルと画像ファイルをアップロードして、召喚石をまとめて登録できます。
          CSVファイルには、召喚石名、画像ファイル名、属性などを記入してください。
        </Typography>
      </TabPanel>

      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 3,
            }}
          >
            {/* CSVファイルアップロード */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                CSVファイル
              </Typography>
              <input
                accept=".csv"
                style={{ display: "none" }}
                id="csv-upload"
                type="file"
                onChange={handleCsvSelect}
                ref={csvInputRef}
              />
              <label htmlFor="csv-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<DescriptionIcon />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  CSVファイルを選択
                </Button>
              </label>

              {csvFile && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    選択済み: {csvFile.name} ({Math.round(csvFile.size / 1024)}{" "}
                    KB)
                  </Typography>

                  {csvPreview && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        プレビュー:
                      </Typography>
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: "grey.100",
                          borderRadius: 1,
                          maxHeight: 200,
                          overflow: "auto",
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {csvPreview}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            {/* 画像ファイルアップロード */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                画像ファイル
              </Typography>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="image-upload"
                type="file"
                multiple
                onChange={handleImageSelect}
                ref={imageInputRef}
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<ImageIcon />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  画像ファイルを選択
                </Button>
              </label>

              {imageFiles.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    選択済み: {imageFiles.length}ファイル
                  </Typography>

                  <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                    <List dense>
                      {imageFiles.map((file, index) => (
                        <ListItem
                          key={index}
                          secondaryAction={
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleRemoveImage(index)}
                            >
                              削除
                            </Button>
                          }
                        >
                          <ListItemText
                            primary={file.name}
                            secondary={`${Math.round(file.size / 1024)} KB`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleClearFiles}
              disabled={uploading}
            >
              クリア
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={
                uploading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <CloudUploadIcon />
                )
              }
              onClick={handleUpload}
              disabled={!csvFile || imageFiles.length === 0 || uploading}
            >
              {uploading ? "アップロード中..." : "アップロード"}
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* 結果ダイアログ */}
      <Dialog
        open={openResultDialog}
        onClose={handleCloseResultDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>アップロード結果</DialogTitle>
        <DialogContent>
          {uploadResult && (
            <Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography variant="subtitle1">
                  合計: {uploadResult.total}件
                </Typography>
                <Box>
                  <Chip
                    icon={<CheckIcon />}
                    label={`成功: ${uploadResult.processed}件`}
                    color="success"
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    icon={<ErrorIcon />}
                    label={`失敗: ${uploadResult.failed}件`}
                    color="error"
                    variant="outlined"
                  />
                </Box>
              </Box>

              {uploadResult.errors.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    エラー
                  </Typography>
                  <List>
                    {uploadResult.errors.map((error, index) => (
                      <React.Fragment key={index}>
                        {index > 0 && <Divider />}
                        <ListItem
                          button
                          onClick={() => handleOpenErrorDialog(error)}
                        >
                          <ListItemText
                            primary={`${error.record.name || "不明"} (${error.record.imageName || "不明"})`}
                            secondary={error.error}
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              )}

              {uploadResult.results.length > 0 && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="success.main"
                    gutterBottom
                  >
                    成功
                  </Typography>
                  <List>
                    {uploadResult.results.slice(0, 5).map((item, index) => (
                      <React.Fragment key={index}>
                        {index > 0 && <Divider />}
                        <ListItem>
                          <ListItemText
                            primary={item.name}
                            secondary={`カテゴリ: ${item.category}`}
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                    {uploadResult.results.length > 5 && (
                      <ListItem>
                        <ListItemText
                          primary={`他 ${uploadResult.results.length - 5} 件`}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResultDialog}>閉じる</Button>
        </DialogActions>
      </Dialog>

      {/* エラー詳細ダイアログ */}
      <Dialog
        open={openErrorDialog}
        onClose={handleCloseErrorDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>エラー詳細</DialogTitle>
        <DialogContent>
          {selectedError && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                レコード情報:
              </Typography>
              <Box
                sx={{
                  p: 1,
                  bgcolor: "grey.100",
                  borderRadius: 1,
                  mb: 2,
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                }}
              >
                <pre>{JSON.stringify(selectedError.record, null, 2)}</pre>
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                エラー:
              </Typography>
              <Alert severity="error">{selectedError.error}</Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseErrorDialog}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
