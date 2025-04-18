'use client';

import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Divider,
} from '@mui/material';
import { ItemManager } from '@/components/admin/ItemManager';
import { TagManager } from '@/components/admin/TagManager';
import { InputItemManager } from '@/components/admin/InputItemManager';

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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

export default function AdminPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
        <Box
          sx={{
            p: 3,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            管理者画面
          </Typography>
          <Typography variant="body1">
            アイテム、タグ、ユーザー入力項目を管理します。
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="admin tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="アイテム管理" {...a11yProps(0)} />
            <Tab label="タグ管理" {...a11yProps(1)} />
            <Tab label="入力項目管理" {...a11yProps(2)} />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <ItemManager />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <TagManager />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <InputItemManager />
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
}
