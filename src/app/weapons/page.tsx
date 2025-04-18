import { Container } from '@mui/material';
import { WeaponList } from './WeaponList';

export default function WeaponsPage() {
  return (

    <Container maxWidth="lg" sx={{ py: 4 }}>
    <WeaponList />
    </Container>
);
}
