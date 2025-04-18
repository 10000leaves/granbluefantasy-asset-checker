'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useInputItems } from '@/hooks/useInputItems';

export function InputItemManager() {
  const {
    loading,
    error,
    inputGroups,
    createGroup,
    createItem,
    updateItem,
    deleteItem,
    refreshInputGroups,
  } = useInputItems();

  // ダイアログの状態
  const [openGroupDialog, setOpenGroupDialog] = useState(false);
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // フォームの状態
  const [groupName, setGroupName] = useState('');
  const [itemForm, setItemForm] = useState({
    id: '',
    name: '',
    type: 'text',
    required: false,
    defaultValue: '',
    groupId: '',
  });

  // 通知の状態
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // グループダイアログを開く
  const handleOpenGroupDialog = () => {
    setGroupName('');
    setOpenGroupDialog(true);
  };

  // グループダイアログを閉じる
  const handleCloseGroupDialog = () => {
    setOpenGroupDialog(false);
  };

  // 項目ダイアログを開く（新規作成）
  const handleOpenItemDialog = (groupId: string) => {
    setIsEditMode(false);
    setSelectedGroupId(groupId);
    setItemForm({
      id: '',
      name: '',
      type: 'text',
      required: false,
      defaultValue: '',
      groupId,
    });
    setOpenItemDialog(true);
  };

  // 項目ダイアログを開く（編集）
  const handleOpenEditItemDialog = (item: any, groupId: string) => {
    setIsEditMode(true);
    setSelectedGroupId(groupId);
    setItemForm({
      id: item.id,
      name: item.name,
      type: item.type,
      required: item.required,
      defaultValue: item.default_value || '',
      groupId,
    });
    setOpenItemDialog(true);
  };

  // 項目ダイアログを閉じる
  const handleCloseItemDialog = () => {
    setOpenItemDialog(false);
    setSelectedItem(null);
  };

  // グループを作成
  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;

    try {
      await createGroup(groupName);
      handleCloseGroupDialog();
      setSnackbar({
        open: true,
        message: 'グループを作成しました',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: '作成に失敗しました',
        severity: 'error',
      });
    }
  };

  // 項目フォームの変更を処理
  const handleItemFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setItemForm({
      ...itemForm,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // 項目タイプの変更を処理
  const handleTypeChange = (e: any) => {
    setItemForm({
      ...itemForm,
      type: e.target.value,
    });
  };

  // 項目を作成または更新
  const handleSaveItem = async () => {
    if (!itemForm.name.trim()) return;

    try {
      if (isEditMode) {
        await updateItem({
          id: itemForm.id,
          name: itemForm.name,
          type: itemForm.type,
          required: itemForm.required,
          defaultValue: itemForm.defaultValue || null,
        });
        setSnackbar({
          open: true,
          message: '項目を更新しました',
          severity: 'success',
        });
      } else {
        await createItem({
          name: itemForm.name,
          type: itemForm.type,
          required: itemForm.required,
          defaultValue: itemForm.defaultValue || null,
          groupId: itemForm.groupId,
        });
        setSnackbar({
          open: true,
          message: '項目を作成しました',
          severity: 'success',
        });
      }
      handleCloseItemDialog();
    } catch (error) {
      setSnackbar({
        open: true,
        message: '保存に失敗しました',
        severity: 'error',
      });
    }
  };

  // 項目を削除
  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('この項目を削除してもよろしいですか？')) return;

    try {
      await deleteItem(id);
      setSnackbar({
        open: true,
        message: '項目を削除しました',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: '削除に失敗しました',
        severity: 'error',
      });
    }
  };

  // スナックバーを閉じる
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // 項目タイプのラベルを取得
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'text':
        return 'テキスト';
      case 'number':
        return '数値';
      case 'checkbox':
        return 'チェックボックス';
      case 'radio':
        return 'ラジオボタン';
      case 'select':
        return 'セレクトボックス';
      case 'date':
        return '日付';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">ユーザー入力項目管理</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenGroupDialog}
        >
          グループを追加
        </Button>
      </Box>

      {inputGroups.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            入力項目グループがありません。「グループを追加」ボタンをクリックして作成してください。
          </Typography>
        </Paper>
      ) : (
        inputGroups.map((group) => (
          <Accordion key={group.group_id} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                  {group.group_name}
                </Typography>
                <Chip
                  label={`${group.items?.length || 0}項目`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mr: 2 }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenItemDialog(group.group_id)}
                >
                  項目を追加
                </Button>
              </Box>

              {group.items?.length === 0 ? (
                <Typography color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                  項目がありません。「項目を追加」ボタンをクリックして作成してください。
                </Typography>
              ) : (
                <List>
                  {group.items?.map((item, index) => (
                    <React.Fragment key={item.id}>
                      {index > 0 && <Divider />}
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body1">{item.name}</Typography>
                              {item.required && (
                                <Chip
                                  label="必須"
                                  size="small"
                                  color="error"
                                  sx={{ ml: 1, height: 20 }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                              <Typography variant="body2" color="textSecondary">
                                タイプ: {getTypeLabel(item.type)}
                              </Typography>
                              {item.default_value && (
                                <Typography variant="body2" color="textSecondary">
                                  デフォルト値: {item.default_value}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            onClick={() => handleOpenEditItemDialog(item, group.group_id)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {/* グループ作成ダイアログ */}
      <Dialog open={openGroupDialog} onClose={handleCloseGroupDialog}>
        <DialogTitle>グループを追加</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="グループ名"
            fullWidth
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGroupDialog}>キャンセル</Button>
          <Button onClick={handleCreateGroup} color="primary" disabled={!groupName.trim()}>
            作成
          </Button>
        </DialogActions>
      </Dialog>

      {/* 項目作成/編集ダイアログ */}
      <Dialog open={openItemDialog} onClose={handleCloseItemDialog}>
        <DialogTitle>{isEditMode ? '項目を編集' : '項目を追加'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="項目名"
            fullWidth
            value={itemForm.name}
            onChange={handleItemFormChange}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>タイプ</InputLabel>
            <Select value={itemForm.type} onChange={handleTypeChange} label="タイプ">
              <MenuItem value="text">テキスト</MenuItem>
              <MenuItem value="number">数値</MenuItem>
              <MenuItem value="checkbox">チェックボックス</MenuItem>
              <MenuItem value="radio">ラジオボタン</MenuItem>
              <MenuItem value="select">セレクトボックス</MenuItem>
              <MenuItem value="date">日付</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={itemForm.required}
                onChange={handleItemFormChange}
                name="required"
              />
            }
            label="必須項目"
          />

          {itemForm.type !== 'checkbox' && (
            <TextField
              margin="dense"
              name="defaultValue"
              label="デフォルト値"
              fullWidth
              value={itemForm.defaultValue}
              onChange={handleItemFormChange}
              type={itemForm.type === 'number' ? 'number' : 'text'}
              inputProps={
                itemForm.type === 'number' 
                  ? { step: 'any' } // 小数点の入力を許可
                  : {}
              }
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseItemDialog}>キャンセル</Button>
          <Button onClick={handleSaveItem} color="primary" disabled={!itemForm.name.trim()}>
            {isEditMode ? '更新' : '作成'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
