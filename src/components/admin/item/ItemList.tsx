'use client';

import React from 'react';
import Image from 'next/image';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Paper,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Label as LabelIcon,
} from '@mui/icons-material';
import { TagCategory, TagValue } from '@/hooks/useTags';

interface ItemListProps {
  items: any[];
  tagCategories: TagCategory[];
  tagValues: TagValue[];
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onTagEdit: (item: any) => void;
  emptyMessage?: string;
}

export function ItemList({
  items,
  tagCategories,
  tagValues,
  onEdit,
  onDelete,
  onTagEdit,
  emptyMessage = 'アイテムがありません。「アイテムを追加」ボタンをクリックして作成してください。'
}: ItemListProps) {
  // タグ名を取得
  const getTagName = (categoryId: string, valueId: string) => {
    const category = tagCategories.find(cat => cat.id === categoryId);
    const value = tagValues.find(val => val.id === valueId);
    
    if (category && value) {
      return `${category.name}: ${value.value}`;
    }
    
    return '';
  };

  // アイテムのタグを表示
  const renderItemTags = (item: any) => {
    if (!item.tags || item.tags.length === 0) return null;
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
        {item.tags.map((tag: any, index: number) => (
          <Chip
            key={index}
            label={getTagName(tag.categoryId, tag.valueId)}
            size="small"
            color="primary"
            variant="outlined"
          />
        ))}
      </Box>
    );
  };

  if (items.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={2}>
      {items.map((item) => (
        <Grid item xs={6} sm={4} md={3} lg={2} key={item.id}>
          <Card sx={{ 
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s',
            margin: '0 auto',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 3,
            }
          }}>
            <Box sx={{ position: 'relative', height: 160, width: '100%', margin: '0 auto' }}>
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  unoptimized
                  onError={(e) => {
                    console.error(`Image error: ${item.name}, URL: ${item.imageUrl}`);
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const errorDiv = document.createElement('div');
                      errorDiv.style.width = '100%';
                      errorDiv.style.height = '100%';
                      errorDiv.style.display = 'flex';
                      errorDiv.style.alignItems = 'center';
                      errorDiv.style.justifyContent = 'center';
                      errorDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                      const errorIcon = document.createElement('span');
                      errorIcon.textContent = '画像エラー';
                      errorIcon.style.color = '#999';
                      errorDiv.appendChild(errorIcon);
                      parent.appendChild(errorDiv);
                    }
                  }}
                />
              ) : (
                <Box sx={{ 
                  height: '100%', 
                  width: '100%', 
                  bgcolor: 'grey.200',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography variant="body2" color="text.secondary">画像なし</Typography>
                </Box>
              )}
            </Box>
            <CardContent sx={{ flexGrow: 1, pb: 1 }}>
              <Typography variant="subtitle2" noWrap>{item.name}</Typography>
              {item.implementationDate && (
                <Typography variant="caption" color="text.secondary" display="block">
                  実装: {new Date(item.implementationDate).toLocaleDateString('ja-JP')}
                </Typography>
              )}
              {renderItemTags(item)}
            </CardContent>
            <CardActions sx={{ p: 1, pt: 0 }}>
              <IconButton size="small" onClick={() => onTagEdit(item)}>
                <LabelIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => onEdit(item)}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => onDelete(item.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
