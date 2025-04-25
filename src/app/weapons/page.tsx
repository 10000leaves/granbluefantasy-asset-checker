import { Container, Paper, Typography } from "@mui/material";
import { WeaponList } from "./WeaponList";

export default function WeaponsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ヘッダー */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 2,
          borderRadius: 2,
          backgroundImage: "linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)",
          color: "white",
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight="bold">
          武器一覧
        </Typography>
        <Typography variant="body2">所持武器を選択してください。</Typography>
      </Paper>
      {/* 武器リスト */}
      <WeaponList />
    </Container>
  );
}
