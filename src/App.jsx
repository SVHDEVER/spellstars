import React from 'react';

export default function SpellStarsApp() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '1rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⭐</div>
        <h1 style={{ fontSize: '2rem', color: '#4f46e5', marginBottom: '0.5rem' }}>
          SpellStars
        </h1>
        <p style={{ color: '#6b7280' }}>
          Build successful! Now deploying full app...
        </p>
      </div>
    </div>
  );
}
