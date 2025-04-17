'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Create a separate client component for the logic that uses useSearchParams
function AuthErrorClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const error = searchParams.get('error');
    let message = 'An error occurred during authentication.';

    switch (error) {
      case 'OAuthCallback':
        message = 'There was a problem with the OAuth callback. Please try again.';
        break;
      case 'OAuthAccountNotLinked':
        message = 'This email is already associated with another account. Please sign in using your original provider.';
        break;
      case 'OAuthSignin':
        message = 'There was a problem starting the OAuth sign-in process. Please try again.';
        break;
      case 'AccessDenied':
        message = 'Access was denied to your account. Please contact support.';
        break;
      default:
        message = `Authentication error: ${error || 'Unknown issue'}`;
    }

    setErrorMessage(message);
  }, [searchParams]);

  return (
    <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-md">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-bold text-gray-900">Authentication Error</h2>
        <p className="mt-2 text-sm text-gray-600">
          {errorMessage}
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <button
          onClick={() => router.push('/api/auth/signin')}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F15A25] hover:bg-[#E04E1A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25]"
        >
          Try Again
        </button>

        <Link
          href="/"
          className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense fallback={<p>Loading error message...</p>}>
        <AuthErrorClient />
      </Suspense>
    </div>
  );
}