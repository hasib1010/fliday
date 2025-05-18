// app/api/auth/[...nextauth]/route.js
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// Debug logging for initialization
console.log('NextAuth configuration loading...');
console.log('Environment check:', {
  applIdExists: !!process.env.APPLE_ID,
  appleSecretExists: !!process.env.APPLE_SECRET,
  appleIdValue: process.env.APPLE_ID,
  appleSecretLength: process.env.APPLE_SECRET?.length || 0,
  nextAuthUrl: process.env.NEXTAUTH_URL || '(not set)',
  nodeEnv: process.env.NODE_ENV
});

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_SECRET,
      wellKnown: 'https://appleid.apple.com/.well-known/openid-configuration',
      authorization: {
        params: {
          scope: 'name email',
          response_mode: 'form_post',
        }
      },
      // Fix for PKCE issue: Only use state checking, not PKCE
      checks: ['state'],
    }),
  ],
  // Custom pages configuration pointing to your sign-in page
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  // Comprehensive cookie configuration for better cookie handling
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    pkceCodeVerifier: {
      name: 'next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15 // 15 minutes in seconds
      }
    }
  },
  callbacks: {
    async session({ session, token }) {
      // Add user ID to session
      if (token.sub) {
        session.user.id = token.sub;
      }
      
      // Add user role to session
      if (token.role) {
        session.user.role = token.role;
      }
      
      return session;
    },
    
    async jwt({ token, account, user, profile }) {
      // Log detailed information when creating/updating JWT
      if (account) {
        console.log(`JWT callback for ${account.provider} sign-in`);
        
        // Store provider information in token
        token.provider = account.provider;
        token.providerId = account.providerAccountId;
        
        // Special handling for Apple profile data
        if (account.provider === 'apple' && profile) {
          // Log profile data for debugging
          console.log('Apple profile data received:', {
            hasEmail: !!profile.email,
            hasName: !!profile.name,
            sub: profile.sub
          });
          
          // Store name when available (Apple only provides name on first login)
          if (profile.name) {
            const firstName = profile.name.firstName || '';
            const lastName = profile.name.lastName || '';
            token.name = (firstName + ' ' + lastName).trim();
            console.log(`Storing name from Apple profile: ${token.name}`);
          }
        }
      }
      
      // Only fetch role if not already present
      if (user && user.id && !token.role) {
        try {
          token.role = user.role || 'user'; // Default to 'user' if not set
        } catch (error) {
          console.error('Error setting user role in token:', error);
        }
      }
      
      return token;
    },
    
    async signIn({ user, account, profile }) {
      console.log(`Sign-in attempt with ${account.provider}`);
      
      // Special handling for Apple (which might not provide email on subsequent logins)
      if (account.provider === 'apple' && !user.email && profile?.email) {
        console.log('Using email from Apple profile');
        user.email = profile.email;
      }
      
      // Validate that we have an email
      if (!user.email) {
        console.error('User email missing from OAuth provider');
        return false;
      }

      try {
        // Connect to database
        await dbConnect();
        console.log('Database connected successfully');

        // Look up existing user by email
        const existingUser = await User.findOne({ email: user.email })
          .select('_id role provider providerId name')
          .lean();

        if (existingUser) {
          console.log(`Found existing user with email: ${user.email}`);
          
          // Set user data
          user.id = existingUser._id.toString();
          user.role = existingUser.role || 'user';
          
          // Prepare update data
          const updateData = {
            lastLogin: new Date(),
            provider: account.provider,
            providerId: account.providerAccountId,
          };
          
          // Only update name if provided and not empty
          if (user.name && user.name.trim() !== '') {
            updateData.name = user.name;
          }
          
          // Update user in background
          User.findByIdAndUpdate(
            existingUser._id,
            { $set: updateData },
            { new: false }
          ).catch(err => console.error('Background user update failed:', err));
        } else {
          console.log(`Creating new user with email: ${user.email}`);
          
          // Create new user
          const newUser = await User.create({
            name: user.name || 'Unnamed User',
            email: user.email,
            provider: account.provider,
            providerId: account.providerAccountId,
            role: 'user',
            lastLogin: new Date(),
          });
          
          user.id = newUser._id.toString();
          user.role = 'user';
          console.log(`New user created with ID: ${user.id}`);
        }
        
        console.log('Sign-in callback completed successfully');
        return true;
      } catch (error) {
        // Detailed error logging
        console.error('Error in signIn callback:', error);
        
        if (error.name && error.message) {
          console.error(`${error.name}: ${error.message}`);
          if (error.stack) {
            console.error('Stack trace:', error.stack.split('\n').slice(0, 3).join('\n'));
          }
        }
        
        // Allow sign-in even if DB operations fail to prevent authentication failures
        // due to database issues
        return true;
      }
    },
    
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback:', { url, baseUrl });
      
      // Enhanced redirect logic
      if (url.startsWith(baseUrl)) {
        console.log(`Redirecting to same-origin URL: ${url}`);
        return url;
      }
      
      if (url.startsWith('/')) {
        const fullUrl = `${baseUrl}${url}`;
        console.log(`Redirecting to relative path as full URL: ${fullUrl}`);
        return fullUrl;
      }
      
      console.log(`Redirecting to baseUrl: ${baseUrl}`);
      return baseUrl;
    },
  },
  events: {
    // Event handlers for logging authentication events
    async signIn(message) {
      console.log(`User signed in: ${message.user.email}`);
    },
    async signOut(message) {
      console.log(`User signed out: ${message.token?.sub || 'Unknown user'}`);
    },
    async createUser(message) {
      console.log(`User created: ${message.user.email}`);
    },
    async linkAccount(message) {
      console.log(`Account linked: ${message.account.provider} for ${message.user.email}`);
    },
    async session(message) {
      // Don't log every session to avoid flooding logs
      if (process.env.DEBUG_AUTH === 'true') {
        console.log(`Session accessed: ${message.token?.sub || 'Unknown user'}`);
      }
    },
    async error(message) {
      console.error(`Auth error occurred:`, message);
    }
  },
  logger: {
    // Custom logger for detailed error tracking
    error(code, metadata) {
      console.error(`[AUTH ERROR] ${code}:`, metadata);
      
      // Special handling for common errors
      if (code === 'oauth_callback_error') {
        console.error('OAuth callback error details:', {
          provider: metadata?.providerId,
          error: metadata?.error?.message || metadata?.error,
          stack: metadata?.error?.stack?.split('\n').slice(0, 3).join('\n'),
          cause: 'This could be related to PKCE, cookies, or OAuth configuration'
        });
      }
    },
    warn(code) {
      console.warn(`[AUTH WARNING] ${code}`);
    },
    debug(code, metadata) {
      // Only log debug messages if explicitly enabled
      if (process.env.NEXTAUTH_DEBUG === 'true') {
        console.log(`[AUTH DEBUG] ${code}:`, metadata);
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Enable debug mode for now, disable in production later
  debug: process.env.NODE_ENV !== 'production' || process.env.NEXTAUTH_DEBUG === 'true',
  // Improve JWT encoding/decoding
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

export const config = {
  runtime: 'nodejs',
};