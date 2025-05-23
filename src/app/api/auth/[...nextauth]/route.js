import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import { createPrivateKey } from 'crypto';
import { SignJWT, importPKCS8 } from 'jose';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// Generate Apple client secret
async function createAppleClientSecret() {
  const privateKey = `-----BEGIN PRIVATE KEY-----
${process.env.APPLE_PRIVATE_KEY}
-----END PRIVATE KEY-----`;

  const ecPrivateKey = await importPKCS8(privateKey, 'ES256');
  
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: process.env.APPLE_KEY_ID })
    .setIssuer(process.env.APPLE_TEAM_ID)
    .setAudience('https://appleid.apple.com')
    .setSubject(process.env.APPLE_ID)
    .setIssuedAt()
    .setExpirationTime('180 days')
    .sign(ecPrivateKey);

  return jwt;
}

// Generate client secret on startup
let appleClientSecret;
(async () => {
  try {
    appleClientSecret = await createAppleClientSecret();
    console.log('Apple client secret generated successfully');
  } catch (error) {
    console.error('Failed to generate Apple client secret:', error);
  }
})();

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID,
      clientSecret: appleClientSecret || '',
      authorization: {
        params: {
          scope: 'email name',
          response_mode: 'form_post',
          response_type: 'code',
        },
      },
      // Apple-specific token request
      token: {
        url: 'https://appleid.apple.com/auth/token',
        async request({ client, params, checks, provider }) {
          const clientSecret = await createAppleClientSecret();
          
          const response = await fetch(provider.token.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: provider.clientId,
              client_secret: clientSecret,
              code: params.code,
              grant_type: 'authorization_code',
              redirect_uri: provider.callbackUrl,
            }).toString(),
          });

          const tokens = await response.json();
          
          if (!response.ok) {
            throw new Error(`Apple token error: ${JSON.stringify(tokens)}`);
          }

          return { tokens };
        },
      },
      // Custom profile parsing
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || null,
          email: profile.email || null,
          image: null,
        };
      },
    }),
  ],
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) {
        console.error('No email provided by OAuth provider');
        return false;
      }

      try {
        await dbConnect();
        
        // Handle Apple's specific behavior
        if (account.provider === 'apple') {
          // Apple only provides user info on first authorization
          const appleUserId = profile?.sub || account.providerAccountId;
          
          // Check if user exists by email or appleUser ID
          let existingUser = await User.findOne({ 
            $or: [
              { email: user.email },
              { appleUser: appleUserId }
            ] 
          });
          
          if (existingUser) {
            // Update last login and any new data
            const updateData = {
              lastLogin: new Date(),
              provider: 'apple',
              providerId: account.providerAccountId,
            };
            
            // Only update name if provided and user doesn't have one
            if (user.name && (!existingUser.name || existingUser.name === 'User')) {
              updateData.name = user.name;
            }
            
            // Set appleUser if not already set
            if (!existingUser.appleUser) {
              updateData.appleUser = appleUserId;
            }
            
            await User.findByIdAndUpdate(existingUser._id, updateData);
            user.id = existingUser._id.toString();
            user.role = existingUser.role;
          } else {
            // Create new user
            const newUser = await User.create({
              email: user.email,
              name: user.name || 'User', // Default name if not provided
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
          // Handle other providers (Google, etc.)
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
              name: user.name || 'User', // Default if not provided
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
    
    async jwt({ token, account, user, profile }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          provider: account.provider,
        };
      }
      
      // Subsequent requests
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
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
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
  
  // Security configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Cookie configuration optimized for Apple Sign In
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900, // 15 mins
      },
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900, // 15 mins
      },
    },
    nonce: {
      name: `next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  
  // Required secret
  secret: process.env.NEXTAUTH_SECRET,
  
  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
  
  // Trust host header in production
  trustHost: process.env.NODE_ENV === 'production',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };