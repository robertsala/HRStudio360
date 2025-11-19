import { geocodingService } from './geocodingService';
import { getWeatherDescription, getAnimatedIconType} from './metnoWeatherMapping';
import { apiClient } from '../lib/api';

export interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temperature: number;
    temperatureUnit: 'F' | 'C';
    condition: string;
    icon: string;
    windSpeed: number;
    humidity: number;
    feelsLike: number;
  };
  forecast?: ForecastDay[];
  lastUpdated: string;
}

export interface ForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  condition: string;
  icon: string;
  chanceOfRain: number;
}

export interface UserLocation {
  lat: number;
  lon: number;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface MetNoTimeseries {
  time: string;
  data: {
    instant: {
      details: {
        air_temperature?: number;
        relative_humidity?: number;
        wind_speed?: number;
        wind_from_direction?: number;
      };
    };
    next_1_hours?: {
      summary: {
        symbol_code: string;
      };
      details?: {
        precipitation_amount?: number;
      };
    };
    next_6_hours?: {
      summary: {
        symbol_code: string;
      };
      details?: {
        precipitation_amount?: number;
      };
    };
    next_12_hours?: {
      summary: {
        symbol_code: string;
      };
    };
  };
}

class WeatherService {
  async getWeatherForUser(userId: string): Promise<WeatherData | null> {
    try {
      // Try cached weather first with timeout
      const cachePromise = this.getCachedWeather(userId);
      const cacheTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));

      const cachedWeather = await Promise.race([cachePromise, cacheTimeout]);

      if (cachedWeather && !this.isCacheExpired(cachedWeather.cache_expires_at)) {
        console.log('[WeatherService] Returning cached weather data');
        return this.formatCachedWeather(cachedWeather);
      }

      // Get user location with timeout
      const locationPromise = this.getUserLocation(userId);
      const locationTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));

      const location = await Promise.race([locationPromise, locationTimeout]);

      if (!location) {
        console.log('[WeatherService] No location found for user');
        return null;
      }

      // Fetch weather data with timeout
      const weatherPromise = this.fetchWeatherData(location.lat, location.lon, location.city, location.state);
      const weatherTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));

      const weatherData = await Promise.race([weatherPromise, weatherTimeout]);

      if (!weatherData) {
        console.log('[WeatherService] No weather data returned');
        return null;
      }

      // Cache asynchronously without waiting (fire and forget)
      this.cacheWeatherData(userId, weatherData).catch((err) => {
        console.warn('[WeatherService] Failed to cache weather data:', err);
      });

      return weatherData;
    } catch (error) {
      console.error('[WeatherService] Error getting weather for user:', error);
      return null;
    }
  }

  private async getUserLocation(userId: string): Promise<UserLocation | null> {
    try {
      const profile = await apiClient.getProfile(userId);

      if (!profile) {
        console.log('[WeatherService] No profile data found for user');
        return null;
      }

      if (profile.locationLat && profile.locationLon) {
        return {
          lat: parseFloat(profile.locationLat),
          lon: parseFloat(profile.locationLon),
          city: profile.locationCity || undefined,
          state: profile.locationState || undefined,
          zipCode: profile.locationZipCode || undefined,
        };
      }

      console.log('[WeatherService] User has no location data set');
      return null;
    } catch (error) {
      console.error('[WeatherService] Exception getting user location:', error);
      // Don't throw, just return null - weather is not critical
      return null;
    }
  }

  private async fetchWeatherData(
    lat: number,
    lon: number,
    city?: string,
    state?: string
  ): Promise<WeatherData | null> {
    try {
      // Use backend proxy to avoid CORS issues
      const url = `/api/weather/${lat}/${lon}`;
      console.log('[WeatherService] Fetching weather from backend proxy:', url);

      const response = await fetch(url);

      console.log('[WeatherService] API Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Weather API error:', response.status, response.statusText, errorText);
        return null;
      }

      const data = await response.json();
      console.log('[WeatherService] Successfully received weather data');

      if (!data.properties || !data.properties.timeseries) {
        console.error('Invalid met.no response format');
        return null;
      }

      const timeseries: MetNoTimeseries[] = data.properties.timeseries;

      if (timeseries.length === 0) {
        console.error('No timeseries data available');
        return null;
      }

      const current = timeseries[0];
      const currentDetails = current.data.instant.details;
      const currentSymbol = current.data.next_1_hours?.summary.symbol_code ||
                           current.data.next_6_hours?.summary.symbol_code ||
                           'cloudy';

      const tempCelsius = currentDetails.air_temperature || 0;
      const tempFahrenheit = this.celsiusToFahrenheit(tempCelsius);
      const windSpeedMps = currentDetails.wind_speed || 0;
      const windSpeedMph = this.mpsToMph(windSpeedMps);

      const forecast = this.processForecast(timeseries);

      const weatherData: WeatherData = {
        location: {
          name: city || 'Unknown',
          region: state || '',
          country: 'US',
          lat,
          lon,
        },
        current: {
          temperature: tempFahrenheit,
          temperatureUnit: 'F',
          condition: getWeatherDescription(currentSymbol),
          icon: getAnimatedIconType(currentSymbol),
          windSpeed: windSpeedMph,
          humidity: currentDetails.relative_humidity || 0,
          feelsLike: this.calculateFeelsLike(tempFahrenheit, windSpeedMph, currentDetails.relative_humidity || 0),
        },
        forecast,
        lastUpdated: new Date().toISOString(),
      };

      return weatherData;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  }

  private processForecast(timeseries: MetNoTimeseries[]): ForecastDay[] {
    const dailyData = new Map<string, {
      temps: number[];
      symbols: string[];
      precipitation: number[];
    }>();

    for (const entry of timeseries) {
      const date = entry.time.split('T')[0];
      const temp = entry.data.instant.details.air_temperature;
      const symbol = entry.data.next_6_hours?.summary.symbol_code ||
                    entry.data.next_1_hours?.summary.symbol_code;
      const precip = entry.data.next_6_hours?.details?.precipitation_amount ||
                    entry.data.next_1_hours?.details?.precipitation_amount || 0;

      if (!dailyData.has(date)) {
        dailyData.set(date, { temps: [], symbols: [], precipitation: [] });
      }

      const dayData = dailyData.get(date)!;
      if (temp !== undefined) dayData.temps.push(temp);
      if (symbol) dayData.symbols.push(symbol);
      dayData.precipitation.push(precip);
    }

    const forecastDays: ForecastDay[] = [];
    const dates = Array.from(dailyData.keys()).sort().slice(0, 5);

    for (const date of dates) {
      const dayData = dailyData.get(date)!;

      if (dayData.temps.length === 0) continue;

      const maxTempC = Math.max(...dayData.temps);
      const minTempC = Math.min(...dayData.temps);
      const maxTempF = this.celsiusToFahrenheit(maxTempC);
      const minTempF = this.celsiusToFahrenheit(minTempC);

      const mostCommonSymbol = this.getMostCommonSymbol(dayData.symbols);
      const totalPrecip = dayData.precipitation.reduce((a, b) => a + b, 0);
      const chanceOfRain = totalPrecip > 0 ? Math.min(Math.round((totalPrecip / 10) * 100), 100) : 0;

      forecastDays.push({
        date,
        maxTemp: maxTempF,
        minTemp: minTempF,
        condition: getWeatherDescription(mostCommonSymbol),
        icon: getAnimatedIconType(mostCommonSymbol),
        chanceOfRain,
      });
    }

    return forecastDays;
  }

  private getMostCommonSymbol(symbols: string[]): string {
    if (symbols.length === 0) return 'cloudy';

    const counts = new Map<string, number>();
    for (const symbol of symbols) {
      counts.set(symbol, (counts.get(symbol) || 0) + 1);
    }

    let maxCount = 0;
    let mostCommon = symbols[0];
    for (const [symbol, count] of counts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = symbol;
      }
    }

    return mostCommon;
  }

  private celsiusToFahrenheit(celsius: number): number {
    return (celsius * 9/5) + 32;
  }

  private mpsToMph(mps: number): number {
    return mps * 2.23694;
  }

  private calculateFeelsLike(tempF: number, windSpeedMph: number, humidity: number): number {
    if (tempF <= 50 && windSpeedMph > 3) {
      const windChill = 35.74 + (0.6215 * tempF) - (35.75 * Math.pow(windSpeedMph, 0.16)) +
                       (0.4275 * tempF * Math.pow(windSpeedMph, 0.16));
      return windChill;
    }

    if (tempF >= 80) {
      const heatIndex = -42.379 + (2.04901523 * tempF) + (10.14333127 * humidity) -
                       (0.22475541 * tempF * humidity) - (0.00683783 * tempF * tempF) -
                       (0.05481717 * humidity * humidity) + (0.00122874 * tempF * tempF * humidity) +
                       (0.00085282 * tempF * humidity * humidity) -
                       (0.00000199 * tempF * tempF * humidity * humidity);
      return heatIndex;
    }

    return tempF;
  }

  private async cacheWeatherData(_userId: string, _weatherData: WeatherData): Promise<void> {
    // Caching disabled during Supabase migration
    // Weather data will be fetched fresh from the API each time
    return;
  }

  private async getCachedWeather(_userId: string): Promise<any | null> {
    // Caching disabled during Supabase migration
    // Weather data is fetched fresh from the API
    return null;
  }

  private isCacheExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
  }

  private formatCachedWeather(cached: any): WeatherData {
    return {
      location: {
        name: cached.location_name.split(',')[0].trim(),
        region: cached.location_name.split(',')[1]?.trim() || '',
        country: 'US',
        lat: cached.location_lat,
        lon: cached.location_lon,
      },
      current: {
        temperature: cached.temperature,
        temperatureUnit: cached.temperature_unit,
        condition: cached.weather_condition,
        icon: cached.weather_icon,
        windSpeed: cached.wind_speed,
        humidity: cached.humidity,
        feelsLike: cached.feels_like,
      },
      forecast: cached.forecast_data || [],
      lastUpdated: cached.last_updated,
    };
  }

  async getCoordinatesFromZipCode(zipCode: string): Promise<{ lat: number; lon: number; city: string; state: string } | null> {
    try {
      const result = await geocodingService.searchByZipCode(zipCode, 'US');

      if (!result) {
        return null;
      }

      return {
        lat: result.lat,
        lon: result.lon,
        city: result.city,
        state: result.state,
      };
    } catch (error) {
      console.error('Error getting coordinates from zip code:', error);
      return null;
    }
  }

  async updateUserLocation(
    userId: string,
    location: { lat: number; lon: number; city?: string; state?: string; zipCode?: string },
    manualOverride: boolean = false
  ): Promise<boolean> {
    try {
      await apiClient.updateProfile(userId, {
        locationLat: location.lat.toString(),
        locationLon: location.lon.toString(),
        locationCity: location.city,
        locationState: location.state,
        locationZipCode: location.zipCode,
        locationManualOverride: manualOverride,
      });

      await this.invalidateWeatherCache(userId);

      return true;
    } catch (error) {
      console.error('Error updating user location:', error);
      return false;
    }
  }

  async invalidateWeatherCache(_userId: string): Promise<void> {
    // Cache invalidation disabled during Supabase migration
    return;
  }

  async getWeatherPreferences(userId: string): Promise<any> {
    // Weather preferences disabled during Supabase migration
    // Return default preferences
    return {
      user_id: userId,
      auto_detect_location: true,
      preferred_temperature_unit: 'fahrenheit',
      show_extended_forecast: false,
    };
  }

  async updateWeatherPreferences(_userId: string, _preferences: any): Promise<boolean> {
    // Weather preferences disabled during Supabase migration
    return true;
  }

  async detectUserLocation(): Promise<{ lat: number; lon: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('Geolocation not supported');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve(null);
        },
        {
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }

  async getLocationName(lat: number, lon: number): Promise<{ city: string; state: string } | null> {
    try {
      const result = await geocodingService.reverseGeocode(lat, lon);

      if (!result) {
        return null;
      }

      return {
        city: result.city,
        state: result.state,
      };
    } catch (error) {
      console.error('Error getting location name:', error);
      return null;
    }
  }
}

export const weatherService = new WeatherService();
