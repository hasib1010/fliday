import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Remove unnecessary OAuth scopes/permissions to speed up auth
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_SECRET,
    }),
  ],
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
    async jwt({ token, account, user }) {
      // Persist OAuth provider details - keep this minimal
      if (account) {
        token.provider = account.provider;
        token.providerId = account.providerAccountId;
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
    async signIn({ user, account }) {
      if (!user.email) {
        console.error('User email missing from OAuth provider');
        return false;
      }

      try {
        // Optimize database connection - only establish once
        await dbConnect();

        // Quick lookup by email only - simpler query
        const existingUser = await User.findOne({ email: user.email })
          .select('_id role provider providerId')
          .lean(); // Use lean() for faster queries

        if (existingUser) {
          // Set minimal user data and update the DB asynchronously
          user.id = existingUser._id.toString();
          user.role = existingUser.role || 'user';
          
          // Update in the background without waiting
          User.findByIdAndUpdate(
            existingUser._id,
            {
              $set: {
                lastLogin: new Date(),
                provider: account.provider,
                providerId: account.providerAccountId,
              },
            },
            { new: false }
          ).catch(err => console.error('Background user update failed:', err));
        } else {
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
        }
        
        return true;
      } catch (error) {
        // Log error but don't fail the auth
        console.error('Error in signIn callback:', error);
        return true; // Still allow sign in even if DB operations fail
      }
    },
    async redirect({ url, baseUrl }) {
      // Simplified redirect logic
      if (url.startsWith(baseUrl) || url.startsWith('/')) {
        return url;
      }
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: false, // Disable debug mode in production
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Add Edge runtime configuration if you're on Next.js 13+
export const config = {
  runtime: 'nodejs', // Keep as nodejs for database operations, but set maxDuration
}