export interface YouTubeVideo {
  id: string;
  videoId: string;
  title: string;
  creator: string;
  thumbnail: string;
  duration: string;
  likes: number;
  views: number;
  category: string;
  publishedAt: string;
  description: string;
}

export interface YouTubeResponse {
  videos: YouTubeVideo[];
  success: boolean;
  error?: string;
}

export async function fetchASMRVideos(query: string = 'ASMR', maxResults: number = 20): Promise<YouTubeResponse> {
  try {
    const response = await fetch(`/api/youtube?q=${encodeURIComponent(query)}&maxResults=${maxResults}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw error;
  }
}
