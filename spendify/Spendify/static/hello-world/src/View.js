import React from 'react';

function View() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ color: '#0052CC' }}>💰 Spendify Dashboard</h2>
      <p>Track your expenses like you manage projects!</p>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#F4F5F7', borderRadius: '8px' }}>
        <h3>Quick Stats</h3>
        <p>📊 Total Expenses: $0</p>
        <p>🎯 Budget Remaining: $0</p>
        <p>📅 Current Period: Not set</p>
      </div>
      
      <div style={{ marginTop: '20px', color: '#6B778C' }}>
        <small>✨ Ready for your team to add functionality!</small>
      </div>
    </div>
  );
}

export default View;