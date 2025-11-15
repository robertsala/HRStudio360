// Daily limit configuration - users can manually generate up to this many fun facts per day
const DAILY_FUN_FACT_LIMIT = 3;

export interface PaycheckFunFact {
  id: string;
  category: string;
  minAmount: number;
  maxAmount: number;
  factTemplate: string;
  enabled: boolean;
}

export interface FunFactResult {
  text: string;
  category: string;
  funFactId: string;
}

export interface DailyUsageInfo {
  currentCount: number;
  dailyLimit: number;
  hasReachedLimit: boolean;
  remainingGenerations: number;
}

const calculateEquivalents = (amount: number, category: string): { [key: string]: number } => {
  const calculations: { [key: string]: { [key: string]: number } } = {
    animals: {
      chickens: Math.floor(amount / 25),
      guineaPigs: Math.floor(amount / 40),
      sheep: Math.floor(amount / 200),
      alpacas: Math.floor(amount / 1000),
      horses: Math.floor(amount / 3000)
    },
    food: {
      coffee: Math.floor(amount / 6),
      avocadoToast: Math.floor(amount / 15),
      pizzas: Math.floor(amount / 25),
      friends: Math.floor(amount / 150),
      champagneBottles: Math.floor(amount / 80),
      steakPounds: Math.floor(amount / 30)
    },
    entertainment: {
      streamingMonths: Math.floor(amount / 45),
      concertTickets: Math.floor(amount / 75),
      gamingConsoles: Math.floor(amount / 500),
      festivalPasses: Math.floor(amount / 350),
      theaterSystems: Math.floor(amount / 1500),
      superBowlTickets: Math.floor(amount / 4000)
    },
    travel: {
      miles: Math.floor(amount / 0.5),
      bnbNights: Math.floor(amount / 120),
      resortNights: Math.floor(amount / 350)
    },
    quirky: {
      rubberDucks: Math.floor(amount / 3),
      fountainPens: Math.floor(amount / 50),
      typewriters: Math.floor(amount / 150),
      telescopes: Math.floor(amount / 800),
      saffronPounds: Math.floor(amount / 500)
    },
    technology: {
      cloudStorageMonths: Math.floor(amount / 15),
      smartwatches: Math.floor(amount / 250),
      smartphones: Math.floor(amount / 800),
      laptops: Math.floor(amount / 1200),
      cameras: Math.floor(amount / 2000),
      gamingPCs: Math.floor(amount / 2500)
    },
    sports: {
      gymMonths: Math.floor(amount / 50),
      runningShoes: Math.floor(amount / 150),
      bicycles: Math.floor(amount / 500),
      homeGyms: Math.floor(amount / 1500),
      paddleBoards: Math.floor(amount / 600),
      seasonTickets: Math.floor(amount / 2000)
    },
    education: {
      books: Math.floor(amount / 20),
      onlineCourses: Math.floor(amount / 50),
      certifications: Math.floor(amount / 300),
      collegeCourses: Math.floor(amount / 800),
      collections: Math.floor(amount / 150)
    }
  };

  return calculations[category] || {};
};

const replacePlaceholders = (template: string, amount: number, category: string): string => {
  let result = template.replace(/\$\{amount\}/g, amount.toFixed(2));

  const equivalents = calculateEquivalents(amount, category);

  for (const [key, value] of Object.entries(equivalents)) {
    const placeholder = `{${key}}`;
    if (template.includes('{count}')) {
      result = result.replace('{count}', value.toString());
      break;
    }
    result = result.replace(placeholder, value.toString());
  }

  result = result.replace(/\{count\}/g, Math.floor(amount / 10).toString());

  return result;
};

export const getRandomFunFact = async (
  netPayAmount: number,
  employeeId?: string
): Promise<FunFactResult | null> => {
  try {
    if (!employeeId) {
      console.warn('No employeeId provided for fun fact generation');
      return null;
    }

    const response = await fetch(`/api/fun-facts/random?amount=${netPayAmount}&employeeId=${employeeId}`);
    
    if (!response.ok) {
      console.error('Error fetching fun fact:', response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (!data.funFact) {
      return null;
    }

    const factText = replacePlaceholders(data.funFact.factTemplate, netPayAmount, data.funFact.category);

    return {
      text: factText,
      category: data.funFact.category,
      funFactId: data.funFact.id
    };
  } catch (error) {
    console.error('Error generating fun fact:', error);
    return null;
  }
};

export const saveFunFactHistory = async (
  employeeId: string,
  payStubId: string | null,
  funFactId: string,
  funFactText: string
): Promise<void> => {
  // This function is now handled by the API endpoints
  // No need to call separately as it's included in the manual generation endpoint
  console.log('Fun fact history saved via API');
};

export const getFunFactForPayStub = async (
  netPayAmount: number,
  employeeId: string
): Promise<FunFactResult | null> => {
  const funFact = await getRandomFunFact(netPayAmount, employeeId);

  if (funFact && employeeId) {
    await saveFunFactHistory(employeeId, null, funFact.funFactId, funFact.text);
  }

  return funFact;
};

export const getCategoryIcon = (category: string): string => {
  const icons: { [key: string]: string } = {
    historical: '🏛️',
    animals: '🐄',
    food: '🍕',
    entertainment: '🎬',
    travel: '✈️',
    quirky: '🎪',
    technology: '💻',
    sports: '⚽',
    education: '📚'
  };

  return icons[category] || '💰';
};

export const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    historical: 'amber',
    animals: 'green',
    food: 'orange',
    entertainment: 'purple',
    travel: 'blue',
    quirky: 'pink',
    technology: 'cyan',
    sports: 'red',
    education: 'indigo'
  };

  return colors[category] || 'gray';
};

export const getDailyUsageInfo = async (employeeId: string): Promise<DailyUsageInfo> => {
  try {
    const response = await fetch(`/api/fun-facts/daily-usage/${employeeId}`);
    
    if (!response.ok) {
      console.error('Error fetching daily usage:', response.statusText);
      return {
        currentCount: 0,
        dailyLimit: DAILY_FUN_FACT_LIMIT,
        hasReachedLimit: false,
        remainingGenerations: DAILY_FUN_FACT_LIMIT
      };
    }

    const data = await response.json();
    
    return {
      currentCount: data.count,
      dailyLimit: data.limit,
      hasReachedLimit: data.remaining === 0,
      remainingGenerations: data.remaining
    };
  } catch (error) {
    console.error('Error getting daily usage info:', error);
    return {
      currentCount: 0,
      dailyLimit: DAILY_FUN_FACT_LIMIT,
      hasReachedLimit: false,
      remainingGenerations: DAILY_FUN_FACT_LIMIT
    };
  }
};

export const trackManualFunFactGeneration = async (
  employeeId: string,
  funFactId: string
): Promise<boolean> => {
  // This function is now handled by the API endpoints
  // Tracking happens automatically in the manual generation endpoint
  return true;
};

export const getManualFunFact = async (
  netPayAmount: number,
  employeeId: string
): Promise<{ funFact: FunFactResult | null; usageInfo: DailyUsageInfo }> => {
  try {
    const response = await fetch('/api/fun-facts/manual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: netPayAmount,
        employeeId
      })
    });

    if (response.status === 429) {
      // Daily limit reached
      const usageInfo = await getDailyUsageInfo(employeeId);
      return {
        funFact: null,
        usageInfo
      };
    }

    if (!response.ok) {
      console.error('Error generating manual fun fact:', response.statusText);
      const usageInfo = await getDailyUsageInfo(employeeId);
      return {
        funFact: null,
        usageInfo
      };
    }

    const data = await response.json();
    
    const usageInfo: DailyUsageInfo = {
      currentCount: data.usageInfo.count,
      dailyLimit: data.usageInfo.limit,
      hasReachedLimit: data.usageInfo.remaining === 0,
      remainingGenerations: data.usageInfo.remaining
    };
    
    if (!data.funFact) {
      return {
        funFact: null,
        usageInfo
      };
    }

    const factText = replacePlaceholders(data.funFact.factTemplate, netPayAmount, data.funFact.category);

    return {
      funFact: {
        text: factText,
        category: data.funFact.category,
        funFactId: data.funFact.id
      },
      usageInfo
    };
  } catch (error) {
    console.error('Error generating manual fun fact:', error);
    const usageInfo = await getDailyUsageInfo(employeeId);
    return {
      funFact: null,
      usageInfo
    };
  }
};
