// scripts/test-sitemap-dev.js - Updated with blog testing
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function testDevelopmentSitemap() {
  console.log('🧪 Testing Fliday sitemap with blog posts in development...\n');

  // Check if development server is running
  console.log('🔍 Checking if development server is running...');
  try {
    const { default: fetch } = await import('node-fetch');
    
    // Test locations API
    const locationsCheck = await fetch('http://localhost:3000/api/esim/locations?skipCache=true');
    if (locationsCheck.ok) {
      const locationsData = await locationsCheck.json();
      console.log('✅ Locations API working');
      console.log(`   └─ Countries: ${locationsData.data?.countries?.length || 0}`);
      console.log(`   └─ Regions: ${locationsData.data?.regions?.length || 0}`);
    } else {
      console.log('❌ Locations API not responding properly');
    }
    
    // Test blog API
    const blogCheck = await fetch('http://localhost:3000/api/blogs');
    if (blogCheck.ok) {
      const blogData = await blogCheck.json();
      console.log('✅ Blog API working');
      console.log(`   └─ Total posts: ${blogData.length || 0}`);
      console.log(`   └─ Featured posts: ${blogData.filter(post => post.featured).length || 0}`);
      
      // Show categories
      const categories = [...new Set(blogData.map(post => post.category).filter(Boolean))];
      console.log(`   └─ Categories: ${categories.join(', ')}`);
    } else {
      console.log('❌ Blog API not responding properly');
    }
    
    // Test packages API (optional)
    try {
      const packagesCheck = await fetch('http://localhost:3000/api/esim/packages');
      if (packagesCheck.ok) {
        const packagesData = await packagesCheck.json();
        console.log('✅ Packages API working');
        console.log(`   └─ Packages: ${packagesData.data?.length || 0}`);
      } else {
        console.log('⚠️  Packages API not available (optional)');
      }
    } catch (error) {
      console.log('⚠️  Packages API not implemented yet (optional)');
    }
    
  } catch (error) {
    console.log('❌ Cannot connect to development server');
    console.log('💡 Start your dev server: npm run dev');
    return;
  }

  // Generate sitemap
  console.log('\n🔧 Generating comprehensive sitemap...');
  try {
    const output = execSync('npx next-sitemap --config next-sitemap.config.js', { 
      stdio: 'pipe',
      encoding: 'utf8' 
    });
    console.log('✅ Sitemap generated successfully!');
    
    // Show any console output from the generation
    if (output.trim()) {
      console.log('📋 Generation output:');
      console.log(output);
    }
  } catch (error) {
    console.error('❌ Sitemap generation failed:');
    console.error(error.stdout || error.message);
    return;
  }

  // Analyze generated files
  console.log('\n📂 Analyzing generated files...');
  const publicDir = path.join(process.cwd(), 'public');
  
  // Check sitemap.xml
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    const urlCount = (sitemapContent.match(/<url>/g) || []).length;
    const sitemapSize = Math.round(fs.statSync(sitemapPath).size / 1024);
    
    console.log(`✅ sitemap.xml (${sitemapSize}KB, ${urlCount} URLs)`);
    
    // Analyze URL types
    const urlMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g) || [];
    const urlAnalysis = {
      total: urlMatches.length,
      countries: urlMatches.filter(url => url.includes('/destinations/country/')).length,
      regions: urlMatches.filter(url => url.includes('/destinations/region/') || url.includes('/destinations/slug/')).length,
      blog: urlMatches.filter(url => url.includes('/blog/') && !url.includes('/blog/category/')).length,
      blogCategories: urlMatches.filter(url => url.includes('/blog/category/')).length,
      packages: urlMatches.filter(url => url.includes('/packages/')).length,
      static: urlMatches.filter(url => {
        const path = url.replace(/<\/?loc>/g, '').replace('http://localhost:3000', '');
        return !path.includes('/destinations/') && !path.includes('/blog/') && !path.includes('/packages/');
      }).length
    };
    
    console.log('   📊 URL breakdown:');
    console.log(`      • Countries: ${urlAnalysis.countries}`);
    console.log(`      • Regions: ${urlAnalysis.regions}`);
    console.log(`      • Blog posts: ${urlAnalysis.blog}`);
    console.log(`      • Blog categories: ${urlAnalysis.blogCategories}`);
    console.log(`      • Packages: ${urlAnalysis.packages}`);
    console.log(`      • Static pages: ${urlAnalysis.static}`);
    
    // Show sample URLs
    console.log('   📋 Sample URLs:');
    const sampleUrls = urlMatches.slice(0, 8).map(match => 
      match.replace(/<\/?loc>/g, '').replace('http://localhost:3000', '')
    );
    sampleUrls.forEach(url => {
      console.log(`      • ${url}`);
    });
    if (urlMatches.length > 8) {
      console.log(`      ... and ${urlMatches.length - 8} more`);
    }
  } else {
    console.log('❌ sitemap.xml not found');
  }

  // Check robots.txt
  const robotsPath = path.join(publicDir, 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    const robotsSize = Math.round(fs.statSync(robotsPath).size);
    console.log(`✅ robots.txt (${robotsSize} bytes)`);
    
    const robotsContent = fs.readFileSync(robotsPath, 'utf8');
    console.log('   📋 Robots.txt preview:');
    robotsContent.split('\n').slice(0, 8).forEach(line => {
      if (line.trim()) console.log(`      ${line}`);
    });
  } else {
    console.log('❌ robots.txt not found');
  }

  // Check for sitemap index (if multiple sitemaps were created)
  const sitemapIndexPath = path.join(publicDir, 'sitemap-index.xml');
  if (fs.existsSync(sitemapIndexPath)) {
    const indexContent = fs.readFileSync(sitemapIndexPath, 'utf8');
    const sitemapCount = (indexContent.match(/<sitemap>/g) || []).length;
    console.log(`✅ sitemap-index.xml (${sitemapCount} sitemaps)`);
  }

  // Test sitemap accessibility
  console.log('\n🌐 Testing sitemap accessibility...');
  try {
    const { default: fetch } = await import('node-fetch');
    
    const sitemapResponse = await fetch('http://localhost:3000/sitemap.xml');
    console.log(`Sitemap HTTP status: ${sitemapResponse.status === 200 ? '✅' : '❌'} (${sitemapResponse.status})`);
    
    const robotsResponse = await fetch('http://localhost:3000/robots.txt');
    console.log(`Robots.txt HTTP status: ${robotsResponse.status === 200 ? '✅' : '❌'} (${robotsResponse.status})`);
    
  } catch (error) {
    console.log('❌ Could not test HTTP accessibility:', error.message);
  }

  console.log('\n🎯 Test your sitemap:');
  console.log('   • View sitemap: http://localhost:3000/sitemap.xml');
  console.log('   • View robots.txt: http://localhost:3000/robots.txt');
  console.log('   • Test API: http://localhost:3000/api/sitemap/test');
  
  console.log('\n📝 Next steps for production:');
  console.log('   1. Update NEXT_PUBLIC_SITE_URL to your domain');
  console.log('   2. Submit sitemap.xml to Google Search Console');
  console.log('   3. Submit sitemap.xml to Bing Webmaster Tools');
  console.log('   4. Monitor indexing status in search consoles');
  
  console.log('\n✨ Development testing complete!');
}

// Additional function to test specific URL types
async function testSpecificUrls() {
  console.log('\n🔍 Testing specific URL types...');
  
  try {
    const { default: fetch } = await import('node-fetch');
    
    const testUrls = [
      'http://localhost:3000/',
      'http://localhost:3000/blog',
      'http://localhost:3000/destinations',
      'http://localhost:3000/api/blogs',
      'http://localhost:3000/api/esim/locations'
    ];
    
    for (const url of testUrls) {
      try {
        const response = await fetch(url);
        console.log(`${url}: ${response.status === 200 ? '✅' : '❌'} (${response.status})`);
      } catch (error) {
        console.log(`${url}: ❌ (${error.message})`);
      }
    }
  } catch (error) {
    console.log('❌ Could not test URLs:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test-urls')) {
    testSpecificUrls().catch(console.error);
  } else {
    testDevelopmentSitemap().catch(console.error);
  }
}

module.exports = { testDevelopmentSitemap, testSpecificUrls };