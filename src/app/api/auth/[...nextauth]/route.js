import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

console.log('NextAuth configuration loading...', {
  googleClientIdExists: !!process.env.GOOGLE_CLIENT_ID,
  appleIdExists: !!process.env.APPLE_ID,
  appleSecretExists: !!process.env.APPLE_SECRET,
  nextAuthUrl: process.env.NEXTAUTH_URL || '(not set)',
  nodeEnv: process.env.NODE_ENV,
});

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
    }),
    // Fallback provider first for testing
    AppleProvider({
      id: 'apple-fallback',
      name: 'Apple',
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_SECRET,
      wellKnown: 'https://appleid.apple.com/.well-known/openid-configuration',
      authorization: {
        params: {
          scope: 'name email',
          response_mode: 'form_post',
        },
      },
      checks: [], // No PKCE or state
      profile(profile) {
        console.log('Apple fallback profile received:', {
          sub: profile.sub,
          email: profile.email,
          name: profile.name,
        });
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name
            ? `${profile.name.firstName || ''} ${profile.name.lastName || ''}`.trim()
            : null,
        };
      },
    }),
    AppleProvider({
      id: 'apple',
      name: 'Apple (PKCE)',
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_SECRET,
      wellKnown: 'https://appleid.apple.com/.well-known/openid-configuration',
      authorization: {
        params: {
          scope: 'name email',
          response_mode: 'form_post',
        },
      },
      checks: ['pkce'],
      profile(profile) {
        console.log('Apple PKCE profile received:', {
          sub: profile.sub,
          email: profile.email,
          name: profile.name,
        });
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name
            ? `${profile.name.firstName || ''} ${profile.name.lastName || ''}`.trim()
            : null,
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
        maxAge: 30 * 24 * 60 * 60,
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
        maxAge: 15 * 60,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
        maxAge: 15 * 60,
      },
    },
    pkce: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
        domain: '.fliday.com', // Support subdomains
        maxAge: 15 * 60,
      },
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
        domain: '.fliday.com',
        maxAge: 15 * 60,
      },
    },
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      if (token.role) {
        session.user.role = token.role;
      }
      return session;
    },
    async jwt({ token, account, user, profile }) {
      if (account) {
        console.log(`JWT callback for ${account.provider} sign-in`, {
          providerId: account.providerAccountId,
          hasEmail: !!user?.email,
          hasName: !!user?.name,
        });
        token.provider = account.provider;
        token.providerId = account.providerAccountId;
        if (account.provider.includes('apple') && profile) {
          token.name = user.name;
        }
      }
      if (user?.id && !token.role) {
        try {
          token.role = user.role || 'user';
        } catch (error) {
          console.error('Error setting user role in token:', error.message);
        }
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      console.log(`Sign-in attempt with ${account.provider}`, {
        email: user.email,
        providerId: account.providerAccountId,
      });
      if (!user.email) {
        console.error('User email missing from OAuth provider');
        return false;
      }
      try {
        await dbConnect();
        console.log('Database connected successfully');
        const existingUser = await User.findOne({ email: user.email })
          .select('_id role provider providerId name')
          .lean();
        if (existingUser) {
          console.log(`Found existing user with email: ${user.email}`);
          user.id = existingUser._id.toString();
          user.role = existingUser.role || 'user';
          const updateData = {
            lastLogin: new Date(),
            provider: account.provider,
            providerId: account.providerAccountId,
          };
          if (user.name && user.name.trim() !== '') {
            updateData.name = user.name;
          }
          User.findByIdAndUpdate(existingUser._id, { $set: updateData }, { new: false })
            .catch(err => console.error('Background user update failed:', err));
        } else {
          console.log(`Creating new user with email: ${user.email}`);
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
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error.message);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback:', { url, baseUrl });
      const parsedUrl = new URL(url, baseUrl);
      const callbackUrl = parsedUrl.searchParams.get('callbackUrl') || parsedUrl.pathname;
      console.log('Resolved callbackUrl:', callbackUrl);
      if (callbackUrl.startsWith('/') && callbackUrl !== '/auth/signin' && callbackUrl !== '/auth/error') {
        return `${baseUrl}${callbackUrl}`;
      }
      if (callbackUrl.startsWith(baseUrl) && !callbackUrl.includes('/auth/signin') && !callbackUrl.includes('/auth/error')) {
        return callbackUrl;
      }
      return baseUrl;
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token?.sub || 'Unknown user'}`);
    },
    async createUser({ user }) {
      console.log(`User created: ${user.email}`);
    },
    async linkAccount({ user, account }) {
      console.log(`Account linked: ${account.provider} for ${user.email}`);
    },
    async error(message) {
      console.error('Auth error occurred:', message);
    },
  },
  logger: {
    error(code, metadata) {
      console.error(`[AUTH ERROR] ${code}:`, metadata);
      if (code === 'oauth_callback_error') {
        console.error('OAuth callback error details:', {
          provider: metadata?.providerId,
          error: metadata?.error?.message,
          stack: metadata?.error?.stack?.split('\n').slice(0, 3).join('\n'),
          cookies: metadata?.cookies || 'not available',
          callbackUrl: metadata?.callbackUrl || 'not available',
          requestCookies: metadata?.request?.cookies || 'not available',
          setCookieHeaders: metadata?.response?.headers?.['set-cookie'] || 'not available',
        });
      }
    },
    warn(code) {
      console.warn(`[AUTH WARNING] ${code}`);
    },
    debug(code, metadata) {
      if (process.env.NEXTAUTH_DEBUG === 'true') {
        console.log(`[AUTH DEBUG] ${code}:`, metadata);
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  debug: process.env.NEXTAUTH_DEBUG === 'true',
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

export const config = {
  runtime: 'nodejs',
};