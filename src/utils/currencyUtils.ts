export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  is_active: boolean;
}

export interface CurrencyAmount {
  amount: number;
  currency: string;
}

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  INR: '₹',
  MXN: 'MXN',
  BRL: 'R$',
  JPY: '¥',
  SGD: 'S$',
  PLN: 'zł'
};

export const getCurrencySymbol = (currencyCode: string): string => {
  return currencySymbols[currencyCode] || currencyCode;
};

export const formatCurrency = (amount: number, currencyCode: string = 'USD', includeCode: boolean = false): string => {
  const symbol = getCurrencySymbol(currencyCode);
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  if (includeCode && currencyCode !== 'USD') {
    return `${symbol}${formattedAmount} ${currencyCode}`;
  }

  return `${symbol}${formattedAmount}`;
};

export const groupByCurrency = <T extends { currency?: string }>(
  items: T[]
): Record<string, T[]> => {
  return items.reduce((acc, item) => {
    const currency = item.currency || 'USD';
    if (!acc[currency]) {
      acc[currency] = [];
    }
    acc[currency].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

export const sumByCurrency = (amounts: CurrencyAmount[]): Record<string, number> => {
  return amounts.reduce((acc, { amount, currency }) => {
    const curr = currency || 'USD';
    acc[curr] = (acc[curr] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);
};

export const getCurrencyFlag = (currencyCode: string): string => {
  const flagEmojis: Record<string, string> = {
    USD: '🇺🇸',
    EUR: '🇪🇺',
    GBP: '🇬🇧',
    CAD: '🇨🇦',
    AUD: '🇦🇺',
    INR: '🇮🇳',
    MXN: '🇲🇽',
    BRL: '🇧🇷',
    JPY: '🇯🇵',
    SGD: '🇸🇬',
    PLN: '🇵🇱'
  };

  return flagEmojis[currencyCode] || '🌍';
};
