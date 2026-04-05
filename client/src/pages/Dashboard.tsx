import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, ArrowRight, Plus } from 'lucide-react';
import { supabase, Skill } from '../lib/supabase';
import { AddSkillForm } from '../components/AddSkillForm';

interface DashboardProps {
  onNavigateToSkill: (skillId: string) => void;
}

export const Dashboard = ({ onNavigateToSkill }: DashboardProps) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchSkills();
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

  const getPriceChange = (skill: Skill) => {
    const change = ((skill.current_price - skill.initial_price) / skill.initial_price) * 100;
    return change;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">JobPulse</h1>
          <p className="text-gray-600">Trade skills based on real-time demand</p>
        </div>
        
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Skill</span>
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900">
          <strong>How it works:</strong> Buy skills you expect to grow. Prices fluctuate based on <strong>real-world job market trends</strong> and trader activity. Sell when you've made a profit!
        </p>
      </div>

      {showAddForm && (
        <AddSkillForm 
          onSuccess={() => setShowAddForm(false)} 
          onCancel={() => setShowAddForm(false)} 
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((skill) => {
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
                  <span className="text-sm text-gray-600">Current Price</span>
                  <span className="text-xl font-bold text-gray-900">
                    {skill.current_price.toFixed(2)} JC
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Initial Price</span>
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
                  <span>Trade</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};