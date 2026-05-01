import React from 'react';
import AppLayout from '@/components/AppLayout';
import VehiclesPage from './components/VehiclesPage';

export default function Page() {
  return (
    <AppLayout>
      <VehiclesPage />
    </AppLayout>
  );
}