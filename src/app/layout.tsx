import { Navigation } from '@/components/common/Navigation';
import { ThemeProvider } from '@/components/common/ThemeProvider';
import { LocalStorageProvider } from '@/components/common/LocalStorageProvider';

export const metadata = {
  title: 'グラブル所持チェッカー',
  description: 'グラブルの所持キャラ、武器、召喚石を管理・共有できるツール',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <ThemeProvider>
          <LocalStorageProvider>
            <Navigation />
            <main style={{ padding: '20px' }}>
              {children}
            </main>
          </LocalStorageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
