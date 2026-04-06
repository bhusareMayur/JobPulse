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
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <TrendingUp className="w-8 h-8 text-indigo-600" />
            <span className="text-xl font-bold text-slate-900">JobPulse</span>
          </Link>

          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-bold ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors font-bold"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-100 py-3 bg-white">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-slate-500'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};