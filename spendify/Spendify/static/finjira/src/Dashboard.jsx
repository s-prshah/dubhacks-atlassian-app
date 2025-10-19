import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { Trophy, Target, Flame, Star, TrendingDown, Award, Zap, Lock, CheckCircle2, Plus, Settings, X } from 'lucide-react';

Chart.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Modal states
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Form states
  const [newExpense, setNewExpense] = useState({ category: 'Food', amount: '', description: '' });
  const [newBudget, setNewBudget] = useState('');

  const fetchData = async () => {
    const result = await invoke('getDashboardData');
    setData(result);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      showNotification('Please enter a valid amount', 'error');
      return;
    }

    try {
      const result = await invoke('addExpense', newExpense);
      if (result.success) {
        setData(result.data);
        setShowAddExpense(false);
        setNewExpense({ category: 'Food', amount: '', description: '' });
        showNotification('Expense added successfully!');
      }
    } catch (error) {
      showNotification('Failed to add expense', 'error');
    }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    
    if (!newBudget || parseFloat(newBudget) <= 0) {
      showNotification('Please enter a valid budget', 'error');
      return;
    }

    try {
      const result = await invoke('updateBudget', { budget: newBudget });
      if (result.success) {
        setData(result.data);
        setShowBudgetModal(false);
        setNewBudget('');
        showNotification('Budget updated successfully!');
      }
    } catch (error) {
      showNotification('Failed to update budget', 'error');
    }
  };

  const handleDailyCheckIn = async () => {
    try {
      const result = await invoke('claimDailyCheckIn');
      if (result.success) {
        setData(result.data);
        showNotification(`🔥 Streak increased to ${result.newStreak} days!`);
      } else {
        showNotification(result.error, 'error');
      }
    } catch (error) {
      showNotification('Failed to check in', 'error');
    }
  };

  const getGamificationData = () => {
    if (!data) return null;

    const budget = data.budget || 500;
    const percentUsed = (data.total / budget) * 100;
    const streak = data.streak || 0;
    const totalSaved = budget - data.total;
    const savingsRate = ((totalSaved / budget) * 100).toFixed(1);

    const level = Math.floor(streak / 5) + 1;
    const xpProgress = ((streak % 5) / 5) * 100;

    const achievements = [
      { 
        id: 1, 
        name: 'Budget Master', 
        icon: Trophy,
        description: 'Stay under budget',
        unlocked: percentUsed < 100,
        progress: Math.min(100, 100 - percentUsed),
        color: 'bg-gradient-to-br from-emerald-400 to-emerald-600'
      },
      { 
        id: 2, 
        name: 'Streak King', 
        icon: Flame,
        description: '7 day tracking streak',
        unlocked: streak >= 7,
        progress: Math.min(100, (streak / 7) * 100),
        color: 'bg-gradient-to-br from-orange-400 to-red-500'
      },
      { 
        id: 3, 
        name: 'Super Saver', 
        icon: Star,
        description: 'Save 20% of budget',
        unlocked: savingsRate >= 20,
        progress: Math.min(100, (savingsRate / 20) * 100),
        color: 'bg-gradient-to-br from-yellow-400 to-amber-500'
      },
      { 
        id: 4, 
        name: 'Category Pro', 
        icon: Award,
        description: 'Track 5+ categories',
        unlocked: data.byCategory.length >= 5,
        progress: Math.min(100, (data.byCategory.length / 5) * 100),
        color: 'bg-gradient-to-br from-purple-400 to-violet-600'
      },
    ];

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return {
      budget,
      percentUsed,
      streak,
      totalSaved,
      savingsRate,
      level,
      xpProgress,
      achievements,
      unlockedCount
    };
  };

  const gamification = data ? getGamificationData() : null;

  useEffect(() => {
    if (gamification && gamification.unlockedCount > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [gamification?.unlockedCount]);

  if (!data) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Loading your finances...</p>
      </div>
    </div>
  );

  const pieData = {
    labels: data.byCategory.map((x) => x.name),
    datasets: [
      {
        data: data.byCategory.map((x) => x.value),
        backgroundColor: [
          'rgba(139, 92, 246, 0.85)',
          'rgba(59, 130, 246, 0.85)',
          'rgba(236, 72, 153, 0.85)',
          'rgba(251, 146, 60, 0.85)',
          'rgba(34, 197, 94, 0.85)',
        ],
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverOffset: 15,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 16,
        titleFont: { size: 15, weight: '600' },
        bodyFont: { size: 14 },
        displayColors: true,
        borderColor: 'rgba(148, 163, 184, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `$${context.parsed.toFixed(2)} (${percentage}%)`;
          }
        }
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1200,
      easing: 'easeInOutQuart',
    },
  };

  const getIcon = (category) => {
    const icons = {
      Food: '🍔',
      Transport: '🚗',
      Entertainment: '🎮',
      Utilities: '💡',
      Other: '📦',
    };
    return icons[category] || '💰';
  };

  const getColor = (index) => {
    const colors = [
      'from-purple-500 to-purple-600',
      'from-blue-500 to-blue-600',
      'from-pink-500 to-pink-600',
      'from-orange-500 to-orange-600',
      'from-green-500 to-green-600',
    ];
    return colors[index % colors.length];
  };

  const getBorderColor = (index) => {
    const colors = [
      'rgba(139, 92, 246, 1)',
      'rgba(59, 130, 246, 1)',
      'rgba(236, 72, 153, 1)',
      'rgba(251, 146, 60, 1)',
      'rgba(34, 197, 94, 1)',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-xl border-2 ${
          notification.type === 'success' 
            ? 'bg-emerald-500 border-emerald-600 text-white' 
            : 'bg-red-500 border-red-600 text-white'
        }`}>
          <p className="font-medium">{notification.message}</p>
        </div>
      )}

      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 1.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              {['🎉', '⭐', '🏆', '💎'][Math.floor(Math.random() * 4)]}
            </div>
          ))}
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-slate-900">Add Expense</h3>
              <button onClick={() => setShowAddExpense(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option>Food</option>
                  <option>Transport</option>
                  <option>Entertainment</option>
                  <option>Utilities</option>
                  <option>Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description (optional)</label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Lunch at cafe"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-slate-900">Set Budget</h3>
              <button onClick={() => setShowBudgetModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Monthly Budget ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="500.00"
                  required
                />
                <p className="mt-2 text-sm text-slate-500">Current budget: ${gamification.budget}</p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Update Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Finance Dashboard
              </h1>
              <p className="text-slate-600">Track your spending and level up your savings game</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBudgetModal(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-slate-700 transition-colors flex items-center gap-2"
              >
                <Settings size={18} />
                Budget
              </button>
              <button
                onClick={() => setShowAddExpense(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg text-white rounded-xl font-medium transition-all flex items-center gap-2"
              >
                <Plus size={18} />
                Add Expense
              </button>
            </div>
          </div>

          {/* Level & XP */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-xl font-bold text-xl shadow-lg">
                Level {gamification.level}
              </div>
              <Zap className="text-amber-500" size={28} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
                <span className="font-medium">Level {gamification.level}</span>
                <span className="font-bold text-purple-600">{gamification.xpProgress.toFixed(0)}% to next level</span>
                <span className="font-medium">Level {gamification.level + 1}</span>
              </div>
              <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-blue-500 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${gamification.xpProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid with Daily Check-in */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={handleDailyCheckIn}
            className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Flame size={24} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{gamification.streak}</p>
                <p className="text-xs opacity-90">days</p>
              </div>
            </div>
            <p className="text-sm font-medium opacity-90">Daily Streak</p>
            <p className="text-xs mt-2 opacity-75">Click to check in!</p>
          </button>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingDown className="text-emerald-600" size={24} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">${gamification.totalSaved.toFixed(0)}</p>
                <p className="text-xs text-slate-500">{gamification.savingsRate}%</p>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-700">Total Saved</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Trophy className="text-purple-600" size={24} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">{gamification.unlockedCount}/4</p>
                <p className="text-xs text-slate-500">unlocked</p>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-700">Achievements</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="text-blue-600" size={24} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">{gamification.percentUsed.toFixed(0)}%</p>
                <p className="text-xs text-slate-500">of ${gamification.budget}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-700">Budget Used</p>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Award className="text-amber-500" size={24} />
            Your Achievements
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gamification.achievements.map((achievement) => {
              const IconComponent = achievement.icon;
              return (
                <div
                  key={achievement.id}
                  className={`relative rounded-xl p-5 cursor-pointer transition-all duration-300 border-2 ${
                    achievement.unlocked 
                      ? achievement.color + ' border-transparent text-white shadow-lg hover:shadow-xl hover:scale-105' 
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`p-3 rounded-full mb-3 ${achievement.unlocked ? 'bg-white bg-opacity-20' : 'bg-slate-200'}`}>
                      {achievement.unlocked ? (
                        <IconComponent size={32} />
                      ) : (
                        <Lock size={32} />
                      )}
                    </div>
                    <p className="text-sm font-bold mb-1">{achievement.name}</p>
                    <p className={`text-xs mb-3 ${achievement.unlocked ? 'text-white text-opacity-80' : 'text-slate-500'}`}>
                      {achievement.description}
                    </p>
                    
                    <div className="w-full bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          achievement.unlocked ? 'bg-white' : 'bg-slate-400'
                        }`}
                        style={{ width: `${achievement.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {achievement.unlocked && (
                    <div className="absolute -top-2 -right-2">
                      <CheckCircle2 className="text-white fill-current drop-shadow-lg" size={24} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Spending Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget Card */}
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Total Spent</h3>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                gamification.percentUsed > 100 ? 'bg-red-500' : gamification.percentUsed > 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}>
                {gamification.percentUsed > 100 ? 'OVER' : gamification.percentUsed > 80 ? 'WARNING' : 'ON TRACK'}
              </div>
            </div>
            
            <p className="text-5xl font-bold mb-6">${data.total.toFixed(2)}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-purple-100">Progress</span>
                <span className="font-bold">${data.total.toFixed(0)} / ${gamification.budget}</span>
              </div>
              <div className="h-3 bg-white bg-opacity-20 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    gamification.percentUsed > 100 
                      ? 'bg-red-400 animate-pulse' 
                      : gamification.percentUsed > 80
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, gamification.percentUsed)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Spending by Category</h3>
            <div className="flex items-center justify-center">
              <div className="w-full max-w-xs">
                <Pie data={pieData} options={options} />
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Category Details</h3>
          <div className="space-y-3">
            {data.byCategory.map((category, index) => {
              const percentage = ((category.value / data.total) * 100).toFixed(1);
              return (
                <div
                  key={category.name}
                  className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredCategory(category.name)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getBorderColor(index) }}
                      ></div>
                      <span className="text-2xl">{getIcon(category.name)}</span>
                      <div>
                        <h4 className="font-bold text-slate-900">{category.name}</h4>
                        <p className="text-sm text-slate-500">{percentage}% of spending</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">${category.value.toFixed(2)}</p>
                  </div>
                  
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${getColor(index)} h-full rounded-full transition-all duration-500`}
                      style={{
                        width: hoveredCategory === category.name ? '100%' : `${percentage}%`,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10px) rotateZ(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotateZ(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
          font-size: 20px;
        }
      `}</style>
    </div>
  );
}