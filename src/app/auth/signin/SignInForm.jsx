'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FcGoogle } from 'react-icons/fc';
import { AiFillApple } from 'react-icons/ai';

// Map of error codes to user-friendly messages
const ERROR_MESSAGES = {
  OAuthCallback: "There was a problem with the sign-in process. This could be due to a configuration issue.",
  OAuthCallbackError: "There was a problem with the sign-in process. This may be related to browser cookie settings.",
  OAuthSignin: "Could not initiate sign in with the provider.",
  OAuthAccountNotLinked: "To confirm your identity, sign in with the same account you used originally.",
  AccessDenied: "You don't have permission to sign in.",
  Verification: "The verification link may have expired or already been used.",
  Configuration: "There is a problem with the server configuration.",
  default: "An error occurred during sign in. Please try again."
};

export default function SignInForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [alternateAppleFlow, setAlternateAppleFlow] = useState(false);
  
  // Extract and handle error from URL if present
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      console.log('Auth error from URL:', errorParam);
      
      // Set error message
      setError(ERROR_MESSAGES[errorParam] || ERROR_MESSAGES.default);
      
      // If there's a PKCE error with Apple, try an alternate approach next time
      if ((errorParam === 'OAuthCallbackError' || errorParam === 'OAuthCallback') && 
          searchParams.get('providerId') === 'apple') {
        setAlternateAppleFlow(true);
        console.log('Will use alternate Apple sign-in approach next time');
      }
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  // Function to handle standard Apple Sign In
  const handleStandardAppleSignIn = () => {
    setIsLoading(true);
    setProvider('apple');
    setError('');
    
    // Use NextAuth signIn function with redirect
    signIn('apple', { callbackUrl, redirect: true });
  };
  
  // Function to handle alternate Apple Sign In (direct approach)
  const handleAlternateAppleSignIn = () => {
    setIsLoading(true);
    setProvider('apple');
    setError('');
    
    // Clean up any existing PKCE cookies
    document.cookie = "next-auth.pkce.code_verifier=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    
    // Use direct URL navigation instead of signIn function
    const redirectUrl = `/api/auth/signin/apple?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    console.log('Using alternate Apple sign-in approach with direct navigation to:', redirectUrl);
    window.location.href = redirectUrl;
  };

  // Handle sign-in with retry mechanism (for non-Apple providers)
  useEffect(() => {
    let timeout;
    
    const attemptSignIn = async () => {
      // Skip Apple sign-in here (handled separately) and skip if already loading or authenticated
      if (!provider || provider === 'apple' || isLoading || status === 'authenticated') return;
      
      try {
        setIsLoading(true);
        console.log(`Attempting sign in with ${provider}...`);
        
        // Create a timeout promise to prevent UI hanging
        const timeoutPromise = new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error('Sign in request timed out')), 15000);
        });
        
        // For other providers like Google
        const result = await Promise.race([
          signIn(provider, { callbackUrl, redirect: false }),
          timeoutPromise
        ]);
        
        clearTimeout(timeout);
        
        if (result?.url) {
          // Successful authentication
          console.log('Sign-in successful, redirecting to:', result.url);
          router.push(result.url);
          setProvider(null);
          setRetryCount(0);
        } else if (result?.error) {
          throw new Error(result.error);
        }
      } catch (err) {
        clearTimeout(timeout);
        console.error('Sign in error:', err.message);
        
        // Handle timeout specifically
        if (err.message.includes('timed out') && retryCount < 2) {
          setError(`Sign in is taking longer than expected. Retrying... (${retryCount + 1}/3)`);
          setRetryCount(prev => prev + 1);
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

  // Handle sign-in for all providers
  const handleSignIn = (providerName) => {
    setError('');
    
    if (providerName === 'apple') {
      // Use alternate flow if previous attempts had PKCE issues
      if (alternateAppleFlow) {
        handleAlternateAppleSignIn();
      } else {
        handleStandardAppleSignIn();
      }
    } else {
      setProvider(providerName);
    }
  };

  // Loading state while checking session
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center">
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
          {(error.includes('problem with the sign-in process') || error.includes('cookie settings')) && (
            <div className="mt-2 text-xs">
              <p>This could be due to:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Browser cookie settings - cookies must be enabled</li>
                <li>Using private browsing mode which restricts cookies</li>
                <li>Authentication service configuration</li>
              </ul>
              <p className="mt-2">Try enabling cookies, using a different browser, or sign in with Google instead.</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 space-y-4">
        <button
          onClick={() => handleSignIn('google')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25] transition-colors disabled:opacity-70"
          aria-label="Sign in with Google"
          data-testid="google-signin-button"
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
          aria-label="Sign in with Apple"
          data-testid="apple-signin-button"
        >
          {isLoading && provider === 'apple' ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-[#F15A25] border-t-transparent rounded-full"></div>
              <span>Signing in{alternateAppleFlow ? ' (alternate method)' : ''}...</span>
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
      
      {/* Debug information - only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-3 bg-gray-100 rounded text-xs font-mono">
          <div className="font-semibold">Debug Info:</div>
          <div>Page: /auth/signin</div>
          <div>Provider: {provider || 'none'}</div>
          <div>Status: {status}</div>
          <div>Error: {searchParams.get('error') || 'none'}</div>
          <div>CallbackUrl: {callbackUrl}</div>
          <div>Cookies Enabled: {navigator.cookieEnabled ? 'Yes' : 'No'}</div>
          <div>Alternate Apple Flow: {alternateAppleFlow ? 'Yes' : 'No'}</div>
          <div className="mt-2">
            <button 
              onClick={() => console.log({
                session,
                status,
                provider,
                cookies: document.cookie.split(';').map(c => c.trim()),
                error: searchParams.get('error'),
                alternateAppleFlow
              })}
              className="text-blue-600 hover:underline"
            >
              Log debug info
            </button>
          </div>
        </div>
      )}
    </div>
  );
}