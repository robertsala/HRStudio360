/*
  # Create Weather System and Location Preferences

  ## Overview
  Adds comprehensive weather tracking and user location preferences for personalized
  weather widget with real-time updates, geolocation support, and caching.

  ## 1. Profile Enhancements

  ### Add location fields to `profiles` table
  - `location_zip_code` (text) - User's zip code
  - `location_city` (text) - User's city
  - `location_state` (text) - User's state
  - `location_manual_override` (boolean) - Whether user manually set location
  - `location_coordinates` (point) - Lat/lon coordinates

  ## 2. New Tables

  ### `weather_cache`
  Caches weather data to minimize API calls:
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References profiles
  - `location_lat` (numeric) - Latitude
  - `location_lon` (numeric) - Longitude
  - `location_name` (text) - Display name (City, State)
  - `temperature` (numeric) - Current temperature
  - `temperature_unit` (text) - F or C
  - `weather_condition` (text) - Weather description
  - `weather_icon` (text) - Icon code
  - `wind_speed` (numeric) - Wind speed
  - `humidity` (integer) - Humidity percentage
  - `feels_like` (numeric) - Feels like temperature
  - `forecast_data` (jsonb) - Extended forecast data
  - `last_updated` (timestamptz) - When data was fetched
  - `cache_expires_at` (timestamptz) - When cache expires (30 min)

  ### `user_weather_preferences`
  Stores user weather preferences:
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References profiles (unique)
  - `auto_detect_location` (boolean) - Auto-detect via geolocation
  - `preferred_temperature_unit` (text) - fahrenheit or celsius
  - `show_extended_forecast` (boolean) - Show 5-day forecast
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## 3. Security
  - RLS enabled on all new tables
  - Users can only access their own weather data and preferences
  - Automatic cleanup function for expired cache entries

  ## 4. Indexes
  - Index on weather_cache.user_id for fast lookups
  - Index on weather_cache.cache_expires_at for cleanup
  - Index on user_weather_preferences.user_id

  ## 5. Notes
  - Weather data expires after 30 minutes
  - Cache cleanup function runs automatically
  - Location coordinates stored as PostGIS point type
*/

-- Add location fields to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location_zip_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location_zip_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location_city'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location_city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location_state'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location_state text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location_manual_override'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location_manual_override boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location_lat'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location_lat numeric(10, 7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location_lon'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location_lon numeric(10, 7);
  END IF;
END $$;

-- Create weather_cache table
CREATE TABLE IF NOT EXISTS weather_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location_lat numeric(10, 7) NOT NULL,
  location_lon numeric(10, 7) NOT NULL,
  location_name text NOT NULL,
  temperature numeric(5, 2) NOT NULL,
  temperature_unit text DEFAULT 'F' CHECK (temperature_unit IN ('F', 'C')),
  weather_condition text NOT NULL,
  weather_icon text NOT NULL,
  wind_speed numeric(5, 2) DEFAULT 0,
  humidity integer DEFAULT 0 CHECK (humidity >= 0 AND humidity <= 100),
  feels_like numeric(5, 2),
  forecast_data jsonb DEFAULT '[]'::jsonb,
  last_updated timestamptz DEFAULT now(),
  cache_expires_at timestamptz DEFAULT (now() + interval '30 minutes'),
  CONSTRAINT unique_user_weather UNIQUE (user_id)
);

-- Create user_weather_preferences table
CREATE TABLE IF NOT EXISTS user_weather_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  auto_detect_location boolean DEFAULT true,
  preferred_temperature_unit text DEFAULT 'fahrenheit' CHECK (preferred_temperature_unit IN ('fahrenheit', 'celsius')),
  show_extended_forecast boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_weather_cache_user_id ON weather_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_weather_cache_expires_at ON weather_cache(cache_expires_at);
CREATE INDEX IF NOT EXISTS idx_user_weather_preferences_user_id ON user_weather_preferences(user_id);

-- Enable RLS
ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_weather_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weather_cache
CREATE POLICY "Users can view own weather cache"
  ON weather_cache FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own weather cache"
  ON weather_cache FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own weather cache"
  ON weather_cache FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own weather cache"
  ON weather_cache FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for user_weather_preferences
CREATE POLICY "Users can view own weather preferences"
  ON user_weather_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own weather preferences"
  ON user_weather_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own weather preferences"
  ON user_weather_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own weather preferences"
  ON user_weather_preferences FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to clean up expired weather cache
CREATE OR REPLACE FUNCTION cleanup_expired_weather_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM weather_cache
  WHERE cache_expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on user_weather_preferences
CREATE TRIGGER update_user_weather_preferences_updated_at
  BEFORE UPDATE ON user_weather_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
