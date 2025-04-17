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
      
      // Add user role to session if needed
      if (token.role) {
        session.user.role = token.role;
      }
      
      return session;
    },
    async jwt({ token, account, user }) {
      // Persist OAuth provider details
      if (account) {
        token.provider = account.provider;
        token.providerId = account.providerAccountId;
      }
      
      // If it's a sign-in, fetch user role from database and add to token
      if (user && user.id) {
        try {
          await dbConnect();
          const dbUser = await User.findById(user.id);
          if (dbUser) {
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
      
      return token;
    },
    async signIn({ user, account }) {
      try {
        await dbConnect();

        // Check if user exists
        let existingUser = await User.findOne({
          $or: [
            { email: user.email },
            { providerId: account.providerAccountId, provider: account.provider },
          ],
        });

        if (existingUser) {
          // Update existing user
          await User.findByIdAndUpdate(
            existingUser._id,
            {
              $set: {
                lastLogin: new Date(),
                image: user.image || existingUser.image,
                provider: account.provider,
                providerId: account.providerAccountId,
              },
            }
          );
        } else {
          // Create new user
          existingUser = await User.create({
            name: user.name || 'Unnamed User',
            email: user.email,
            image: user.image,
            provider: account.provider,
            providerId: account.providerAccountId,
            role: 'user', // Default role
            lastLogin: new Date(),
          });
        }

        // Ensure user ID is available
        user.id = existingUser._id.toString();
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error.stack);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      // Handle the callbackUrl parameter
      if (url.startsWith(baseUrl)) {
        const urlObj = new URL(url);
        const callbackUrl = urlObj.searchParams.get('callbackUrl');
        
        // If there's a callbackUrl and no error, use it
        if (callbackUrl && !urlObj.searchParams.get('error')) {
          return callbackUrl;
        }
        
        // If there's an error, go to a custom error page or homepage
        if (urlObj.searchParams.get('error')) {
          return `${baseUrl}/auth-error?error=${urlObj.searchParams.get('error')}`;
        }
        
        return url;
      }
      
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Remove custom pages to use default NextAuth pages for now
  // You can create custom pages later once the basic auth flow works
  /*
  pages: {
    signIn: '/checkout',
    error: '/checkout',
  },
  */
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };