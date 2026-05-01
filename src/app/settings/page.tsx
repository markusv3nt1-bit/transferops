import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import SettingsPage from './components/SettingsPage';

export default function Page() {
  return (
    <AppLayout>
      <Suspense fallback={<div />}>
        <SettingsPage />
      </Suspense>
    </AppLayout>
  );
}