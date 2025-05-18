'use client';

import { Suspense } from 'react';
import SignInForm from './SignInForm';

// Loading component for Suspense fallback
const SignInLoading = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F15A25]"></div>
  </div>
);

export default function SignInPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex flex-col items-center justify-center flex-grow px-4 py-12">
        {/* Wrap with Suspense to fix the App Router build error */}
        <Suspense fallback={<SignInLoading />}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}