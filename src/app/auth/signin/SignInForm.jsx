'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { FcGoogle } from 'react-icons/fc';
import { AiFillApple } from 'react-icons/ai';

const ERROR_MESSAGES = {
  OAuthCallback: 'There was a problem with the sign-in process. Please ensure cookies are enabled.',
  OAuthCallbackError: 'Authentication failed. Cookies may be blocked or browser settings may restrict sign-in.',
  OAuthSignin: 'Could not initiate sign-in with the provider.',
  OAuthAccountNotLinked: 'Please sign in with the same account you used originally.',
  AccessDenied: "You don't have permission to sign in.",
  Verification: 'The verification link may have expired or been used.',
  Configuration: 'There is a server configuration issue.',
  default: 'An error occurred during sign-in. Please try again.',
};

export default function SignInForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState(null);
  const [cookiesEnabled, setCookiesEnabled] = useState(true);
  const [cookieTestPassed, setCookieTestPassed] = useState(false);

  useEffect(() => {
    setCookiesEnabled(navigator.cookieEnabled);
    if (!navigator.cookieEnabled) {
      setError('Cookies are disabled in your browser. Please enable cookies to sign in.');
      return;
    }
    try {
      document.cookie = 'test_cookie=1; Path=/; SameSite=Lax; Secure; Max-Age=60';
      const cookies = document.cookie.split('; ').find(row => row.startsWith('test_cookie='));
      if (cookies) {
        setCookieTestPassed(true);
        document.cookie = 'test_cookie=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      } else {
        setError('Cookies are enabled but cannot be set. Check browser privacy settings (e.g., Safari’s Prevent Cross-Site Tracking).');
      }
    } catch (err) {
      setError('Failed to set cookies. Try disabling private browsing or using a different browser.');
    }

    const errorParam = searchParams.get('error');
    if (errorParam) {
      console.log('Auth error from URL:', errorParam);
      setError(ERROR_MESSAGES[errorParam] || ERROR_MESSAGES.default);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleSignIn = async (providerName) => {
    if (!cookiesEnabled || !cookieTestPassed) {
      setError('Cookies must be enabled and settable to sign in. Check browser settings.');
      return;
    }
    setError('');
    setIsLoading(true);
    setProvider(providerName);
    try {
      console.log(`Initiating sign-in with ${providerName}`, { callbackUrl });
      const result = await signIn(providerName, { callbackUrl, redirect: false });
      if (result?.url) {
        console.log('Sign-in successful, redirecting to:', result.url);
        router.push(result.url);
      } else if (result?.error) {
        console.error('Sign-in result error:', result.error);
        setError(ERROR_MESSAGES[result.error] || ERROR_MESSAGES.default);
      } else {
        console.warn('Sign-in result missing url or error:', result);
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Sign-in error:', err.message);
      setError('Authentication failed. Try a different browser or contact support.');
    } finally {
      setIsLoading(false);
      setProvider(null);
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
    <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-md mx-auto my-12">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" alt="Logo" width={140} height={140} priority />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">Welcome back</h2>
        <p className="mt-2 text-sm text-gray-600">Sign in to continue to your account</p>
      </div>
      {error && (
        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-md">
          <p>{error}</p>
          {(error.includes('problem with the sign-in process') || error.includes('restrict sign-in') || error.includes('cookie')) && (
            <div className="mt-2 text-xs">
              <p>This could be due to:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Browser cookie settings - cookies must be enabled</li>
                <li>Private browsing mode restricting cookies</li>
                <li>Browser cache issues - try clearing cache</li>
                <li>Strict privacy settings (e.g., Safari’s Prevent Cross-Site Tracking)</li>
              </ul>
              <p className="mt-2">Try enabling cookies, disabling private browsing, or using a different browser.</p>
            </div>
          )}
        </div>
      )}
      <div className="mt-8 space-y-4">
        <button
          onClick={() => handleSignIn('google')}
          disabled={isLoading || !cookiesEnabled || !cookieTestPassed}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25] transition-colors disabled:opacity-70"
          aria-label="Sign in with Google"
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
          disabled={isLoading || !cookiesEnabled || !cookieTestPassed}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25] transition-colors disabled:opacity-70"
          aria-label="Sign in with Apple"
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
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-8 p-3 bg-gray-100 rounded text-xs font-mono">
          <div className="font-semibold">Debug Info:</div>
          <div>Page: /auth/signin</div>
          <div>Provider: {provider || 'none'}</div>
          <div>Status: {status}</div>
          <div>Error: {searchParams.get('error') || 'none'}</div>
          <div>CallbackUrl: {callbackUrl}</div>
          <div>Cookies Enabled: {cookiesEnabled ? 'Yes' : 'No'}</div>
          <div>Cookie Test Passed: {cookieTestPassed ? 'Yes' : 'No'}</div>
          <div>Current Cookies: {document.cookie.split('; ').join(', ') || 'none'}</div>
        </div>
      )}
    </div>
  );
}