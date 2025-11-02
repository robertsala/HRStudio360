import { supabase } from './supabaseClient';

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
    let recentFactIds: string[] = [];

    if (employeeId) {
      const { data: recentFacts } = await supabase
        .from('employee_fun_fact_history')
        .select('fun_fact_id')
        .eq('employee_id', employeeId)
        .order('shown_at', { ascending: false })
        .limit(10);

      if (recentFacts) {
        recentFactIds = recentFacts.map(f => f.fun_fact_id);
      }
    }

    let query = supabase
      .from('paycheck_fun_facts')
      .select('*')
      .eq('enabled', true)
      .lte('min_amount', netPayAmount)
      .gte('max_amount', netPayAmount);

    if (recentFactIds.length > 0) {
      query = query.not('id', 'in', `(${recentFactIds.join(',')})`);
    }

    const { data: funFacts, error } = await query;

    if (error) {
      console.error('Error fetching fun facts:', error);
      return null;
    }

    if (!funFacts || funFacts.length === 0) {
      const { data: fallbackFacts } = await supabase
        .from('paycheck_fun_facts')
        .select('*')
        .eq('enabled', true)
        .lte('min_amount', netPayAmount)
        .gte('max_amount', netPayAmount);

      if (!fallbackFacts || fallbackFacts.length === 0) {
        return null;
      }

      const randomFact = fallbackFacts[Math.floor(Math.random() * fallbackFacts.length)];
      const factText = replacePlaceholders(randomFact.fact_template, netPayAmount, randomFact.category);

      return {
        text: factText,
        category: randomFact.category,
        funFactId: randomFact.id
      };
    }

    const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
    const factText = replacePlaceholders(randomFact.fact_template, netPayAmount, randomFact.category);

    return {
      text: factText,
      category: randomFact.category,
      funFactId: randomFact.id
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
  try {
    await supabase
      .from('employee_fun_fact_history')
      .insert({
        employee_id: employeeId,
        pay_stub_id: payStubId,
        fun_fact_id: funFactId,
        fun_fact_text: funFactText
      });
  } catch (error) {
    console.error('Error saving fun fact history:', error);
  }
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('daily_fun_fact_usage')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('is_manual_generation', true)
      .gte('generated_at', today.toISOString())
      .lt('generated_at', tomorrow.toISOString());

    if (error) {
      console.error('Error fetching daily usage:', error);
      return {
        currentCount: 0,
        dailyLimit: DAILY_FUN_FACT_LIMIT,
        hasReachedLimit: false,
        remainingGenerations: DAILY_FUN_FACT_LIMIT
      };
    }

    const currentCount = data?.length || 0;
    const hasReachedLimit = currentCount >= DAILY_FUN_FACT_LIMIT;
    const remainingGenerations = Math.max(0, DAILY_FUN_FACT_LIMIT - currentCount);

    return {
      currentCount,
      dailyLimit: DAILY_FUN_FACT_LIMIT,
      hasReachedLimit,
      remainingGenerations
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
  try {
    const usageInfo = await getDailyUsageInfo(employeeId);

    if (usageInfo.hasReachedLimit) {
      return false;
    }

    const { error } = await supabase
      .from('daily_fun_fact_usage')
      .insert({
        employee_id: employeeId,
        fun_fact_id: funFactId,
        is_manual_generation: true,
        generated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error tracking fun fact generation:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in trackManualFunFactGeneration:', error);
    return false;
  }
};

export const getManualFunFact = async (
  netPayAmount: number,
  employeeId: string
): Promise<{ funFact: FunFactResult | null; usageInfo: DailyUsageInfo }> => {
  try {
    const usageInfo = await getDailyUsageInfo(employeeId);

    if (usageInfo.hasReachedLimit) {
      return {
        funFact: null,
        usageInfo
      };
    }

    const funFact = await getRandomFunFact(netPayAmount, employeeId);

    if (funFact) {
      const tracked = await trackManualFunFactGeneration(employeeId, funFact.funFactId);

      if (tracked) {
        await saveFunFactHistory(employeeId, null, funFact.funFactId, funFact.text);

        const updatedUsageInfo = await getDailyUsageInfo(employeeId);

        return {
          funFact,
          usageInfo: updatedUsageInfo
        };
      }
    }

    return {
      funFact,
      usageInfo
    };
  } catch (error) {
    console.error('Error generating manual fun fact:', error);
    return {
      funFact: null,
      usageInfo: await getDailyUsageInfo(employeeId)
    };
  }
};
