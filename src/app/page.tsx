'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Grid,
  InputAdornment,
  Card,
  CardContent,
  CardActionArea,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Star as StarIcon,
  Diamond as DiamondIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { 
  inputValuesAtom,
  selectedCharactersAtom,
  selectedWeaponsAtom,
  selectedSummonsAtom
} from '@/atoms';
import { useInputItems } from '@/hooks/useInputItems';
import { useLocalStorage } from '@/hooks/useLocalStorage';

import { CharacterList } from './characters/CharacterList';
import { WeaponList } from './weapons/WeaponList';
import { SummonList } from './summons/SummonList';
import { ExportPanel } from '@/components/common/ExportPanel';

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
      id={`home-tabpanel-${index}`}
      aria-labelledby={`home-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `home-tab-${index}`,
    'aria-controls': `home-tabpanel-${index}`,
  };
}

export default function Home() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [inputValues, setInputValues] = useAtom(inputValuesAtom);
  const [selectedCharacters] = useAtom(selectedCharactersAtom);
  const [selectedWeapons] = useAtom(selectedWeaponsAtom);
  const [selectedSummons] = useAtom(selectedSummonsAtom);
  const { loading, error, inputGroups } = useInputItems();
  
  // ローカルストレージとの連携
  useLocalStorage();

  // タブの状態
  const [tabValue, setTabValue] = useState(0);

  // フォーム状態
  const [formData, setFormData] = useState<Record<string, any>>({});

  // 初期値の設定
  useEffect(() => {
    if (inputGroups.length > 0) {
      const initialData: Record<string, any> = {};
      
      inputGroups.forEach(group => {
        group.items.forEach(item => {
          // ローカルストレージから読み込んだ値があればそれを使用
          if (inputValues[item.id] !== undefined) {
            initialData[item.id] = inputValues[item.id];
          }
          // ローカルストレージに値がない場合はデフォルト値を設定
          else if (item.default_value !== null) {
            initialData[item.id] = item.type === 'checkbox' 
              ? item.default_value === 'true'
              : item.default_value;
          } else {
            // デフォルト値がない場合は型に応じて初期値を設定
            switch (item.type) {
              case 'checkbox':
                initialData[item.id] = false;
                break;
              case 'number':
                initialData[item.id] = 0;
                break;
              default:
                initialData[item.id] = '';
            }
          }
        });
      });
      
      setFormData(initialData);
    }
  }, [inputGroups, inputValues]);

  // タブの切り替え
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    // タブ0（ユーザー情報）から他のタブに移動する場合、入力値を保存
    if (tabValue === 0 && newValue !== 0) {
      setInputValues(formData);
    }
    setTabValue(newValue);
  };

  // フォーム入力処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // 数値入力処理
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // 空文字列の場合は0、それ以外は浮動小数点数として解析
    const numValue = value === '' ? 0 : parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      [name]: numValue,
    }));
  };

  // フォーム送信処理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 入力値を保存
    setInputValues(formData);
    
    // キャラ選択タブに切り替え
    setTabValue(1);
  };

  // 入力項目のレンダリング
  const renderInputItem = (item: any) => {
    switch (item.type) {
      case 'text':
        return (
          <TextField
            key={item.id}
            fullWidth
            label={item.name}
            name={item.id}
            value={formData[item.id] || ''}
            onChange={handleInputChange}
            required={item.required}
            margin="normal"
            variant="outlined"
            size="small"
          />
        );
      case 'number':
        return (
          <TextField
            key={item.id}
            fullWidth
            label={item.name}
            name={item.id}
            type="number"
            value={formData[item.id] === 0 ? '' : formData[item.id]}
            onChange={handleNumberChange}
            required={item.required}
            margin="normal"
            variant="outlined"
            size="small"
            InputProps={{
              endAdornment: item.name === 'キャラ与ダメ' ? (
                <InputAdornment position="end">%</InputAdornment>
              ) : undefined,
            }}
          />
        );
      case 'checkbox':
        return (
          <FormControlLabel
            key={item.id}
            control={
              <Checkbox
                name={item.id}
                checked={!!formData[item.id]}
                onChange={handleInputChange}
              />
            }
            label={item.name}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 2, 
          overflow: 'hidden',
          mb: 4
        }}
      >
        <Box 
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'primary.contrastText', 
            p: 3,
            backgroundImage: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            グラブル所持チェッカー
          </Typography>
          <Typography variant="body1">
            キャラ、武器、召喚石の所持状況を共有できます。
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="home tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="ユーザー情報" {...a11yProps(0)} />
            <Tab label="キャラ" {...a11yProps(1)} />
            <Tab label="武器" {...a11yProps(2)} />
            <Tab label="召喚石" {...a11yProps(3)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, pb: 8 }}>
            {inputGroups.map((group) => (
              <Accordion key={group.group_id} defaultExpanded>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`${group.group_name}-content`}
                  id={`${group.group_name}-header`}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {group.group_name === '基本情報' && <PersonIcon sx={{ mr: 1 }} />}
                    {group.group_name === '希望' && <SettingsIcon sx={{ mr: 1 }} />}
                    {group.group_name === 'マナベリ' && <StarIcon sx={{ mr: 1 }} />}
                    {group.group_name === '大事なもの' && <DiamondIcon sx={{ mr: 1 }} />}
                    <Typography variant="h6">{group.group_name}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {group.items.some(item => item.type === 'checkbox') ? (
                    <Grid container spacing={2}>
                      {group.items.map((item) => (
                        <Grid item xs={12} sm={item.type === 'checkbox' ? 6 : 12} key={item.id}>
                          {renderInputItem(item)}
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    group.items.map(renderInputItem)
                  )}
                </AccordionDetails>
              </Accordion>
            ))}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    boxShadow: '0 6px 10px rgba(0, 0, 0, 0.15)',
                  }
                }}
              >
                次へ進む
              </Button>
            </Box>
            
            {/* ユーザー情報タブでもエクスポートパネルを表示 */}
            <ExportPanel selectedCount={selectedCharacters.length + selectedWeapons.length + selectedSummons.length} />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              キャラ選択
            </Typography>
            <Typography variant="body1" paragraph>
              所持キャラを選択してください。
            </Typography>
            {/* キャラリスト */}
            <CharacterList />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setTabValue(0)}
              >
                戻る
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setTabValue(2)}
              >
                次へ進む
              </Button>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              武器選択
            </Typography>
            <Typography variant="body1" paragraph>
              所持武器を選択してください。
            </Typography>
            {/* 武器リスト */}
            <WeaponList />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setTabValue(1)}
              >
                戻る
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setTabValue(3)}
              >
                次へ進む
              </Button>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              召喚石選択
            </Typography>
            <Typography variant="body1" paragraph>
              所持召喚石を選択してください。
            </Typography>
            {/* 召喚石リスト */}
            <SummonList />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setTabValue(2)}
              >
                戻る
              </Button>
            </Box>
          </Box>
        </TabPanel>
      </Paper>

      {/* カテゴリ選択カード */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 6, mb: 3 }}>
        または直接カテゴリを選択
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card 
            sx={{ 
              width: 280,
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              margin: '0 auto',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            <CardActionArea onClick={() => {
              // 入力値を保存してからタブを切り替え
              setInputValues(formData);
              setTabValue(1);
            }} sx={{ height: '100%' }}>
              <Box sx={{ position: 'relative', height: 160, width: 280 }}>
                <Image
                  src="/assets/characters-banner.jpg"
                  alt="キャラ"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </Box>
              <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                  キャラ
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  所持キャラを選択
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card 
            sx={{ 
              width: 280,
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              margin: '0 auto',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            <CardActionArea onClick={() => {
              // 入力値を保存してからタブを切り替え
              setInputValues(formData);
              setTabValue(2);
            }} sx={{ height: '100%' }}>
              <Box sx={{ position: 'relative', height: 160, width: 280 }}>
                <Image
                  src="/assets/weapons-banner.jpg"
                  alt="武器"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </Box>
              <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                  武器
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  所持武器を選択
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card 
            sx={{ 
              width: 280,
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              margin: '0 auto',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            <CardActionArea onClick={() => {
              // 入力値を保存してからタブを切り替え
              setInputValues(formData);
              setTabValue(3);
            }} sx={{ height: '100%' }}>
              <Box sx={{ position: 'relative', height: 160, width: 280 }}>
                <Image
                  src="/assets/summons-banner.jpg"
                  alt="召喚石"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </Box>
              <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                  召喚石
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  所持召喚石を選択
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
