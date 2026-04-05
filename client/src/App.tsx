import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // <-- Import React Query
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Auth/Login';
import { Signup } from './components/Auth/Signup';
import { Navbar } from './components/Layout/Navbar';
import { Footer } from './components/Layout/Footer'; // <-- Import the new Footer
import { Dashboard } from './pages/Dashboard';
import { SkillDetail } from './pages/SkillDetail';
import { Wallet } from './pages/Wallet';
import { Leaderboard } from './pages/Leaderboard';
import { Profile } from './pages/Profile';
import Landing from './pages/Landing'; // <-- Import the new Landing page

// 1. Initialize the Query Client with Launch-Safe Options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 1, // Data stays fresh for 1 minute
      gcTime: 1000 * 60 * 5, // Keep in garbage collection for 5 mins
      refetchOnWindowFocus: false, // 🚨 CRITICAL FIX: Prevents DDOS when hundreds of students switch tabs at once
      retry: 1, // Only retry failed requests once to avoid hammering a struggling server
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleNavigateToSkill = (skillId: string) => {
    navigate(`/skill/${skillId}`);
  };

  // ---------------------------------------------------------
  // PUBLIC ROUTES (Unauthenticated Users)
  // ---------------------------------------------------------
  if (!user) {
    return (
      // Added flex and flex-col layout for public routes
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Main content area expands to push footer down */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Landing />} />
            
            {/* We pass a navigate function to onToggle so your existing components can switch paths */}
            <Route path="/login" element={<Login onToggle={() => navigate('/signup')} />} />
            <Route path="/signup" element={<Signup onToggle={() => navigate('/login')} />} />
            
            {/* Catch-all: Redirect any unknown URLs to the landing page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Inserted the Footer component here for public pages */}
        <Footer />
      </div>
    );
  }

  // ---------------------------------------------------------
  // PROTECTED ROUTES (Authenticated Users)
  // ---------------------------------------------------------
  return (
    // Added flex and flex-col to enable the sticky footer
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      {/* Added flex-grow so the main content pushes the footer down */}
      <main className="flex-grow">
        <Routes>
          {/* Dashboard takes over the root URL once logged in */}
          <Route path="/" element={<Dashboard onNavigateToSkill={handleNavigateToSkill} />} />
          <Route path="/wallet" element={<Wallet onNavigateToSkill={handleNavigateToSkill} />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/skill/:skillId" element={<SkillDetailRoute />} />
          
          {/* Catch-all: Redirect any unknown URLs to the dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Inserted the Footer component here for protected pages */}
      <Footer />
    </div>
  );
}

// 2. Wrap the app with QueryClientProvider
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