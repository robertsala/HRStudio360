export interface MetNoWeatherSymbol {
  code: string;
  description: string;
  animatedIcon: string;
}

const weatherSymbolMap: Record<string, MetNoWeatherSymbol> = {
  'clearsky_day': { code: 'clearsky_day', description: 'Clear sky', animatedIcon: 'CLEAR_DAY' },
  'clearsky_night': { code: 'clearsky_night', description: 'Clear sky', animatedIcon: 'CLEAR_NIGHT' },
  'clearsky_polartwilight': { code: 'clearsky_polartwilight', description: 'Clear sky', animatedIcon: 'CLEAR_DAY' },
  'fair_day': { code: 'fair_day', description: 'Fair', animatedIcon: 'PARTLY_CLOUDY_DAY' },
  'fair_night': { code: 'fair_night', description: 'Fair', animatedIcon: 'PARTLY_CLOUDY_NIGHT' },
  'fair_polartwilight': { code: 'fair_polartwilight', description: 'Fair', animatedIcon: 'PARTLY_CLOUDY_DAY' },
  'partlycloudy_day': { code: 'partlycloudy_day', description: 'Partly cloudy', animatedIcon: 'PARTLY_CLOUDY_DAY' },
  'partlycloudy_night': { code: 'partlycloudy_night', description: 'Partly cloudy', animatedIcon: 'PARTLY_CLOUDY_NIGHT' },
  'partlycloudy_polartwilight': { code: 'partlycloudy_polartwilight', description: 'Partly cloudy', animatedIcon: 'PARTLY_CLOUDY_DAY' },
  'cloudy': { code: 'cloudy', description: 'Cloudy', animatedIcon: 'CLOUDY' },
  'rainshowers_day': { code: 'rainshowers_day', description: 'Rain showers', animatedIcon: 'RAIN' },
  'rainshowers_night': { code: 'rainshowers_night', description: 'Rain showers', animatedIcon: 'RAIN' },
  'rainshowers_polartwilight': { code: 'rainshowers_polartwilight', description: 'Rain showers', animatedIcon: 'RAIN' },
  'rainshowersandthunder_day': { code: 'rainshowersandthunder_day', description: 'Rain showers and thunder', animatedIcon: 'RAIN' },
  'rainshowersandthunder_night': { code: 'rainshowersandthunder_night', description: 'Rain showers and thunder', animatedIcon: 'RAIN' },
  'rainshowersandthunder_polartwilight': { code: 'rainshowersandthunder_polartwilight', description: 'Rain showers and thunder', animatedIcon: 'RAIN' },
  'sleetshowers_day': { code: 'sleetshowers_day', description: 'Sleet showers', animatedIcon: 'SLEET' },
  'sleetshowers_night': { code: 'sleetshowers_night', description: 'Sleet showers', animatedIcon: 'SLEET' },
  'sleetshowers_polartwilight': { code: 'sleetshowers_polartwilight', description: 'Sleet showers', animatedIcon: 'SLEET' },
  'snowshowers_day': { code: 'snowshowers_day', description: 'Snow showers', animatedIcon: 'SNOW' },
  'snowshowers_night': { code: 'snowshowers_night', description: 'Snow showers', animatedIcon: 'SNOW' },
  'snowshowers_polartwilight': { code: 'snowshowers_polartwilight', description: 'Snow showers', animatedIcon: 'SNOW' },
  'rain': { code: 'rain', description: 'Rain', animatedIcon: 'RAIN' },
  'heavyrain': { code: 'heavyrain', description: 'Heavy rain', animatedIcon: 'RAIN' },
  'heavyrainandthunder': { code: 'heavyrainandthunder', description: 'Heavy rain and thunder', animatedIcon: 'RAIN' },
  'sleet': { code: 'sleet', description: 'Sleet', animatedIcon: 'SLEET' },
  'snow': { code: 'snow', description: 'Snow', animatedIcon: 'SNOW' },
  'snowandthunder': { code: 'snowandthunder', description: 'Snow and thunder', animatedIcon: 'SNOW' },
  'fog': { code: 'fog', description: 'Fog', animatedIcon: 'FOG' },
  'sleetshowersandthunder_day': { code: 'sleetshowersandthunder_day', description: 'Sleet showers and thunder', animatedIcon: 'SLEET' },
  'sleetshowersandthunder_night': { code: 'sleetshowersandthunder_night', description: 'Sleet showers and thunder', animatedIcon: 'SLEET' },
  'sleetshowersandthunder_polartwilight': { code: 'sleetshowersandthunder_polartwilight', description: 'Sleet showers and thunder', animatedIcon: 'SLEET' },
  'snowshowersandthunder_day': { code: 'snowshowersandthunder_day', description: 'Snow showers and thunder', animatedIcon: 'SNOW' },
  'snowshowersandthunder_night': { code: 'snowshowersandthunder_night', description: 'Snow showers and thunder', animatedIcon: 'SNOW' },
  'snowshowersandthunder_polartwilight': { code: 'snowshowersandthunder_polartwilight', description: 'Snow showers and thunder', animatedIcon: 'SNOW' },
  'rainandthunder': { code: 'rainandthunder', description: 'Rain and thunder', animatedIcon: 'RAIN' },
  'sleetandthunder': { code: 'sleetandthunder', description: 'Sleet and thunder', animatedIcon: 'SLEET' },
  'lightrainshowersandthunder_day': { code: 'lightrainshowersandthunder_day', description: 'Light rain showers and thunder', animatedIcon: 'RAIN' },
  'lightrainshowersandthunder_night': { code: 'lightrainshowersandthunder_night', description: 'Light rain showers and thunder', animatedIcon: 'RAIN' },
  'lightrainshowersandthunder_polartwilight': { code: 'lightrainshowersandthunder_polartwilight', description: 'Light rain showers and thunder', animatedIcon: 'RAIN' },
  'heavyrainshowersandthunder_day': { code: 'heavyrainshowersandthunder_day', description: 'Heavy rain showers and thunder', animatedIcon: 'RAIN' },
  'heavyrainshowersandthunder_night': { code: 'heavyrainshowersandthunder_night', description: 'Heavy rain showers and thunder', animatedIcon: 'RAIN' },
  'heavyrainshowersandthunder_polartwilight': { code: 'heavyrainshowersandthunder_polartwilight', description: 'Heavy rain showers and thunder', animatedIcon: 'RAIN' },
  'lightssleetshowersandthunder_day': { code: 'lightssleetshowersandthunder_day', description: 'Light sleet showers and thunder', animatedIcon: 'SLEET' },
  'lightssleetshowersandthunder_night': { code: 'lightssleetshowersandthunder_night', description: 'Light sleet showers and thunder', animatedIcon: 'SLEET' },
  'lightssleetshowersandthunder_polartwilight': { code: 'lightssleetshowersandthunder_polartwilight', description: 'Light sleet showers and thunder', animatedIcon: 'SLEET' },
  'heavysleetshowersandthunder_day': { code: 'heavysleetshowersandthunder_day', description: 'Heavy sleet showers and thunder', animatedIcon: 'SLEET' },
  'heavysleetshowersandthunder_night': { code: 'heavysleetshowersandthunder_night', description: 'Heavy sleet showers and thunder', animatedIcon: 'SLEET' },
  'heavysleetshowersandthunder_polartwilight': { code: 'heavysleetshowersandthunder_polartwilight', description: 'Heavy sleet showers and thunder', animatedIcon: 'SLEET' },
  'lightssnowshowersandthunder_day': { code: 'lightssnowshowersandthunder_day', description: 'Light snow showers and thunder', animatedIcon: 'SNOW' },
  'lightssnowshowersandthunder_night': { code: 'lightssnowshowersandthunder_night', description: 'Light snow showers and thunder', animatedIcon: 'SNOW' },
  'lightssnowshowersandthunder_polartwilight': { code: 'lightssnowshowersandthunder_polartwilight', description: 'Light snow showers and thunder', animatedIcon: 'SNOW' },
  'heavysnowshowersandthunder_day': { code: 'heavysnowshowersandthunder_day', description: 'Heavy snow showers and thunder', animatedIcon: 'SNOW' },
  'heavysnowshowersandthunder_night': { code: 'heavysnowshowersandthunder_night', description: 'Heavy snow showers and thunder', animatedIcon: 'SNOW' },
  'heavysnowshowersandthunder_polartwilight': { code: 'heavysnowshowersandthunder_polartwilight', description: 'Heavy snow showers and thunder', animatedIcon: 'SNOW' },
  'lightrainandthunder': { code: 'lightrainandthunder', description: 'Light rain and thunder', animatedIcon: 'RAIN' },
  'lightsleetandthunder': { code: 'lightsleetandthunder', description: 'Light sleet and thunder', animatedIcon: 'SLEET' },
  'heavysleetandthunder': { code: 'heavysleetandthunder', description: 'Heavy sleet and thunder', animatedIcon: 'SLEET' },
  'lightsnowandthunder': { code: 'lightsnowandthunder', description: 'Light snow and thunder', animatedIcon: 'SNOW' },
  'heavysnowandthunder': { code: 'heavysnowandthunder', description: 'Heavy snow and thunder', animatedIcon: 'SNOW' },
  'lightrainshowers_day': { code: 'lightrainshowers_day', description: 'Light rain showers', animatedIcon: 'RAIN' },
  'lightrainshowers_night': { code: 'lightrainshowers_night', description: 'Light rain showers', animatedIcon: 'RAIN' },
  'lightrainshowers_polartwilight': { code: 'lightrainshowers_polartwilight', description: 'Light rain showers', animatedIcon: 'RAIN' },
  'heavyrainshowers_day': { code: 'heavyrainshowers_day', description: 'Heavy rain showers', animatedIcon: 'RAIN' },
  'heavyrainshowers_night': { code: 'heavyrainshowers_night', description: 'Heavy rain showers', animatedIcon: 'RAIN' },
  'heavyrainshowers_polartwilight': { code: 'heavyrainshowers_polartwilight', description: 'Heavy rain showers', animatedIcon: 'RAIN' },
  'lightsleetshowers_day': { code: 'lightsleetshowers_day', description: 'Light sleet showers', animatedIcon: 'SLEET' },
  'lightsleetshowers_night': { code: 'lightsleetshowers_night', description: 'Light sleet showers', animatedIcon: 'SLEET' },
  'lightsleetshowers_polartwilight': { code: 'lightsleetshowers_polartwilight', description: 'Light sleet showers', animatedIcon: 'SLEET' },
  'heavysleetshowers_day': { code: 'heavysleetshowers_day', description: 'Heavy sleet showers', animatedIcon: 'SLEET' },
  'heavysleetshowers_night': { code: 'heavysleetshowers_night', description: 'Heavy sleet showers', animatedIcon: 'SLEET' },
  'heavysleetshowers_polartwilight': { code: 'heavysleetshowers_polartwilight', description: 'Heavy sleet showers', animatedIcon: 'SLEET' },
  'lightsnowshowers_day': { code: 'lightsnowshowers_day', description: 'Light snow showers', animatedIcon: 'SNOW' },
  'lightsnowshowers_night': { code: 'lightsnowshowers_night', description: 'Light snow showers', animatedIcon: 'SNOW' },
  'lightsnowshowers_polartwilight': { code: 'lightsnowshowers_polartwilight', description: 'Light snow showers', animatedIcon: 'SNOW' },
  'heavysnowshowers_day': { code: 'heavysnowshowers_day', description: 'Heavy snow showers', animatedIcon: 'SNOW' },
  'heavysnowshowers_night': { code: 'heavysnowshowers_night', description: 'Heavy snow showers', animatedIcon: 'SNOW' },
  'heavysnowshowers_polartwilight': { code: 'heavysnowshowers_polartwilight', description: 'Heavy snow showers', animatedIcon: 'SNOW' },
  'lightrain': { code: 'lightrain', description: 'Light rain', animatedIcon: 'RAIN' },
  'lightsleet': { code: 'lightsleet', description: 'Light sleet', animatedIcon: 'SLEET' },
  'heavysleet': { code: 'heavysleet', description: 'Heavy sleet', animatedIcon: 'SLEET' },
  'lightsnow': { code: 'lightsnow', description: 'Light snow', animatedIcon: 'SNOW' },
  'heavysnow': { code: 'heavysnow', description: 'Heavy snow', animatedIcon: 'SNOW' },
};

export function getWeatherSymbol(symbolCode: string): MetNoWeatherSymbol {
  const symbol = weatherSymbolMap[symbolCode];
  if (symbol) {
    return symbol;
  }

  console.warn(`Unknown weather symbol code: ${symbolCode}`);
  return {
    code: symbolCode,
    description: 'Unknown',
    animatedIcon: 'CLOUDY',
  };
}

export function getAnimatedIconType(symbolCode: string): string {
  return getWeatherSymbol(symbolCode).animatedIcon;
}

export function getWeatherDescription(symbolCode: string): string {
  return getWeatherSymbol(symbolCode).description;
}
