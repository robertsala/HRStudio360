import React, { useState, useEffect } from 'react';
import ReactAnimatedWeather from 'react-animated-weather';
import { MapPin, RefreshCw, CreditCard as Edit2, Wind, Droplets, Loader } from 'lucide-react';
import { weatherService, WeatherData } from '../utils/weatherService';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { useTranslation } from 'react-i18next';

interface WeatherWidgetProps {
  onLocationChange?: () => void;
}

// Map weather conditions to react-animated-weather icons
const getWeatherIcon = (condition: string): string => {
  const conditionLower = condition.toLowerCase();

  if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
    return 'CLEAR_DAY';
  } else if (conditionLower.includes('partly cloudy') || conditionLower.includes('partly')) {
    return 'PARTLY_CLOUDY_DAY';
  } else if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) {
    return 'CLOUDY';
  } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
    return 'RAIN';
  } else if (conditionLower.includes('snow') || conditionLower.includes('sleet')) {
    return 'SNOW';
  } else if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
    return 'RAIN';
  } else if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
    return 'FOG';
  } else if (conditionLower.includes('wind')) {
    return 'WIND';
  }

  return 'CLOUDY';
};

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ onLocationChange }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isCurrentWeatherHovered, setIsCurrentWeatherHovered] = useState(false);
  const [hoveredForecastIndex, setHoveredForecastIndex] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      // Use setTimeout to make this completely non-blocking
      // This ensures weather loading doesn't interfere with auth or page load
      const timer = setTimeout(() => {
        loadWeatherData();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [user]);

  const loadWeatherData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Check if user has location set with timeout
      const hasLocationPromise = checkUserLocation();
      const timeoutPromise = new Promise<boolean>((resolve) =>
        setTimeout(() => resolve(false), 5000)
      );

      const hasLocation = await Promise.race([hasLocationPromise, timeoutPromise]);

      if (!hasLocation) {
        // Try to detect location automatically (non-blocking, with timeout)
        const detectionPromise = detectAndSetLocation();
        const detectionTimeout = new Promise<boolean>((resolve) =>
          setTimeout(() => resolve(false), 8000)
        );

        const detected = await Promise.race([detectionPromise, detectionTimeout]);

        // If detection failed, show error with option to set manually
        if (!detected) {
          setError(t('weather.setLocation'));
          setLoading(false);
          return;
        }
      }

      // Fetch weather data with timeout
      const weatherPromise = weatherService.getWeatherForUser(user.id);
      const weatherTimeout = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 10000)
      );

      const weather = await Promise.race([weatherPromise, weatherTimeout]);

      if (weather) {
        setWeatherData(weather);
      } else {
        setError(t('weather.unavailable'));
      }
    } catch (err) {
      console.error('Error loading weather:', err);
      // Don't show error to user, just log it
      // Weather is not critical functionality
      setError(t('weather.unavailable'));
    } finally {
      setLoading(false);
    }
  };

  const checkUserLocation = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const profile = await apiClient.getProfile(user.id);
      return !!(profile.locationLat && profile.locationLon);
    } catch (error) {
      console.error('Exception checking user location:', error);
      return false;
    }
  };

  const detectAndSetLocation = async (): Promise<boolean> => {
    try {
      if (!user) return false;

      const coords = await weatherService.detectUserLocation();

      if (coords) {
        // Get location name from coordinates with timeout
        const locationNamePromise = weatherService.getLocationName(coords.lat, coords.lon);
        const locationTimeout = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 5000)
        );

        const locationName = await Promise.race([locationNamePromise, locationTimeout]);

        // Update location with timeout
        const updatePromise = weatherService.updateUserLocation(
          user.id,
          {
            lat: coords.lat,
            lon: coords.lon,
            city: locationName?.city,
            state: locationName?.state,
          },
          false
        );
        const updateTimeout = new Promise<boolean>((resolve) =>
          setTimeout(() => resolve(false), 5000)
        );

        const success = await Promise.race([updatePromise, updateTimeout]);

        return success;
      }

      return false;
    } catch (error) {
      console.error('Error detecting location:', error);
      return false;
    }
  };

  const handleRefresh = async () => {
    if (!user) return;

    setRefreshing(true);
    try {
      // Invalidate cache and fetch fresh data
      await weatherService.invalidateWeatherCache(user.id);
      await loadWeatherData();
    } catch (error) {
      console.error('Error refreshing weather:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLocationEdit = () => {
    if (onLocationChange) {
      onLocationChange();
    }
  };

  if (loading) {
    return (
      <div className="py-2">
        <div className="flex items-center space-x-2">
          <Loader className="h-4 w-4 text-gray-500 dark:text-gray-400 animate-spin" />
          <span className="text-xs text-gray-500 dark:text-gray-400">{t('weather.loading')}</span>
        </div>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="py-2">
        <div className="flex items-center space-x-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">{error || t('weather.unavailable')}</p>
          <button
            onClick={handleLocationEdit}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('weather.setLocation')}
          </button>
        </div>
      </div>
    );
  }

  const iconType = getWeatherIcon(weatherData.current.condition);

  return (
    <div className="flex items-start gap-6">
      {/* Left: Current Weather */}
      <div className="flex-shrink-0">
        {/* Location and controls - compact inline */}
        <div className="flex items-center space-x-1.5 mb-2">
          <MapPin className="h-3 w-3 text-gray-400 dark:text-gray-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {weatherData.location.name}, {weatherData.location.region}
          </span>
          <button
            onClick={handleLocationEdit}
            className="p-0.5 hover:opacity-70 transition-opacity"
            title={t('weather.changeLocation')}
          >
            <Edit2 className="h-3 w-3 text-gray-400 dark:text-gray-500" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-0.5 hover:opacity-70 transition-opacity"
            title={t('weather.refreshWeather')}
          >
            <RefreshCw className={`h-3 w-3 text-gray-400 dark:text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Current Weather - compact horizontal layout */}
        <div className="flex items-center space-x-3 mb-2">
          <div
            className="flex-shrink-0 cursor-pointer transition-all duration-300 ease-in-out"
            onMouseEnter={() => setIsCurrentWeatherHovered(true)}
            onMouseLeave={() => setIsCurrentWeatherHovered(false)}
            style={{
              transform: isCurrentWeatherHovered ? 'scale(1.1)' : 'scale(1)',
              filter: isCurrentWeatherHovered ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' : 'none'
            }}
            aria-label={`Current weather: ${weatherData.current.condition}, ${Math.round(weatherData.current.temperature)} degrees`}
            role="img"
          >
            <ReactAnimatedWeather
              icon={iconType}
              color="#9ca3af"
              size={48}
              animate={isCurrentWeatherHovered}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {Math.round(weatherData.current.temperature)}°
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {weatherData.current.condition}
            </span>
          </div>
        </div>

        {/* Secondary metrics - compact inline */}
        <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-500">
          <span>{t('weather.feels')} {Math.round(weatherData.current.feelsLike)}°</span>
          <div className="flex items-center space-x-0.5">
            <Wind className="h-3 w-3" />
            <span>{Math.round(weatherData.current.windSpeed)} {t('weather.mph')}</span>
          </div>
          <div className="flex items-center space-x-0.5">
            <Droplets className="h-3 w-3" />
            <span>{weatherData.current.humidity}%</span>
          </div>
        </div>
      </div>

      {/* Right: 5-Day Forecast */}
      {weatherData.forecast && weatherData.forecast.length > 0 && (
        <div className="flex-1 border-l border-gray-200 dark:border-gray-700 pl-6">
          <div className="flex items-center justify-between gap-3">
            {weatherData.forecast.slice(0, 5).map((day, index) => {
              const dayDate = new Date(day.date);
              const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });

              return (
                <div
                  key={index}
                  className="flex flex-col items-center space-y-1 cursor-pointer transition-all duration-300 ease-in-out rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                  onMouseEnter={() => setHoveredForecastIndex(index)}
                  onMouseLeave={() => setHoveredForecastIndex(null)}
                  style={{
                    transform: hoveredForecastIndex === index ? 'translateY(-2px)' : 'translateY(0)'
                  }}
                  aria-label={`${dayName}: ${day.condition}, High ${Math.round(day.maxTemp)} degrees, Low ${Math.round(day.minTemp)} degrees`}
                  role="button"
                  tabIndex={0}
                >
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {dayName}
                  </span>
                  <div
                    style={{
                      transform: hoveredForecastIndex === index ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.3s ease-in-out'
                    }}
                  >
                    <ReactAnimatedWeather
                      icon={getWeatherIcon(day.condition)}
                      color="#9ca3af"
                      size={24}
                      animate={hoveredForecastIndex === index}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    {Math.round(day.maxTemp)}°
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {Math.round(day.minTemp)}°
                  </span>
                  {day.chanceOfRain > 0 && (
                    <span className="text-xs text-blue-500 dark:text-blue-400">
                      {day.chanceOfRain}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;
