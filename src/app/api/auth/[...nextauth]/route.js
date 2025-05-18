// app/api/auth/[...nextauth]/route.js
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// Debug logging for setup phase
console.log('NextAuth configuration loading...');
console.log('Environment check:', {
  applIdExists: !!process.env.APPLE_ID,
  appleSecretExists: !!process.env.APPLE_SECRET,
  appleIdValue: process.env.APPLE_ID,
  appleSecretLength: process.env.APPLE_SECRET?.length || 0,
  nextAuthUrl: process.env.NEXTAUTH_URL
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
          response_type: 'code id_token'
        }
      },
    }),
  ],
  // Fix: Custom pages configuration to use your actual sign-in page path
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin'
  },
  // Fix: Proper cookie configuration
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
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
      // Fix: Enhanced jwt callback with better logging and Apple-specific handling
      if (account) {
        console.log(`JWT callback for ${account.provider} authentication`);
        token.provider = account.provider;
        token.providerId = account.providerAccountId;
        
        // Fix: Handle Apple-specific behavior - name is only provided on first sign-in
        if (account.provider === 'apple') {
          // Log the profile for debugging
          if (profile) {
            console.log('Apple profile data received:', 
              JSON.stringify({
                sub: profile.sub,
                email: profile.email,
                emailVerified: profile.email_verified,
                hasName: !!profile.name
              })
            );
            
            // Store name when provided (typically only on first login)
            if (profile.name) {
              const firstName = profile.name.firstName || '';
              const lastName = profile.name.lastName || '';
              token.name = (firstName + ' ' + lastName).trim();
              console.log(`Storing name from Apple profile: ${token.name}`);
            }
          }
        }
      }
      
      // Only fetch role if not already present to avoid repeated DB calls
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
      // Fix: Enhanced signIn callback with better logging and error handling
      console.log(`Sign-in attempt with ${account.provider}`);
      
      // Fix: Special handling for Apple's email behavior
      if (account.provider === 'apple' && !user.email && profile?.email) {
        console.log('Using email from Apple profile');
        user.email = profile.email;
      }
      
      if (!user.email) {
        console.error('User email missing from OAuth provider');
        return false;
      }

      try {
        // Optimize database connection - only establish once
        await dbConnect();
        console.log('Database connected successfully');

        // Quick lookup by email only - simpler query
        const existingUser = await User.findOne({ email: user.email })
          .select('_id role provider providerId name')
          .lean(); // Use lean() for faster queries

        if (existingUser) {
          console.log(`Found existing user with email: ${user.email}`);
          // Set minimal user data and update the DB asynchronously
          user.id = existingUser._id.toString();
          user.role = existingUser.role || 'user';
          
          // Fix: Improved user update logic
          const updateData = {
            lastLogin: new Date(),
            provider: account.provider,
            providerId: account.providerAccountId,
          };
          
          // Only update name if provided and it's not empty
          if (user.name && user.name.trim() !== '') {
            updateData.name = user.name;
          }
          
          // Update in the background without waiting
          User.findByIdAndUpdate(
            existingUser._id,
            { $set: updateData },
            { new: false }
          ).catch(err => console.error('Background user update failed:', err));
        } else {
          console.log(`Creating new user with email: ${user.email}`);
          // Create user with minimal data
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
        // Fix: Better error logging
        console.error('Error in signIn callback:', error);
        
        // Log detailed error for debugging
        if (error.name && error.message) {
          console.error(`${error.name}: ${error.message}`);
          if (error.stack) {
            console.error('Stack trace:', error.stack.split('\n').slice(0, 3).join('\n'));
          }
        }
        
        // Still allow sign in even if DB operations fail
        // This prevents authentication errors due to database issues
        return true;
      }
    },
    
    async redirect({ url, baseUrl }) {
      // Fix: Enhanced redirect callback with better logging
      console.log('Redirect callback:', { url, baseUrl });
      
      // Fix: More robust redirect logic
      if (url.startsWith(baseUrl)) {
        console.log(`Redirecting to same-origin URL: ${url}`);
        return url;
      }
      
      if (url.startsWith('/')) {
        const fullUrl = `${baseUrl}${url}`;
        console.log(`Redirecting to relative path as full URL: ${fullUrl}`);
        return fullUrl;
      }
      
      console.log(`Redirecting to base URL: ${baseUrl}`);
      return baseUrl;
    },
  },
  events: {
    // Fix: Add event handlers for better debugging
    async signIn(message) {
      console.log(`User signed in: ${message.user.email}`);
    },
    async signOut(message) {
      console.log(`User signed out: ${message.token.sub}`);
    },
    async error(message) {
      console.error(`Auth error occurred: ${message}`);
    }
  },
  logger: {
    // Fix: Custom logger for better error tracking
    error(code, metadata) {
      console.error(`[AUTH ERROR] ${code}:`, metadata);
    },
    warn(code) {
      console.warn(`[AUTH WARNING] ${code}`);
    },
    debug(code, metadata) {
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
  debug: true, // Enable for troubleshooting - remember to disable in production later
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

export const config = {
  runtime: 'nodejs', // Keep as nodejs for database operations
};