import Resolver from '@forge/resolver';
import { storage } from '@forge/api';

const resolver = new Resolver();

// Your existing getDashboardData resolver
resolver.define('getDashboardData', async (req) => {
  console.log('getDashboardData called');
  
  // Try to get data from storage first
  const storedData = await storage.get('expenseData');
  
  if (storedData) {
    return storedData;
  }
  
  // Default mock data if nothing in storage
  const defaultData = {
    total: 450.75,
    byCategory: [
      { name: 'Food', value: 150.25 },
      { name: 'Transport', value: 89.50 },
      { name: 'Entertainment', value: 120.00 },
      { name: 'Utilities', value: 65.00 },
      { name: 'Other', value: 26.00 },
    ],
    streak: 7,
    budget: 500,
  };
  
  // Save default data to storage
  await storage.set('expenseData', defaultData);
  
  return defaultData;
});

// Add new expense
resolver.define('addExpense', async (req) => {
  console.log('addExpense called with:', req.payload);
  
  const { category, amount, description } = req.payload;
  
  // Get current data
  const data = await storage.get('expenseData') || {
    total: 0,
    byCategory: [],
    streak: 1,
    budget: 500,
  };
  
  // Find or create category
  const categoryIndex = data.byCategory.findIndex(c => c.name === category);
  
  if (categoryIndex >= 0) {
    data.byCategory[categoryIndex].value += parseFloat(amount);
  } else {
    data.byCategory.push({
      name: category,
      value: parseFloat(amount)
    });
  }
  
  // Update total
  data.total += parseFloat(amount);
  
  // Save updated data
  await storage.set('expenseData', data);
  
  return { success: true, data };
});

// Update budget
resolver.define('updateBudget', async (req) => {
  console.log('updateBudget called with:', req.payload);
  
  const { budget } = req.payload;
  
  const data = await storage.get('expenseData') || {
    total: 0,
    byCategory: [],
    streak: 1,
    budget: 500,
  };
  
  data.budget = parseFloat(budget);
  
  await storage.set('expenseData', data);
  
  return { success: true, data };
});

// Reset all data
resolver.define('resetData', async (req) => {
  console.log('resetData called');
  
  const defaultData = {
    total: 0,
    byCategory: [],
    streak: 0,
    budget: 500,
  };
  
  await storage.set('expenseData', defaultData);
  
  return { success: true, data: defaultData };
});

// Delete expense from category
resolver.define('deleteExpense', async (req) => {
  console.log('deleteExpense called with:', req.payload);
  
  const { category, amount } = req.payload;
  
  const data = await storage.get('expenseData');
  
  if (!data) {
    return { success: false, error: 'No data found' };
  }
  
  const categoryIndex = data.byCategory.findIndex(c => c.name === category);
  
  if (categoryIndex >= 0) {
    data.byCategory[categoryIndex].value -= parseFloat(amount);
    
    // Remove category if value is 0 or negative
    if (data.byCategory[categoryIndex].value <= 0) {
      data.byCategory.splice(categoryIndex, 1);
    }
    
    data.total -= parseFloat(amount);
    data.total = Math.max(0, data.total); // Ensure total doesn't go negative
  }
  
  await storage.set('expenseData', data);
  
  return { success: true, data };
});

// Claim daily check-in (increases streak)
resolver.define('claimDailyCheckIn', async (req) => {
  console.log('claimDailyCheckIn called');
  
  const data = await storage.get('expenseData');
  
  if (!data) {
    return { success: false, error: 'No data found' };
  }
  
  // Get last check-in date
  const lastCheckIn = await storage.get('lastCheckIn');
  const today = new Date().toDateString();
  
  if (lastCheckIn === today) {
    return { success: false, error: 'Already checked in today!' };
  }
  
  // Increment streak
  data.streak = (data.streak || 0) + 1;
  
  await storage.set('expenseData', data);
  await storage.set('lastCheckIn', today);
  
  return { success: true, data, newStreak: data.streak };
});

// Get achievement progress
resolver.define('getAchievements', async (req) => {
  console.log('getAchievements called');
  
  const data = await storage.get('expenseData');
  
  if (!data) {
    return { achievements: [] };
  }
  
  const percentUsed = (data.total / data.budget) * 100;
  const totalSaved = data.budget - data.total;
  const savingsRate = ((totalSaved / data.budget) * 100).toFixed(1);
  
  const achievements = [
    { 
      id: 1, 
      name: 'Budget Master', 
      description: 'Stay under budget',
      unlocked: percentUsed < 100,
      progress: Math.min(100, 100 - percentUsed),
    },
    { 
      id: 2, 
      name: 'Streak King', 
      description: '7 day tracking streak',
      unlocked: (data.streak || 0) >= 7,
      progress: Math.min(100, ((data.streak || 0) / 7) * 100),
    },
    { 
      id: 3, 
      name: 'Super Saver', 
      description: 'Save 20% of budget',
      unlocked: savingsRate >= 20,
      progress: Math.min(100, (savingsRate / 20) * 100),
    },
    { 
      id: 4, 
      name: 'Category Pro', 
      description: 'Track 5+ categories',
      unlocked: data.byCategory.length >= 5,
      progress: Math.min(100, (data.byCategory.length / 5) * 100),
    },
  ];
  
  return { achievements };
});

export const handler = resolver.getDefinitions();