import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// Generate Apple client secret
function createAppleClientSecret() {
  const privateKey = process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n');
  
  const formattedKey = privateKey.includes('BEGIN PRIVATE KEY') 
    ? privateKey 
    : `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;

  const now = Math.floor(Date.now() / 1000);
  const expirationTime = now + 86400 * 180; // 180 days

  const claims = {
    iss: process.env.APPLE_TEAM_ID,
    iat: now,
    exp: expirationTime,
    aud: 'https://appleid.apple.com',
    sub: process.env.APPLE_ID,
  };

  return jwt.sign(claims, formattedKey, {
    algorithm: 'ES256',
    keyid: process.env.APPLE_KEY_ID,
  });
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID,
      clientSecret: createAppleClientSecret(),
      authorization: {
        params: {
          scope: 'email name',
          response_mode: 'form_post',
          response_type: 'code',
        },
      },
      // IMPORTANT: Disable all checks
      checks: [],
      // Override the protection to bypass state check
      protection: 'none',
    }),
  ],
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn callback:', { 
        provider: account.provider, 
        email: user.email,
        hasProfile: !!profile 
      });

      if (!user.email) {
        console.error('No email provided by OAuth provider');
        return false;
      }

      try {
        await dbConnect();
        
        if (account.provider === 'apple') {
          const appleUserId = profile?.sub || account.providerAccountId;
          
          let existingUser = await User.findOne({ 
            $or: [
              { email: user.email },
              { appleUser: appleUserId }
            ] 
          });
          
          if (existingUser) {
            const updateData = {
              lastLogin: new Date(),
              provider: 'apple',
              providerId: account.providerAccountId,
            };
            
            if (user.name && (!existingUser.name || existingUser.name === 'User')) {
              updateData.name = user.name;
            }
            
            if (!existingUser.appleUser) {
              updateData.appleUser = appleUserId;
            }
            
            await User.findByIdAndUpdate(existingUser._id, updateData);
            user.id = existingUser._id.toString();
            user.role = existingUser.role;
          } else {
            const newUser = await User.create({
              email: user.email,
              name: user.name || 'User',
              provider: 'apple',
              providerId: account.providerAccountId,
              appleUser: appleUserId,
              role: 'user',
              lastLogin: new Date(),
            });
            user.id = newUser._id.toString();
            user.role = 'user';
          }
        } else {
          const existingUser = await User.findOne({ email: user.email });
          
          if (existingUser) {
            await User.findByIdAndUpdate(existingUser._id, {
              lastLogin: new Date(),
              provider: account.provider,
              providerId: account.providerAccountId,
            });
            user.id = existingUser._id.toString();
            user.role = existingUser.role;
          } else {
            const newUser = await User.create({
              name: user.name || 'User',
              email: user.email,
              provider: account.provider,
              providerId: account.providerAccountId,
              role: 'user',
              lastLogin: new Date(),
            });
            user.id = newUser._id.toString();
            user.role = 'user';
          }
        }
        
        return true;
      } catch (error) {
        console.error('SignIn error:', error);
        return false;
      }
    },
    
    async jwt({ token, account, user }) {
      if (account && user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          provider: account.provider,
        };
      }
      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.provider = token.provider;
      }
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  
  events: {
    async signIn(message) {
      console.log('User signed in:', message.user.email);
    },
    async signOut(message) {
      console.log('User signed out');
    },
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  
  // Override cookies to ensure state cookie works
  cookies: {
    state: {
      name: 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'none', // Allow cross-site for form_post
        path: '/',
        secure: true, // Always secure for sameSite: none
        maxAge: 900, // 15 minutes
      },
    },
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug to see what's happening
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };