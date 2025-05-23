import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
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

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    {
      id: 'apple',
      name: 'Apple',
      type: 'oauth',
      wellKnown: 'https://appleid.apple.com/.well-known/openid-configuration',
      authorization: {
        params: {
          scope: 'email name',
          response_mode: 'form_post',
          response_type: 'code',
          client_id: process.env.APPLE_ID,
        },
      },
      idToken: true,
      clientId: process.env.APPLE_ID,
      clientSecret: '', // We'll generate this dynamically
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || null,
          email: profile.email || null,
          image: null,
        };
      },
      checks: [], // Disable ALL checks including PKCE
      client: {
        id_token_signed_response_alg: 'RS256',
        token_endpoint_auth_method: 'client_secret_post',
      },
      token: {
        async request(context) {
          const { params, provider } = context;
          
          // Generate client secret for this request
          const client_secret = await createAppleClientSecret();
          
          const response = await fetch('https://appleid.apple.com/auth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code: params.code,
              client_id: process.env.APPLE_ID,
              client_secret,
              redirect_uri: provider.callbackUrl,
            }).toString(),
          });

          const tokens = await response.json();
          
          if (!response.ok) {
            console.error('Apple token error:', tokens);
            throw new Error('Failed to exchange authorization code for tokens');
          }

          return { tokens };
        },
      },
    },
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
  
  // Use default cookie configuration
  useSecureCookies: process.env.NODE_ENV === 'production',
  
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };