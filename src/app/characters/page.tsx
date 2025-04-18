import { Container } from '@mui/material';
import { CharacterList } from './CharacterList';

export default function CharactersPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <CharacterList />
    </Container>
  );
}
