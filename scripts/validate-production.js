// scripts/validate-production.js - Validate sitemap in production
const https = require('https');
const http = require('http');

async function validateProductionSitemap(domain = 'fliday.com') {
  console.log(`🌐 Validating production sitemap for ${domain}...\n`);
  
  const baseUrl = `https://${domain}`;
  
  // Test sitemap files
  const sitemapTests = [
    '/sitemap.xml',
    '/robots.txt'
  ];
  
  console.log('📂 Testing sitemap files...');
  
  for (const path of sitemapTests) {
    try {
      const url = `${baseUrl}${path}`;
      const response = await fetch(url);
      const content = await response.text();
      
      let analysis = {
        file: path,
        url: url,
        status: response.status,
        size: content.length,
        success: response.ok
      };
      
      if (path.includes('sitemap') && response.ok) {
        analysis.urls = (content.match(/<url>/g) || []).length;
        analysis.sitemaps = (content.match(/<sitemap>/g) || []).length;
        
        // Check if URLs use HTTPS
        const httpUrls = (content.match(/http:\/\//g) || []).length;
        const httpsUrls = (content.match(/https:\/\//g) || []).length;
        analysis.urlProtocol = {
          https: httpsUrls,
          http: httpUrls,
          secure: httpUrls === 0
        };
        
        // Check for your domain
        const domainMatches = (content.match(new RegExp(domain, 'g')) || []).length;
        analysis.correctDomain = domainMatches > 0;
        
        // Sample URLs
        const urlMatches = content.match(/<loc>(.*?)<\/loc>/g) || [];
        analysis.sampleUrls = urlMatches.slice(0, 5).map(match => 
          match.replace(/<\/?loc>/g, '')
        );
      }
      
      if (path.includes('robots') && response.ok) {
        analysis.hasSitemapReference = content.includes('Sitemap:');
        analysis.allowsGooglebot = content.includes('User-agent: *') || content.includes('Allow: /');
      }
      
      console.log(`${response.ok ? '✅' : '❌'} ${path}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Size: ${Math.round(content.length / 1024)}KB`);
      
      if (analysis.urls) {
        console.log(`   URLs: ${analysis.urls}`);
        console.log(`   Protocol: ${analysis.urlProtocol.secure ? '✅ HTTPS' : '❌ Mixed/HTTP'}`);
        console.log(`   Domain: ${analysis.correctDomain ? '✅ Correct' : '❌ Wrong domain'}`);
        
        if (analysis.sampleUrls.length > 0) {
          console.log('   Sample URLs:');
          analysis.sampleUrls.forEach(url => {
            console.log(`     • ${url}`);
          });
        }
      }
      
      if (analysis.hasSitemapReference !== undefined) {
        console.log(`   Sitemap ref: ${analysis.hasSitemapReference ? '✅' : '❌'}`);
        console.log(`   Allows bots: ${analysis.allowsGooglebot ? '✅' : '❌'}`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`❌ ${path}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
  
  // Test key pages
  console.log('🔍 Testing key pages...');
  
  const keyPages = [
    '/',
    '/destinations',
    '/blog',
    '/how-it-works',
    '/contact',
    '/compatibility'
  ];
  
  for (const page of keyPages) {
    try {
      const url = `${baseUrl}${page}`;
      const response = await fetch(url);
      
      console.log(`${response.ok ? '✅' : '❌'} ${page} (${response.status})`);
      
      if (!response.ok) {
        console.log(`   URL: ${url}`);
      }
    } catch (error) {
      console.log(`❌ ${page} (Error: ${error.message})`);
    }
  }
  
  // Test API endpoints
  console.log('\n📡 Testing API endpoints...');
  
  const apiEndpoints = [
    '/api/blogs',
    '/api/esim/locations'
  ];
  
  for (const endpoint of apiEndpoints) {
    try {
      const url = `${baseUrl}${endpoint}`;
      const response = await fetch(url);
      
      console.log(`${response.ok ? '✅' : '❌'} ${endpoint} (${response.status})`);
      
      if (response.ok) {
        try {
          const data = await response.json();
          if (endpoint.includes('blogs')) {
            console.log(`   Blog posts: ${Array.isArray(data) ? data.length : 'Invalid format'}`);
          } else if (endpoint.includes('locations')) {
            console.log(`   Countries: ${data.data?.countries?.length || 0}`);
            console.log(`   Regions: ${data.data?.regions?.length || 0}`);
          }
        } catch (e) {
          console.log(`   Response: Not JSON`);
        }
      }
    } catch (error) {
      console.log(`❌ ${endpoint} (Error: ${error.message})`);
    }
  }
  
  // Google Search Console submission guide
  console.log('\n📋 Next Steps:');
  console.log('1. Google Search Console:');
  console.log(`   • Add property: ${baseUrl}`);
  console.log(`   • Submit sitemap: ${baseUrl}/sitemap.xml`);
  console.log('   • Monitor indexing status');
  
  console.log('\n2. Bing Webmaster Tools:');
  console.log(`   • Add site: ${baseUrl}`);
  console.log(`   • Submit sitemap: ${baseUrl}/sitemap.xml`);
  
  console.log('\n3. Monitoring:');
  console.log('   • Check Google Search Console weekly');
  console.log('   • Monitor Core Web Vitals');
  console.log('   • Track keyword rankings for eSIM + country terms');
  
  console.log('\n✨ Production validation complete!');
}

// Google Search Console verification helper
function generateVerificationCode() {
  console.log('\n🔧 Google Search Console Verification:');
  console.log('1. Go to: https://search.google.com/search-console');
  console.log('2. Add your property (URL prefix)');
  console.log('3. Choose "HTML tag" verification');
  console.log('4. Copy the content value from the meta tag');
  console.log('5. Add to your app/layout.js metadata:');
  console.log(`
// app/layout.js
export const metadata = {
  // ... existing metadata
  verification: {
    google: 'YOUR_VERIFICATION_CODE_HERE',
  },
};`);
  console.log('6. Deploy to production');
  console.log('7. Click "Verify" in Google Search Console');
}

// Run validation
async function main() {
  const args = process.argv.slice(2);
  const domain = args[0] || 'fliday.com';
  
  if (args.includes('--help')) {
    console.log('Usage: node scripts/validate-production.js [domain]');
    console.log('Example: node scripts/validate-production.js fliday.com');
    return;
  }
  
  if (args.includes('--verification')) {
    generateVerificationCode();
    return;
  }
  
  try {
    // Use dynamic import for fetch in Node.js
    global.fetch = (await import('node-fetch')).default;
    await validateProductionSitemap(domain);
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('1. Your site is deployed and accessible');
    console.log('2. Sitemap generation completed during build');
    console.log('3. No firewall blocking the requests');
    console.log('\n📞 Try testing manually:');
    console.log(`   curl https://${domain}/sitemap.xml`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateProductionSitemap };