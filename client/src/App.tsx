import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Auth/Login';
import { Signup } from './components/Auth/Signup';
import { Navbar } from './components/Layout/Navbar';
import { Footer } from './components/Layout/Footer';
import { Dashboard } from './pages/Dashboard';
import { SkillDetail } from './pages/SkillDetail';
import { Profile } from './pages/Profile';
import Landing from './pages/Landing';
import { HodDashboard } from './pages/HodDashboard';
import { CompanyTarget } from './pages/CompanyTarget';
import { RoadmapGenerator } from './pages/RoadmapGenerator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 1,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function SkillDetailRoute() {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  if (!skillId) return <div>Skill not found</div>;
  return <SkillDetail skillId={skillId} onBack={() => navigate(-1)} />;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleNavigateToSkill = (skillId: string) => {
    navigate(`/skill/${skillId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login onToggle={() => navigate('/signup')} />} />
            <Route path="/signup" element={<Signup onToggle={() => navigate('/login')} />} />
            <Route path="/admin/hod" element={<HodDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Dashboard onNavigateToSkill={handleNavigateToSkill} />} />
          <Route path="/target" element={<CompanyTarget />} />
          <Route path="/roadmap" element={<RoadmapGenerator />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/skill/:skillId" element={<SkillDetailRoute />} />
          <Route path="/admin/hod" element={<HodDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;