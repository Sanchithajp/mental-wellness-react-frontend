import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || 'ASMR';
    const maxResults = parseInt(searchParams.get('maxResults') || '20');
    
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    
    if (!youtubeApiKey) {
      return NextResponse.json(
        {
          error: "YouTube API key not configured",
          message: "Please set YOUTUBE_API_KEY in your .env.local file."
        },
        { status: 503 }
      );
    }

    // Search for ASMR videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=${maxResults}&q=${encodeURIComponent(query)}&key=${youtubeApiKey}`;
    
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'YouTube API request failed');
    }

    const searchData = await searchResponse.json();
    
    // Get video details (duration, view count, etc.)
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${videoIds}&key=${youtubeApiKey}`;
    
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    // Format videos for frontend
    const videos = detailsData.items.map((video: any, index: number) => {
      // Parse duration (PT10M30S format)
      const duration = parseDuration(video.contentDetails.duration);
      
      return {
        id: video.id,
        videoId: video.id,
        title: video.snippet.title,
        creator: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
        duration: duration,
        likes: parseInt(video.statistics.likeCount || '0'),
        views: parseInt(video.statistics.viewCount || '0'),
        category: extractCategory(video.snippet.title, video.snippet.description),
        publishedAt: video.snippet.publishedAt,
        description: video.snippet.description,
      };
    });

    return NextResponse.json({
      videos,
      success: true
    });

  } catch (error: any) {
    console.error("Error fetching YouTube videos:", error);
    return NextResponse.json(
      {
        error: "An error occurred while fetching videos",
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Helper function to parse YouTube duration (PT10M30S -> 10:30)
function parseDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper function to extract category from title/description
function extractCategory(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase();
  
  if (text.includes('rain') || text.includes('rainy')) return 'Rain';
  if (text.includes('ocean') || text.includes('wave') || text.includes('beach')) return 'Nature';
  if (text.includes('fire') || text.includes('fireplace') || text.includes('crackling')) return 'Indoor';
  if (text.includes('bird') || text.includes('forest') || text.includes('nature')) return 'Nature';
  if (text.includes('sleep') || text.includes('white noise') || text.includes('relax')) return 'Sleep';
  if (text.includes('storm') || text.includes('thunder') || text.includes('lightning')) return 'Storm';
  if (text.includes('tapping') || text.includes('whisper')) return 'ASMR';
  
  return 'ASMR';
}
