import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Auth/Login';
import { Signup } from './components/Auth/Signup';
import { Navbar } from './components/Layout/Navbar';
import { Dashboard } from './pages/Dashboard';
import { SkillDetail } from './pages/SkillDetail';
import { Wallet } from './pages/Wallet';
import { Leaderboard } from './pages/Leaderboard';
import { Profile } from './pages/Profile';

// 1. Helper component to bridge the URL parameters to your existing SkillDetail component
function SkillDetailRoute() {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();

  if (!skillId) return <div>Skill not found</div>;

  // navigate(-1) tells the browser to go back one step in history!
  return <SkillDetail skillId={skillId} onBack={() => navigate(-1)} />;
}

// 2. The main routing component
function AppRoutes() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const navigate = useNavigate();

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

  // Use React Router's navigate function instead of updating state
  const handleNavigateToSkill = (skillId: string) => {
    navigate(`/skill/${skillId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar no longer needs props, it handles its own active states via React Router */}
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<Dashboard onNavigateToSkill={handleNavigateToSkill} />} />
          <Route path="/wallet" element={<Wallet onNavigateToSkill={handleNavigateToSkill} />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/skill/:skillId" element={<SkillDetailRoute />} />
        </Routes>
      </main>
    </div>
  );
}

// 3. Wrap everything in BrowserRouter
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;