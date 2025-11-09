import { supabase } from './supabaseClient';
import { geocodingService } from './geocodingService';
import { getWeatherDescription, getAnimatedIconType } from './metnoWeatherMapping';
import { apiClient } from '../lib/api';

const METNO_API_BASE = 'https://api.met.no/weatherapi/locationforecast/2.0';
const USER_AGENT = 'HR-Studio-Weather-Widget/1.0';
const CACHE_DURATION_MS = 30 * 60 * 1000;

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
      const { data, error } = await supabase
        .from('profiles')
        .select('location_lat, location_lon, location_city, location_state, location_zip_code')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[WeatherService] Error fetching user location:', error);
        // Don't throw, just return null - weather is not critical
        return null;
      }

      if (!data) {
        console.log('[WeatherService] No profile data found for user');
        return null;
      }

      if (data.location_lat && data.location_lon) {
        return {
          lat: data.location_lat,
          lon: data.location_lon,
          city: data.location_city,
          state: data.location_state,
          zipCode: data.location_zip_code,
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
      const url = `${METNO_API_BASE}/compact?lat=${lat}&lon=${lon}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
        },
      });

      if (!response.ok) {
        console.error('met.no API error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();

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

  private async cacheWeatherData(userId: string, weatherData: WeatherData): Promise<void> {
    try {
      const cacheExpiresAt = new Date(Date.now() + CACHE_DURATION_MS).toISOString();

      const { error } = await supabase
        .from('weather_cache')
        .upsert({
          user_id: userId,
          location_lat: weatherData.location.lat,
          location_lon: weatherData.location.lon,
          location_name: `${weatherData.location.name}, ${weatherData.location.region}`,
          temperature: weatherData.current.temperature,
          temperature_unit: weatherData.current.temperatureUnit,
          weather_condition: weatherData.current.condition,
          weather_icon: weatherData.current.icon,
          wind_speed: weatherData.current.windSpeed,
          humidity: weatherData.current.humidity,
          feels_like: weatherData.current.feelsLike,
          forecast_data: weatherData.forecast || [],
          last_updated: new Date().toISOString(),
          cache_expires_at: cacheExpiresAt,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error caching weather data:', error);
      }
    } catch (error) {
      console.error('Error caching weather data:', error);
    }
  }

  private async getCachedWeather(userId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('weather_cache')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting cached weather:', error);
      return null;
    }
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

  async invalidateWeatherCache(userId: string): Promise<void> {
    try {
      await supabase
        .from('weather_cache')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error invalidating weather cache:', error);
    }
  }

  async getWeatherPreferences(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_weather_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        const { data: newPrefs } = await supabase
          .from('user_weather_preferences')
          .insert({
            user_id: userId,
            auto_detect_location: true,
            preferred_temperature_unit: 'fahrenheit',
            show_extended_forecast: false,
          })
          .select()
          .single();

        return newPrefs;
      }

      return data;
    } catch (error) {
      console.error('Error getting weather preferences:', error);
      return null;
    }
  }

  async updateWeatherPreferences(userId: string, preferences: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_weather_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating weather preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating weather preferences:', error);
      return false;
    }
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
