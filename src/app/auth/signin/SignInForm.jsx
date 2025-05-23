'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { FcGoogle } from 'react-icons/fc';
import { AiFillApple } from 'react-icons/ai';

const ERROR_MESSAGES = {
  OAuthCallback: 'Sign-in failed. Try again or contact support.',
  OAuthCallbackError: 'Authentication failed. Try again or contact support.',
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

  useEffect(() => {
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
    setError('');
    setIsLoading(true);
    setProvider(providerName);
    
    try {
      console.log(`Initiating sign-in with ${providerName}`, { callbackUrl });
      
      // For OAuth providers, we should use redirect: true to handle the OAuth flow properly
      // The redirect: false option doesn't work well with OAuth providers like Apple
      const result = await signIn(providerName, {
        callbackUrl,
        redirect: true, // Changed to true for proper OAuth flow
      });
      
      // With redirect: true, the code below won't execute as the page redirects
      // Errors will be handled when redirected back to the signin page with error params
      
    } catch (err) {
      console.error('Sign-in error:', err);
      // Only show error if there's an actual exception
      setError('Unable to connect to the authentication service. Please try again.');
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
          <p className="font-medium">{error}</p>
          {/* Only show detailed error info for OAuth callback errors */}
          {searchParams.get('error') && (
            <div className="mt-2 text-xs">
              <p>This could be due to:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Browser cache issues - try clearing cache</li>
                <li>Private browsing mode - try disabling</li>
                <li>Strict privacy settings (e.g., Safari's Prevent Cross-Site Tracking)</li>
                <li>Popup blockers preventing the authentication window</li>
              </ul>
              <p className="mt-2">Try a different browser or contact support if the issue persists.</p>
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
        </div>
      )}
    </div>
  );
}