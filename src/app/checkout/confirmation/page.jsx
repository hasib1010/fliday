// src\app\checkout\confirmation\page.jsx
import React from 'react';
import { Suspense } from 'react';
import ConfirmationContent from './ConfirmationContent';

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}