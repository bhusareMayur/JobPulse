import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, ArrowRight, Plus, Search, Users, GraduationCap } from 'lucide-react';
import { supabase, Skill } from '../lib/supabase';
import { AddSkillForm } from '../components/AddSkillForm';

interface DashboardProps {
  onNavigateToSkill: (skillId: string) => void;
}

export const Dashboard = ({ onNavigateToSkill }: DashboardProps) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [seniorTrends, setSeniorTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSkills();
    fetchSeniorTrends(); // Fetch the 2026 batch data
    
    const channel = supabase
      .channel('skills-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'skills' }, () => {
        fetchSkills();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSkills = async () => {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('current_price', { ascending: false });

    if (!error && data) {
      setSkills(data);
    }
    setLoading(false);
  };

  const fetchSeniorTrends = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/batch-trends?year=2026`);
      if (res.ok) {
        const data = await res.json();
        setSeniorTrends(data);
      }
    } catch (err) {
      console.error("Failed to load senior trends", err);
    }
  };

  const getPriceChange = (skill: Skill) => {
    return ((skill.current_price - skill.initial_price) / skill.initial_price) * 100;
  };

  const filteredSkills = skills.filter(skill =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Skill Simulator</h1>
          <p className="text-gray-600">Analyze skill demand based on real-world hiring data</p>
        </div>
        
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Request Skill</span>
          </button>
        </div>
      </div>

      {/* --- NEW: PLACEMENT COHORT INTELLIGENCE --- */}
      {seniorTrends.length > 0 && !searchTerm && (
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Placement Cohort Intelligence</h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded-md ml-2">2026 Batch</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {seniorTrends.map((trend, index) => (
              <div 
                key={trend.id} 
                onClick={() => onNavigateToSkill(trend.id)}
                className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl p-5 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all relative overflow-hidden group"
              >
                {/* Decorative background number */}
                <div className="absolute -right-4 -bottom-6 text-8xl font-black text-white opacity-10 group-hover:opacity-20 transition-opacity">
                  {index + 1}
                </div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white">{trend.name}</h3>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1.5">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-indigo-100 text-sm font-medium mb-4">Highly tracked by seniors</p>
                  <div className="flex justify-between items-center text-white">
                    <span className="font-bold">{trend.price.toFixed(2)} JC</span>
                    <span className="text-xs bg-white text-indigo-700 px-2 py-1 rounded font-bold">
                      Analyze
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ----------------------------------------- */}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900 mb-2">
          <strong>How it works:</strong> Track skills you expect to grow. Demand scores fluctuate based on <strong>real-world job market trends</strong> and analyst activity. Drop when you've maximized your learning score!
        </p>
      </div>

      {showAddForm && (
        <AddSkillForm 
          onSuccess={() => setShowAddForm(false)} 
          onCancel={() => setShowAddForm(false)} 
        />
      )}

      {filteredSkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => {
            const priceChange = getPriceChange(skill);
            const isPositive = priceChange >= 0;

            return (
              <div
                key={skill.id}
                onClick={() => onNavigateToSkill(skill.id)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{skill.name}</h3>
                  <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    <span className="text-sm font-bold">
                      {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Score</span>
                    <span className="text-xl font-bold text-gray-900">
                      {skill.current_price.toFixed(2)} JC
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Initial Score</span>
                    <span className="text-gray-700">{skill.initial_price.toFixed(2)} JC</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="text-sm">
                    <span className="text-gray-600">Volume: </span>
                    <span className="font-medium text-gray-900">
                      {skill.total_buy_volume + skill.total_sell_volume}
                    </span>
                  </div>
                  <button className="flex items-center space-x-1 text-blue-600 font-medium hover:text-blue-700">
                    <span>Simulate</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No skills found</h3>
          <p className="text-gray-500">We couldn't find any skills matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};