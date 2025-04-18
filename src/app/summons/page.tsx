import { Container } from '@mui/material';
import { SummonList } from './SummonList';

export default function SummonsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <SummonList />
    </Container>
  );
}
