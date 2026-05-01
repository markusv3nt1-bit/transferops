import React from 'react';
import AppLayout from '@/components/AppLayout';
import BookingsPage from './components/BookingsPage';

export default function Page() {
  return (
    <AppLayout>
      <BookingsPage />
    </AppLayout>
  );
}