'use client';

import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

type AuthMode = 'login' | 'register';

export function AuthWrapper() {
  const [mode, setMode] = useState<AuthMode>('login');

  const handleSwitchToRegister = () => setMode('register');
  const handleSwitchToLogin = () => setMode('login');
  const handleRegistrationSuccess = () => setMode('login');

  if (mode === 'register') {
    return (
      <RegisterForm 
        onBackToLogin={handleSwitchToLogin}
        onSuccess={handleRegistrationSuccess}
      />
    );
  }

  return (
    <LoginForm onSwitchToRegister={handleSwitchToRegister} />
  );
}