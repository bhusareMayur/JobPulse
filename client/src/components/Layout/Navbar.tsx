import { TrendingUp, User, LogOut, Target, Map } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NavLink, Link } from 'react-router-dom';

export const Navbar = () => {
  const { signOut } = useAuth();

  const navItems = [
    { path: '/', label: 'Market Demand', icon: TrendingUp },
    { path: '/target', label: 'Company Target', icon: Target },
    { path: '/roadmap', label: 'Action Plan', icon: Map }, 
    { path: '/profile', label: 'My Profile', icon: User },
  ];

  return (
    <>
      {/* Top Header (Sticky on all devices) */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-indigo-50 p-1.5 rounded-lg group-hover:bg-indigo-100 transition-colors">
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">JobPulse</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 lg:px-4 py-2.5 rounded-xl transition-all duration-200 font-bold text-sm lg:text-base ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`
                  }
                >
                  {/* FIX: Wrap children in a function to access isActive */}
                  {({ isActive }) => (
                    <>
                      <item.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Logout Button */}
            <div className="flex items-center">
              <button
                onClick={signOut}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 font-bold text-sm sm:text-base group"
                title="Logout"
              >
                <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Fixed at the bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_40px_rgb(0,0,0,0.05)] pb-safe-bottom">
        <div className="flex items-center justify-around px-2 py-1.5 sm:py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-2 min-w-[72px] transition-all duration-200 rounded-2xl ${
                  isActive 
                    ? 'text-indigo-600 -translate-y-1' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              {/* FIX: Wrap children in a function to access isActive */}
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-full mb-1 transition-colors ${isActive ? 'bg-indigo-100/50' : 'bg-transparent'}`}>
                    <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-center leading-none ${isActive ? 'text-indigo-700' : ''}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
};