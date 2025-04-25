import React, { useState } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Checkbox,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
} from "@mui/material";
import { useAtom } from "jotai";
import { characterNotesAtom } from "@/atoms";
import {
  BrokenImage as BrokenImageIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { NoteDialog } from "../common/NoteDialog";

import { translateElement } from "../../lib/utils/helpers";
import {
  elementIcons,
  checkboxStyle,
  elementIconStyle,
  noteButtonStyle,
  cardStyle,
  noteTextStyle,
  rarityChipStyle,
} from "../../lib/utils/cardUtils";

interface CharacterCardProps {
  id: string;
  name: string;
  imageUrl: string;
  element: "fire" | "water" | "earth" | "wind" | "light" | "dark";
  rarity: "SSR" | "SR" | "R";
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
}

export const CharacterCard = ({
  id,
  name,
  imageUrl,
  element,
  rarity,
  selected,
  onSelect,
}: CharacterCardProps) => {
  const ElementIcon = elementIcons[element].icon;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [characterNotes, setCharacterNotes] = useAtom(characterNotesAtom);
  const [showNoteDialog, setShowNoteDialog] = useState(false);

  // 備考を取得
  const note = characterNotes[id] || "";

  // 備考ダイアログを開く
  const openNoteDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNoteDialog(true);
  };

  // 備考を保存
  const handleSaveNote = (newNote: string) => {
    setCharacterNotes((prev) => ({
      ...prev,
      [id]: newNote,
    }));
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    console.error(`Image error: ${name}, URL: ${imageUrl}`);
    setLoading(false);
    setError(true);
  };

  return (
    <Card sx={cardStyle} onClick={() => onSelect(id, !selected)}>
      <Box sx={{ position: "relative", height: 160, width: "100%" }}>
        {loading && (
          <Skeleton
            variant="rectangular"
            width="100%"
            height={160}
            animation="wave"
            sx={{ position: "absolute", top: 0, left: 0 }}
          />
        )}

        {error ? (
          <Box
            sx={{
              height: 160,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(0, 0, 0, 0.1)",
            }}
          >
            <BrokenImageIcon sx={{ fontSize: 60, color: "text.disabled" }} />
          </Box>
        ) : (
          <Box sx={{ position: "relative", height: 160, width: "100%" }}>
            <Image
              src={imageUrl}
              alt={name}
              fill
              style={{
                objectFit: "cover",
                filter: selected ? "brightness(0.8)" : "none",
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              unoptimized
            />
          </Box>
        )}

        <Checkbox
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(id, e.target.checked);
          }}
          onClick={(e) => e.stopPropagation()}
          sx={checkboxStyle}
        />
        <Tooltip title={`${translateElement(element)}属性`}>
          <IconButton size="small" sx={elementIconStyle(element)}>
            <ElementIcon />
          </IconButton>
        </Tooltip>

        {/* 備考編集アイコンを画像の右下に配置 */}
        <Tooltip title="備考を編集">
          <IconButton
            size="small"
            onClick={openNoteDialog}
            sx={noteButtonStyle(!!note)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <CardContent sx={{ pt: 1, pb: "8px !important", flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="subtitle2"
            component="div"
            sx={{
              flexGrow: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </Typography>
          <Chip label={rarity} size="small" sx={rarityChipStyle(rarity)} />
        </Box>

        {/* 備考エリア */}
        <Box onClick={(e) => e.stopPropagation()}>
          {note && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={noteTextStyle}>
                {note}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      {/* 備考編集ダイアログ */}
      <NoteDialog
        open={showNoteDialog}
        onClose={() => setShowNoteDialog(false)}
        onSave={handleSaveNote}
        initialNote={note}
        title="備考を編集"
        itemName={name}
      />
    </Card>
  );
};
