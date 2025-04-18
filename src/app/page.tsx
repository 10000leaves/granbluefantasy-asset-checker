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
  CardMedia,
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
import { useSession } from '@/hooks/useSession';
import { useInputItems } from '@/hooks/useInputItems';

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
  const { createSession } = useSession();
  const { loading, error, inputGroups } = useInputItems();

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
          // デフォルト値を設定
          if (item.default_value !== null) {
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
  }, [inputGroups]);

  // タブの切り替え
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // セッションを作成
      const session = await createSession(formData, []);
      
      // キャラクター選択タブに切り替え
      setTabValue(1);
    } catch (error) {
      console.error('Error creating session:', error);
    }
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
            グランブルーファンタジー所持チェッカー
          </Typography>
          <Typography variant="body1">
            キャラクター、武器、召喚石の所持状況を記録して画像として共有できます。
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
            <Tab label="キャラクター" {...a11yProps(1)} />
            <Tab label="武器" {...a11yProps(2)} />
            <Tab label="召喚石" {...a11yProps(3)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
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
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              キャラクター選択
            </Typography>
            <Typography variant="body1" paragraph>
              所持キャラクターを選択してください。
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setTabValue(2)}
            >
              次へ進む
            </Button>
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
            <Button
              variant="contained"
              color="primary"
              onClick={() => setTabValue(3)}
            >
              次へ進む
            </Button>
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
            <Button
              variant="contained"
              color="primary"
              onClick={() => console.log('完了')}
            >
              完了
            </Button>
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
            <CardActionArea onClick={() => setTabValue(1)} sx={{ height: '100%' }}>
              <Box sx={{ position: 'relative', height: 160, width: 280 }}>
                <Image
                  src="/assets/characters-banner.jpg"
                  alt="キャラクター"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </Box>
              <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                  キャラクター
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  所持キャラクターを選択して管理します
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
            <CardActionArea onClick={() => setTabValue(2)} sx={{ height: '100%' }}>
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
                  所持武器を選択して管理します
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
            <CardActionArea onClick={() => setTabValue(3)} sx={{ height: '100%' }}>
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
                  所持召喚石を選択して管理します
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
