import React from 'react';
import AppLayout from '@/components/AppLayout';
import AgenciesPage from './components/AgenciesPage';

export default function Page() {
  return (
    <AppLayout>
      <AgenciesPage />
    </AppLayout>
  );
}