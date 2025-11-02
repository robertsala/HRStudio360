const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'HR-Studio-Weather-Widget/1.0';

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000;

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

interface GeocodingResult {
  lat: number;
  lon: number;
  city: string;
  state: string;
  country?: string;
}

class GeocodingService {
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastRequestTime = Date.now();
  }

  async searchByZipCode(zipCode: string, countryCode: string = 'US'): Promise<GeocodingResult | null> {
    try {
      await this.waitForRateLimit();

      const url = `${NOMINATIM_BASE_URL}/search?postalcode=${encodeURIComponent(zipCode)}&country=${countryCode}&format=json&limit=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
        },
      });

      if (!response.ok) {
        console.error('Nominatim search error:', response.status, response.statusText);
        return null;
      }

      const data: NominatimSearchResult[] = await response.json();

      if (data.length === 0) {
        console.log('No results found for zip code:', zipCode);
        return null;
      }

      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        city: result.address?.city || result.address?.town || result.address?.village || '',
        state: result.address?.state || '',
        country: result.address?.country || countryCode,
      };
    } catch (error) {
      console.error('Error searching by zip code:', error);
      return null;
    }
  }

  async reverseGeocode(lat: number, lon: number): Promise<GeocodingResult | null> {
    try {
      await this.waitForRateLimit();

      const url = `${NOMINATIM_BASE_URL}/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
        },
      });

      if (!response.ok) {
        console.error('Nominatim reverse geocoding error:', response.status, response.statusText);
        return null;
      }

      const data: NominatimSearchResult = await response.json();

      return {
        lat,
        lon,
        city: data.address?.city || data.address?.town || data.address?.village || '',
        state: data.address?.state || '',
        country: data.address?.country || '',
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  async searchByAddress(address: string): Promise<GeocodingResult | null> {
    try {
      await this.waitForRateLimit();

      const url = `${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
        },
      });

      if (!response.ok) {
        console.error('Nominatim address search error:', response.status, response.statusText);
        return null;
      }

      const data: NominatimSearchResult[] = await response.json();

      if (data.length === 0) {
        console.log('No results found for address:', address);
        return null;
      }

      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        city: result.address?.city || result.address?.town || result.address?.village || '',
        state: result.address?.state || '',
        country: result.address?.country || '',
      };
    } catch (error) {
      console.error('Error searching by address:', error);
      return null;
    }
  }
}

export const geocodingService = new GeocodingService();
export type { GeocodingResult };
