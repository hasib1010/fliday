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
  const [provider, setProvider] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  // Handle sign-in with retry mechanism
  useEffect(() => {
    let timeout;
    
    const attemptSignIn = async () => {
      if (!provider || isLoading || status === 'authenticated') return;
      
      try {
        setIsLoading(true);
        
        // Create a timeout promise to prevent UI hanging
        const timeoutPromise = new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error('Sign in request timed out')), 15000);
        });
        
        // Execute sign in and race with timeout
        const result = await Promise.race([
          signIn(provider, { callbackUrl, redirect: false }),
          timeoutPromise
        ]);
        
        clearTimeout(timeout);
        
        if (result?.url) {
          // Successful authentication
          router.push(result.url);
          setProvider(null);
          setRetryCount(0);
        } else if (result?.error) {
          throw new Error(result.error);
        }
      } catch (err) {
        clearTimeout(timeout);
        console.error('Sign in error:', err);
        
        // Handle timeout specifically
        if (err.message.includes('timed out') && retryCount < 2) {
          setError(`Sign in is taking longer than expected. Retrying... (${retryCount + 1}/3)`);
          setRetryCount(prev => prev + 1);
          // Allow small delay before retry
          setTimeout(() => {
            setIsLoading(false);
          }, 1000);
        } else {
          setError(
            retryCount >= 2
              ? 'Authentication timed out repeatedly. Please try again later or contact support.'
              : 'Authentication failed. Please try again.'
          );
          setProvider(null);
          setRetryCount(0);
          setIsLoading(false);
        }
      }
    };
    
    attemptSignIn();
    
    return () => {
      clearTimeout(timeout);
    };
  }, [provider, isLoading, status, callbackUrl, router, retryCount]);

  // Initiate sign-in
  const handleSignIn = (providerName) => {
    setError('');
    setProvider(providerName);
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
        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-md">
          <p>{error}</p>
          {error.includes('timed out repeatedly') && (
            <p className="mt-2 text-xs">
              Our authentication service might be experiencing delays. You can try again in a few minutes or use a different sign-in method.
            </p>
          )}
        </div>
      )}

      <div className="mt-8 space-y-4">
        <button
          onClick={() => handleSignIn('google')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25] transition-colors disabled:opacity-70"
        >
          {isLoading && provider === 'google' ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-[#F15A25] border-t-transparent rounded-full"></div>
              <span>Signing in...</span>
            </div>
          ) : (
            <>
              <FcGoogle className="h-5 w-5" />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <button
          onClick={() => handleSignIn('apple')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25] transition-colors disabled:opacity-70"
        >
          {isLoading && provider === 'apple' ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-[#F15A25] border-t-transparent rounded-full"></div>
              <span>Signing in...</span>
            </div>
          ) : (
            <>
              <AiFillApple className="h-5 w-5 text-black" />
              <span>Continue with Apple</span>
            </>
          )}
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
        <Suspense 
          fallback={
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F15A25]"></div>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>

      
    </div>
  );
}