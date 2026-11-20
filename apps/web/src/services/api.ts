import { SearchResultItem } from '../types';

export interface SearchApiResponse {
  items: SearchResultItem[];
  nextPageToken?: string;
  prevPageToken?: string;
  totalResults: number;
  source: 'youtube-api' | 'demo-catalog';
  warning?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  youtubeKeyConfigured: boolean;
  environment: string;
}

export const apiService = {
  async search(query: string, pageToken?: string): Promise<SearchApiResponse> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      throw new Error('La búsqueda debe tener al menos 2 caracteres');
    }

    const params = new URLSearchParams({ q: trimmed });
    if (pageToken) params.append('pageToken', pageToken);

    const res = await fetch(`/api/search?${params.toString()}`);
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Error ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  },

  async checkHealth(): Promise<HealthResponse> {
    const res = await fetch('/api/health');
    if (!res.ok) {
      throw new Error('API offline');
    }
    return await res.json();
  }
};
