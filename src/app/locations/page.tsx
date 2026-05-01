import React from 'react';
import AppLayout from '@/components/AppLayout';
import LocationsPage from './components/LocationsPage';

export default function Page() {
  return (
    <AppLayout>
      <LocationsPage />
    </AppLayout>
  );
}
