import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Auth/Login';
import { Signup } from './components/Auth/Signup';
import { Navbar } from './components/Layout/Navbar';
import { Dashboard } from './pages/Dashboard';
import { SkillDetail } from './pages/SkillDetail';
import { Wallet } from './pages/Wallet';
import { Leaderboard } from './pages/Leaderboard';
import { Profile } from './pages/Profile';

type Page = 'dashboard' | 'wallet' | 'leaderboard' | 'profile';

function AppContent() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return authMode === 'login' ? (
      <Login onToggle={() => setAuthMode('signup')} />
    ) : (
      <Signup onToggle={() => setAuthMode('login')} />
    );
  }

  const handleNavigateToSkill = (skillId: string) => {
    setSelectedSkillId(skillId);
  };

  const handleBackToDashboard = () => {
    setSelectedSkillId(null);
    setCurrentPage('dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage={currentPage} onNavigate={(page) => {
        setCurrentPage(page as Page);
        setSelectedSkillId(null);
      }} />

      <main>
        {selectedSkillId ? (
          <SkillDetail skillId={selectedSkillId} onBack={handleBackToDashboard} />
        ) : (
          <>
            {currentPage === 'dashboard' && <Dashboard onNavigateToSkill={handleNavigateToSkill} />}
            {currentPage === 'wallet' && <Wallet />}
            {currentPage === 'leaderboard' && <Leaderboard />}
            {currentPage === 'profile' && <Profile />}
          </>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
