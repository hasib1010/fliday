// app/api/internal/blog-list/route.js   ← FINAL VERSION (no cleaning, no empty)

import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function GET() {
    try {
        await connectDB();

        const posts = await Blog.find({})
            .select('slug date')
            .sort({ date: -1 })
            .lean();

        // ← NO CLEANING, use slug exactly as stored in DB
        const list = posts.map(post => ({
            slug: post.slug,                                    // ← keep trailing dash if exists
            date: post.date ? new Date(post.date).toISOString() : new Date().toISOString(),
        }));

        return new Response(JSON.stringify(list), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 's-maxage=600, stale-while-revalidate=60',
            },
        });
    } catch (error) {
        console.error('Blog list error:', error);
        return new Response(JSON.stringify([]), { status: 200 });
    }
}







