import { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import FloatingActionButton from './FloatingActionButton';

interface AppLayoutProps {
  children: ReactNode;
  showFAB?: boolean;
  userName?: string;
}

const AppLayout = ({ children, showFAB = true, userName }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-light-surface dark:bg-dark-base">
      <Header userName={userName} />
      <main className="pb-20 pt-4">
        {children}
      </main>
      <BottomNav />
      {showFAB && <FloatingActionButton />}
    </div>
  );
};

export default AppLayout;
