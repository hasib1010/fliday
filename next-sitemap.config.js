// next-sitemap.config.js - Complete configuration with blog posts
/** @type {import('next-sitemap').IConfig} */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  generateIndexSitemap: true, // Creates sitemap index for large sites
  exclude: [
    '/admin/*',
    '/admin/**',
    '/auth/*',
    '/auth/**', 
    '/checkout/*',
    '/checkout/**',
    '/esim/*',
    '/esim/**',
    '/orders',
    '/orders/*',
    '/api/*',
    '/api/**',
    '/_next/*',
    '/static/*'
  ],
  
  // Split into multiple sitemaps when over 50k URLs
  sitemapSize: 50000,
  
  // Additional paths for all dynamic content
  additionalPaths: async (config) => {
    const paths = [];
    
    try {
      console.log('🔍 Adding static and dynamic paths for sitemap...');
      
      // Add static pages first (based on your actual app structure)
      const staticPages = [
        { path: '/', priority: 1.0, changefreq: 'daily' },
        { path: '/destinations', priority: 0.9, changefreq: 'weekly' },
        { path: '/blog', priority: 0.8, changefreq: 'daily' },
        { path: '/how-it-works', priority: 0.8, changefreq: 'monthly' },
        { path: '/compatibility', priority: 0.7, changefreq: 'monthly' },
        { path: '/contact', priority: 0.6, changefreq: 'monthly' },
        { path: '/support', priority: 0.6, changefreq: 'monthly' },
        { path: '/faq', priority: 0.6, changefreq: 'monthly' },
        { path: '/privacy-policy', priority: 0.3, changefreq: 'yearly' },
        { path: '/terms-of-service', priority: 0.3, changefreq: 'yearly' },
      ];
      
      staticPages.forEach(page => {
        paths.push({
          loc: page.path,
          lastmod: new Date().toISOString(),
          priority: page.priority,
          changefreq: page.changefreq
        });
      });
      
      console.log(`✅ Added ${staticPages.length} static pages`);
      
      // Fetch locations data (countries & regions)
      const locationsResponse = await fetch(`${siteUrl}/api/esim/locations?skipCache=true`);
      
      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json();
        console.log(`✅ Fetched locations data:`, {
          countries: locationsData.data?.countries?.length || 0,
          regions: locationsData.data?.regions?.length || 0
        });
        
        if (locationsData.success) {
          // Add country destination paths
          const countries = locationsData.data.countries || [];
          countries.forEach(country => {
            if (country.code && country.name) {
              paths.push({
                loc: `/destinations/country/${country.code.toLowerCase()}`,
                lastmod: new Date().toISOString(),
                priority: 0.8,
                changefreq: 'weekly'
              });
            }
          });
          
          // Add region destination paths
          const regions = locationsData.data.regions || [];
          regions.forEach(region => {
            if ((region.code || region.slug) && region.name) {
              const path = region.slug 
                ? `/destinations/slug/${region.slug}`
                : `/destinations/region/${region.code.toLowerCase()}`;
              
              paths.push({
                loc: path,
                lastmod: new Date().toISOString(),
                priority: 0.7,
                changefreq: 'weekly'
              });
            }
          });
          
          // Add global destinations
          regions
            .filter(region => region.name?.toLowerCase().includes('global'))
            .forEach(region => {
              paths.push({
                loc: `/destinations/global/${region.code.toLowerCase()}`,
                lastmod: new Date().toISOString(),
                priority: 0.8,
                changefreq: 'weekly'
              });
            });
        }
      } else {
        console.warn(`⚠️  Locations API returned ${locationsResponse.status}`);
      }
      
      // Fetch blog posts
      try {
        const blogsResponse = await fetch(`${siteUrl}/api/blogs`, {
          cache: 'no-store'
        });
        
        if (blogsResponse.ok) {
          const blogPosts = await blogsResponse.json();
          console.log(`✅ Fetched blog posts: ${blogPosts.length} posts`);
          
          // Add individual blog post paths
          blogPosts.forEach(post => {
            if (post.slug && post.title) {
              // Determine priority based on featured status and recency
              let priority = 0.6;
              if (post.featured) {
                priority = 0.8; // Featured posts get higher priority
              }
              
              // Recent posts get slightly higher priority
              const postDate = new Date(post.date);
              const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
              if (postDate > thirtyDaysAgo) {
                priority += 0.1;
              }
              
              paths.push({
                loc: `/blog/${post.slug}`,
                lastmod: new Date(post.updatedAt || post.date).toISOString(),
                priority: Math.min(priority, 0.9), // Cap at 0.9
                changefreq: 'monthly'
              });
            }
          });
          
          // Add blog category pages (if you have them)
          const categories = [...new Set(blogPosts.map(post => post.category).filter(Boolean))];
          categories.forEach(category => {
            if (category && category !== 'All') {
              paths.push({
                loc: `/blog/category/${category.toLowerCase().replace(/\s+/g, '-')}`,
                lastmod: new Date().toISOString(),
                priority: 0.5,
                changefreq: 'weekly'
              });
            }
          });
          
        } else {
          console.warn(`⚠️  Blogs API returned ${blogsResponse.status}`);
        }
      } catch (error) {
        console.warn('⚠️  Could not fetch blog posts:', error.message);
      }
      
      // Fetch packages data (optional)
      try {
        const packagesResponse = await fetch(`${siteUrl}/api/esim/packages`);
        
        if (packagesResponse.ok) {
          const packagesData = await packagesResponse.json();
          console.log(`✅ Fetched packages data: ${packagesData.data?.length || 0} packages`);
          
          if (packagesData.success && packagesData.data) {
            packagesData.data.forEach(pkg => {
              if (pkg.packageCode && pkg.name) {
                paths.push({
                  loc: `/packages/${pkg.packageCode}`,
                  lastmod: new Date(pkg.updatedAt || new Date()).toISOString(),
                  priority: 0.6,
                  changefreq: 'weekly'
                });
              }
            });
          }
        }
      } catch (error) {
        console.log('📦 Packages API not available yet (this is fine for development)');
      }
      
    } catch (error) {
      console.error('❌ Error fetching dynamic paths:', error.message);
      console.log('💡 Make sure your development server is running');
    }
    
    console.log(`📊 Generated ${paths.length} dynamic paths for sitemap`);
    return paths;
  },

  // Transform function to customize each URL
  transform: async (config, path) => {
    let priority = 0.5;
    let changefreq = 'monthly';

    // Homepage - highest priority
    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    }
    // Main category pages
    else if (['/destinations', '/plans', '/packages'].includes(path)) {
      priority = 0.9;
      changefreq = 'weekly';
    }
    // Blog main page
    else if (path === '/blog') {
      priority = 0.8;
      changefreq = 'daily';
    }
    // Important feature pages
    else if (['/how-it-works', '/how-to-install', '/install-esim', '/pricing'].includes(path)) {
      priority = 0.8;
      changefreq = 'monthly';
    }
    // Device and coverage pages
    else if (['/compatible-devices', '/device-compatibility', '/coverage'].includes(path)) {
      priority = 0.7;
      changefreq = 'monthly';
    }
    // Country destinations (high search volume for travel eSIM)
    else if (path.includes('/destinations/country/')) {
      priority = 0.8;
      changefreq = 'weekly';
    }
    // Global destinations
    else if (path.includes('/destinations/global/')) {
      priority = 0.8;
      changefreq = 'weekly';
    }
    // Featured blog posts (priority set in additionalPaths based on featured status)
    else if (path.includes('/blog/') && !path.includes('/blog/category/')) {
      priority = 0.6; // Default, overridden by additionalPaths for featured posts
      changefreq = 'monthly';
    }
    // Blog category pages
    else if (path.includes('/blog/category/')) {
      priority = 0.5;
      changefreq = 'weekly';
    }
    // Region destinations
    else if (path.includes('/destinations/region/') || path.includes('/destinations/slug/')) {
      priority = 0.7;
      changefreq = 'weekly';
    }
    // Individual packages
    else if (path.includes('/packages/')) {
      priority = 0.6;
      changefreq = 'weekly';
    }
    // Support pages
    else if (['/help', '/support', '/faq', '/contact'].includes(path)) {
      priority = 0.6;
      changefreq = 'monthly';
    }
    // About page
    else if (path === '/about') {
      priority = 0.6;
      changefreq = 'monthly';
    }
    // Legal pages
    else if (['/privacy', '/privacy-policy', '/terms', '/terms-of-service', '/legal'].includes(path)) {
      priority = 0.3;
      changefreq = 'yearly';
    }

    return {
      loc: path,
      lastmod: new Date().toISOString(),
      priority,
      changefreq,
    };
  },

  // Robots.txt configuration
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/profile/',
          '/api/',
          '/auth/',
          '/checkout/',
          '/checkout/success',
          '/checkout/cancel',
          '/temp/',
          '/_next/',
          '/static/'
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/dashboard/', '/profile/', '/api/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/admin/', '/dashboard/', '/profile/', '/api/'],
      }
    ],
    additionalSitemaps: [
      // If you want to create separate sitemaps later
      // `${siteUrl}/blog-sitemap.xml`,
    ],
  },
};