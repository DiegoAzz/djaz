export interface YouTubeItem {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration?: string;
  publishedAt?: string;
}

export interface SearchResult {
  items: YouTubeItem[];
  nextPageToken?: string;
  prevPageToken?: string;
  totalResults: number;
  source: 'youtube-live' | 'youtube-api' | 'youtube-oembed' | 'demo-catalog';
  warning?: string;
}

interface CacheEntry {
  data: SearchResult;
  timestamp: number;
}

export class YouTubeService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours cache

  public isKeyConfigured(): boolean {
    const key = process.env.YOUTUBE_API_KEY;
    return Boolean(key && key.trim().length > 10 && key !== 'YOUR_YOUTUBE_API_KEY_HERE');
  }

  public async search(query: string, pageToken?: string): Promise<SearchResult> {
    const trimmed = query.trim();
    const cacheKey = `${trimmed.toLowerCase()}__${pageToken || ''}`;

    // 1. Check Cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    // 2. Direct YouTube URL or Video ID
    const directVideoId = this.extractVideoId(trimmed);
    if (directVideoId) {
      const oembedResult = await this.resolveOEmbed(directVideoId);
      if (oembedResult) {
        this.cache.set(cacheKey, { data: oembedResult, timestamp: Date.now() });
        return oembedResult;
      }
    }

    // 3. Official API if key is present
    if (this.isKeyConfigured()) {
      try {
        const apiResult = await this.searchViaApi(trimmed, pageToken);
        if (apiResult && apiResult.items.length > 0) {
          this.cache.set(cacheKey, { data: apiResult, timestamp: Date.now() });
          return apiResult;
        }
      } catch (err) {
        console.warn('[YouTube API failed, falling back to Live Search]', err);
      }
    }

    // 4. Universal Live YouTube Search (No API Key required - Real search results)
    try {
      const liveResult = await this.searchLiveYouTube(trimmed);
      if (liveResult.items.length > 0) {
        this.cache.set(cacheKey, { data: liveResult, timestamp: Date.now() });
        return liveResult;
      }
    } catch (err) {
      console.error('[Live YouTube search error]', err);
    }

    // 5. Fallback demo catalog if completely offline
    return {
      items: [
        {
          id: '60ItHLz5WEA',
          title: 'Alan Walker - Faded (Official Music Video)',
          channelTitle: 'Alan Walker',
          thumbnail: 'https://i.ytimg.com/vi/60ItHLz5WEA/hqdefault.jpg',
          duration: '3:32'
        },
        {
          id: 'n8X9_MgEdCg',
          title: 'TheFatRat - Unity',
          channelTitle: 'TheFatRat',
          thumbnail: 'https://i.ytimg.com/vi/n8X9_MgEdCg/hqdefault.jpg',
          duration: '4:09'
        },
        {
          id: 'c5wXFxiLabI',
          title: 'BAD BUNNY - NO ME QUIERO CASAR (Visualizer)',
          channelTitle: 'Bad Bunny',
          thumbnail: 'https://i.ytimg.com/vi/c5wXFxiLabI/hqdefault.jpg',
          duration: '3:46'
        }
      ],
      totalResults: 3,
      source: 'demo-catalog',
      warning: 'No se encontraron resultados directos. Se muestran temas de demostración.'
    };
  }

  /**
   * Performs universal live YouTube search by recursively extracting videos
   * from YouTube's response (handles videoRenderer and lockupViewModel)
   */
  private async searchLiveYouTube(query: string): Promise<SearchResult> {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      }
    });

    if (!res.ok) {
      throw new Error(`YouTube search returned status ${res.status}`);
    }

    const html = await res.text();
    const startIdx = html.indexOf('ytInitialData = ');
    if (startIdx === -1) {
      throw new Error('ytInitialData not found in YouTube response');
    }

    const jsonStart = startIdx + 'ytInitialData = '.length;
    const endIdx = html.indexOf(';</script>', jsonStart);
    if (endIdx === -1) {
      throw new Error('Script end delimiter not found');
    }

    const jsonStr = html.substring(jsonStart, endIdx);
    const data = JSON.parse(jsonStr);

    const items: YouTubeItem[] = [];
    const seenIds = new Set<string>();

    const traverse = (obj: any) => {
      if (!obj || typeof obj !== 'object' || items.length >= 25) return;

      // 1. Classic videoRenderer
      if (obj.videoRenderer && obj.videoRenderer.videoId) {
        const v = obj.videoRenderer;
        if (!seenIds.has(v.videoId)) {
          seenIds.add(v.videoId);
          const title =
            v.title?.runs?.map((r: any) => r.text).join('') || v.title?.simpleText || 'Sin título';
          const channel = v.ownerText?.runs?.[0]?.text || 'YouTube';
          const duration = v.lengthText?.simpleText || '';

          items.push({
            id: v.videoId,
            title,
            channelTitle: channel,
            duration,
            thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`
          });
        }
      }

      // 2. Modern lockupViewModel (2025/2026 YouTube format)
      if (obj.lockupViewModel) {
        const vm = obj.lockupViewModel;
        let vid: string | null = null;
        if (typeof vm.contentId === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(vm.contentId)) {
          vid = vm.contentId;
        } else {
          const stringified = JSON.stringify(vm);
          const m = stringified.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
          if (m) vid = m[1];
        }

        if (vid && !seenIds.has(vid)) {
          seenIds.add(vid);
          const title = vm.metadata?.lockupMetadataViewModel?.title?.content || 'Video de YouTube';
          items.push({
            id: vid,
            title,
            channelTitle: 'YouTube',
            duration: '',
            thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`
          });
        }
      }

      if (Array.isArray(obj)) {
        for (const el of obj) traverse(el);
      } else {
        for (const k of Object.keys(obj)) traverse(obj[k]);
      }
    };

    traverse(data);

    return {
      items,
      totalResults: items.length,
      source: 'youtube-live'
    };
  }

  private async searchViaApi(query: string, pageToken?: string): Promise<SearchResult> {
    const apiKey = process.env.YOUTUBE_API_KEY!.trim();
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('videoEmbeddable', 'true');
    searchUrl.searchParams.set('maxResults', '15');
    searchUrl.searchParams.set('key', apiKey);
    if (pageToken) searchUrl.searchParams.set('pageToken', pageToken);

    const res = await fetch(searchUrl.toString());
    if (!res.ok) throw new Error(`YouTube API returned ${res.status}`);

    const data = await res.json() as any;
    const items: YouTubeItem[] = (data.items || [])
      .filter((item: any) => item.id?.videoId)
      .map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet?.title || 'Sin título',
        channelTitle: item.snippet?.channelTitle || 'YouTube',
        thumbnail:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
        publishedAt: item.snippet?.publishedAt
      }));

    return {
      items,
      nextPageToken: data.nextPageToken,
      prevPageToken: data.prevPageToken,
      totalResults: data.pageInfo?.totalResults ?? items.length,
      source: 'youtube-api'
    };
  }

  private async resolveOEmbed(videoId: string): Promise<SearchResult | null> {
    try {
      const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const res = await fetch(url);
      if (!res.ok) return null;

      const data = await res.json() as any;
      const item: YouTubeItem = {
        id: videoId,
        title: data.title || 'Video de YouTube',
        channelTitle: data.author_name || 'YouTube',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: ''
      };

      return {
        items: [item],
        totalResults: 1,
        source: 'youtube-oembed'
      };
    } catch {
      return null;
    }
  }

  private extractVideoId(text: string): string | null {
    if (/^[a-zA-Z0-9_-]{11}$/.test(text)) return text;
    const watchMatch = text.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return watchMatch ? watchMatch[1] : null;
  }
}

export const youtubeService = new YouTubeService();
