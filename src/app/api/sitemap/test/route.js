// app/api/sitemap/test/route.js - Complete sitemap test endpoint
export async function GET() {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // Test sitemap files
    const sitemapTests = [];
    const sitemapFiles = ['sitemap.xml', 'robots.txt', 'sitemap-index.xml'];
    
    for (const file of sitemapFiles) {
      try {
        const response = await fetch(`${siteUrl}/${file}`);
        const content = await response.text();
        
        let analysis = {
          file,
          status: response.status,
          size: content.length,
          success: response.ok
        };
        
        if (file.includes('sitemap') && response.ok) {
          analysis.urls = (content.match(/<url>/g) || []).length;
          analysis.sitemaps = (content.match(/<sitemap>/g) || []).length;
          
          // Analyze URL types if it's the main sitemap
          if (file === 'sitemap.xml') {
            const urlMatches = content.match(/<loc>(.*?)<\/loc>/g) || [];
            analysis.urlBreakdown = {
              total: urlMatches.length,
              countries: urlMatches.filter(url => url.includes('/destinations/country/')).length,
              regions: urlMatches.filter(url => url.includes('/destinations/region/') || url.includes('/destinations/slug/')).length,
              blog: urlMatches.filter(url => url.includes('/blog/') && !url.includes('/blog/category/')).length,
              blogCategories: urlMatches.filter(url => url.includes('/blog/category/')).length,
              packages: urlMatches.filter(url => url.includes('/packages/')).length,
              static: urlMatches.filter(url => {
                const path = url.replace(/<\/?loc>/g, '').replace(siteUrl, '');
                return !path.includes('/destinations/') && !path.includes('/blog/') && !path.includes('/packages/');
              }).length
            };
          }
        }
        
        sitemapTests.push(analysis);
      } catch (error) {
        sitemapTests.push({
          file,
          error: error.message,
          success: false
        });
      }
    }
    
    // Test data source APIs
    const apiTests = [];
    
    // Test locations API
    try {
      const locationsResponse = await fetch(`${siteUrl}/api/esim/locations?skipCache=true`);
      const locationsData = await locationsResponse.json();
      
      apiTests.push({
        api: '/api/esim/locations',
        status: locationsResponse.status,
        success: locationsResponse.ok,
        data: {
          countries: locationsData.data?.countries?.length || 0,
          regions: locationsData.data?.regions?.length || 0
        }
      });
    } catch (error) {
      apiTests.push({
        api: '/api/esim/locations',
        error: error.message,
        success: false
      });
    }
    
    // Test blog API
    try {
      const blogsResponse = await fetch(`${siteUrl}/api/blogs`);
      const blogsData = await blogsResponse.json();
      
      const categories = [...new Set(blogsData.map(post => post.category).filter(Boolean))];
      
      apiTests.push({
        api: '/api/blogs',
        status: blogsResponse.status,
        success: blogsResponse.ok,
        data: {
          totalPosts: blogsData.length || 0,
          featuredPosts: blogsData.filter(post => post.featured).length || 0,
          categories: categories
        }
      });
    } catch (error) {
      apiTests.push({
        api: '/api/blogs',
        error: error.message,
        success: false
      });
    }
    
    // Test packages API (optional)
    try {
      const packagesResponse = await fetch(`${siteUrl}/api/esim/packages`);
      const packagesData = await packagesResponse.json();
      
      apiTests.push({
        api: '/api/esim/packages',
        status: packagesResponse.status,
        success: packagesResponse.ok,
        data: {
          packages: packagesData.data?.length || 0
        }
      });
    } catch (error) {
      apiTests.push({
        api: '/api/esim/packages',
        error: error.message,
        success: false,
        note: 'Optional API - not required for basic sitemap generation'
      });
    }
    
    // Calculate totals
    const mainSitemap = sitemapTests.find(test => test.file === 'sitemap.xml');
    const totalUrls = mainSitemap?.urls || 0;
    const urlBreakdown = mainSitemap?.urlBreakdown || {};
    
    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      siteUrl,
      environment: process.env.NODE_ENV || 'development',
      
      sitemapFiles: sitemapTests,
      dataSourceApis: apiTests,
      
      summary: {
        sitemapFilesFound: sitemapTests.filter(t => t.success).length,
        workingApis: apiTests.filter(a => a.success).length,
        totalUrls,
        urlBreakdown
      },
      
      instructions: {
        development: {
          generateSitemap: 'npm run sitemap:dev',
          testSitemap: 'npm run sitemap:test',
          viewSitemap: `${siteUrl}/sitemap.xml`,
          viewRobots: `${siteUrl}/robots.txt`
        },
        production: {
          submitToGoogle: 'Add sitemap to Google Search Console',
          submitToBing: 'Add sitemap to Bing Webmaster Tools',
          monitor: 'Check indexing status regularly'
        }
      },
      
      healthCheck: {
        overall: sitemapTests.filter(t => t.success).length > 0 && apiTests.filter(a => a.success).length >= 2,
        sitemap: sitemapTests.some(t => t.file === 'sitemap.xml' && t.success),
        robots: sitemapTests.some(t => t.file === 'robots.txt' && t.success),
        locations: apiTests.some(a => a.api === '/api/esim/locations' && a.success),
        blog: apiTests.some(a => a.api === '/api/blogs' && a.success)
      }
    });
    
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      troubleshooting: {
        checkDevServer: 'Ensure development server is running: npm run dev',
        installDependencies: 'npm install next-sitemap --save-dev',
        checkConfig: 'Verify next-sitemap.config.js exists in project root',
        checkApis: 'Test APIs manually: /api/blogs and /api/esim/locations',
        generateSitemap: 'Run: npm run sitemap:dev'
      }
    }, { status: 500 });
  }
}