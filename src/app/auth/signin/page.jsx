'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FcGoogle } from 'react-icons/fc';
import { AiFillApple } from 'react-icons/ai';

// Create a separate client component for the login form logic
function LoginForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleSignIn = async (provider) => {
    try {
      setIsLoading(true);
      setError('');

      const result = await signIn(provider, {
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError('Authentication failed. Please try again.');
      }

      if (result?.url) {
        router.push(result.url);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F15A25]"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-md">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="Logo"
            width={140}
            height={140}
            priority
          />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">Welcome back</h2>
        <p className="mt-2 text-sm text-gray-600">
          Sign in to continue to your account
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
          {error}
        </div>
      )}

      <div className="mt-8 space-y-4">
        <button
          onClick={() => handleSignIn('google')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25] transition-colors disabled:opacity-70"
        >
          <FcGoogle className="h-5 w-5" />
          <span>Continue with Google</span>
        </button>

        <button
          onClick={() => handleSignIn('apple')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25] transition-colors disabled:opacity-70"
        >
          <AiFillApple className="h-5 w-5 text-black" />
          <span>Continue with Apple</span>
        </button>
      </div>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-[#F15A25] hover:text-[#E04E1A]">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-[#F15A25] hover:text-[#E04E1A]">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex flex-col items-center justify-center flex-grow px-4 py-12">
        <Suspense fallback={<p>Loading login form...</p>}>
          <LoginForm />
        </Suspense>
      </div>

      <div className="mt-8 text-center text-sm">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <span className="font-medium text-[#F15A25] hover:text-[#E04E1A] cursor-default">
            No worries! You'll create one automatically when you sign in.
          </span>
        </p>
      </div>
    </div>
  );
}