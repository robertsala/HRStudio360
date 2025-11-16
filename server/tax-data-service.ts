import type { InsertTaxDataSource, TaxDataSource } from '@shared/schema';

export interface FederalTaxBracket {
  minIncome: number;
  maxIncome: number | null; // null means no upper limit
  rate: number; // decimal (e.g., 0.10 for 10%)
  baseAmount: number;
}

export interface FederalTaxBrackets {
  single: FederalTaxBracket[];
  married_joint: FederalTaxBracket[];
  head_of_household: FederalTaxBracket[];
}

export interface StandardDeductions {
  single: number;
  married_joint: number;
  head_of_household: number;
  senior_additional_single: number;
  senior_additional_joint: number;
}

export interface FederalTaxData {
  taxYear: number;
  brackets: FederalTaxBrackets;
  standardDeductions: StandardDeductions;
  socialSecurityRate: number;
  medicareRate: number;
  additionalMedicareRate: number;
  additionalMedicareThreshold: number;
  supplementalWageRate: number;
  supplementalWageRateOver1M: number;
}

export interface ReciprocalAgreementData {
  workState: string;
  workStateName: string;
  residenceStates: string[];
  exemptionForm: string;
  notes?: string;
}

export const FEDERAL_TAX_DATA_2025: FederalTaxData = {
  taxYear: 2025,
  brackets: {
    single: [
      { minIncome: 0, maxIncome: 11925, rate: 0.10, baseAmount: 0 },
      { minIncome: 11925, maxIncome: 48475, rate: 0.12, baseAmount: 1192.50 },
      { minIncome: 48475, maxIncome: 103350, rate: 0.22, baseAmount: 5578.50 },
      { minIncome: 103350, maxIncome: 197300, rate: 0.24, baseAmount: 17651.00 },
      { minIncome: 197300, maxIncome: 250525, rate: 0.32, baseAmount: 40199.00 },
      { minIncome: 250525, maxIncome: 626350, rate: 0.35, baseAmount: 57231.00 },
      { minIncome: 626350, maxIncome: null, rate: 0.37, baseAmount: 188769.75 }
    ],
    married_joint: [
      { minIncome: 0, maxIncome: 23850, rate: 0.10, baseAmount: 0 },
      { minIncome: 23850, maxIncome: 96950, rate: 0.12, baseAmount: 2385.00 },
      { minIncome: 96950, maxIncome: 206700, rate: 0.22, baseAmount: 11157.00 },
      { minIncome: 206700, maxIncome: 394600, rate: 0.24, baseAmount: 35302.00 },
      { minIncome: 394600, maxIncome: 501050, rate: 0.32, baseAmount: 80398.00 },
      { minIncome: 501050, maxIncome: 751600, rate: 0.35, baseAmount: 114462.00 },
      { minIncome: 751600, maxIncome: null, rate: 0.37, baseAmount: 202154.50 }
    ],
    head_of_household: [
      { minIncome: 0, maxIncome: 17000, rate: 0.10, baseAmount: 0 },
      { minIncome: 17000, maxIncome: 64850, rate: 0.12, baseAmount: 1700.00 },
      { minIncome: 64850, maxIncome: 103350, rate: 0.22, baseAmount: 7442.00 },
      { minIncome: 103350, maxIncome: 197300, rate: 0.24, baseAmount: 15912.00 },
      { minIncome: 197300, maxIncome: 250500, rate: 0.32, baseAmount: 38460.00 },
      { minIncome: 250500, maxIncome: 626350, rate: 0.35, baseAmount: 55484.00 },
      { minIncome: 626350, maxIncome: null, rate: 0.37, baseAmount: 187031.50 }
    ]
  },
  standardDeductions: {
    single: 15000,
    married_joint: 30000,
    head_of_household: 22500,
    senior_additional_single: 2000,
    senior_additional_joint: 1600
  },
  socialSecurityRate: 0.062, // 6.2%
  medicareRate: 0.0145, // 1.45%
  additionalMedicareRate: 0.009, // 0.9% on earnings over threshold
  additionalMedicareThreshold: 200000, // $200K single, $250K joint
  supplementalWageRate: 0.22, // 22% for bonuses/commissions up to $1M
  supplementalWageRateOver1M: 0.37 // 37% for supplemental wages over $1M
};

export const STATE_RECIPROCAL_AGREEMENTS_2025: ReciprocalAgreementData[] = [
  {
    workState: 'AZ',
    workStateName: 'Arizona',
    residenceStates: ['CA', 'IN', 'OR', 'VA'],
    exemptionForm: 'Form WEC'
  },
  {
    workState: 'DC',
    workStateName: 'District of Columbia',
    residenceStates: ['ALL'], // One-way agreement
    exemptionForm: 'Form D-4A',
    notes: 'One-way agreement: DC residents working in any state exempt from DC tax'
  },
  {
    workState: 'IL',
    workStateName: 'Illinois',
    residenceStates: ['IA', 'KY', 'MI', 'WI'],
    exemptionForm: 'Form IL-W-5-NR'
  },
  {
    workState: 'IN',
    workStateName: 'Indiana',
    residenceStates: ['KY', 'MI', 'OH', 'PA', 'WI'],
    exemptionForm: 'Form WH-47',
    notes: 'Unilateral agreement with any state offering similar treatment'
  },
  {
    workState: 'IA',
    workStateName: 'Iowa',
    residenceStates: ['IL'],
    exemptionForm: 'Form IA 44-016'
  },
  {
    workState: 'KY',
    workStateName: 'Kentucky',
    residenceStates: ['IL', 'IN', 'MI', 'OH', 'VA', 'WV', 'WI'],
    exemptionForm: 'Form 42A809',
    notes: 'Virginia agreement requires daily commute'
  },
  {
    workState: 'MD',
    workStateName: 'Maryland',
    residenceStates: ['DC', 'PA', 'VA', 'WV'],
    exemptionForm: 'Form MW507'
  },
  {
    workState: 'MI',
    workStateName: 'Michigan',
    residenceStates: ['IL', 'IN', 'KY', 'MN', 'OH', 'WI'],
    exemptionForm: 'Form MI-W4 or custom'
  },
  {
    workState: 'MN',
    workStateName: 'Minnesota',
    residenceStates: ['MI', 'ND'],
    exemptionForm: 'Form MWR',
    notes: 'Unilateral agreement'
  },
  {
    workState: 'MT',
    workStateName: 'Montana',
    residenceStates: ['ND'],
    exemptionForm: 'Form MT-R'
  },
  {
    workState: 'NJ',
    workStateName: 'New Jersey',
    residenceStates: ['PA'],
    exemptionForm: 'Form NJ-165'
  },
  {
    workState: 'ND',
    workStateName: 'North Dakota',
    residenceStates: ['MN', 'MT'],
    exemptionForm: 'Form NDW-R'
  },
  {
    workState: 'OH',
    workStateName: 'Ohio',
    residenceStates: ['IN', 'KY', 'MI', 'PA', 'WV'],
    exemptionForm: 'Form IT 4NR',
    notes: 'Conditional for shareholder-employees'
  },
  {
    workState: 'PA',
    workStateName: 'Pennsylvania',
    residenceStates: ['IN', 'MD', 'NJ', 'OH', 'VA', 'WV'],
    exemptionForm: 'Form REV-419 EX'
  },
  {
    workState: 'VA',
    workStateName: 'Virginia',
    residenceStates: ['DC', 'KY', 'MD', 'PA', 'WV'],
    exemptionForm: 'Form VA-4',
    notes: 'Kentucky agreement requires daily commute'
  },
  {
    workState: 'WV',
    workStateName: 'West Virginia',
    residenceStates: ['KY', 'MD', 'OH', 'PA', 'VA'],
    exemptionForm: 'Form WV/IT-104'
  },
  {
    workState: 'WI',
    workStateName: 'Wisconsin',
    residenceStates: ['IL', 'IN', 'KY', 'MI'],
    exemptionForm: 'Form W-220',
    notes: 'Unilateral agreement'
  }
];

export class TaxDataService {
  static generateFederalTaxDataSource(): Omit<InsertTaxDataSource, 'verifiedBy'> {
    return {
      sourceType: 'irs_publication',
      sourceName: 'IRS Publication 15-T (2025)',
      sourceUrl: 'https://www.irs.gov/pub/irs-pdf/p15t.pdf',
      dataType: 'federal_tax_brackets',
      taxYear: 2025,
      dataVersion: 'Released December 16, 2024',
      lastUpdated: new Date('2024-12-16'),
      lastVerified: new Date(),
      dataPayload: FEDERAL_TAX_DATA_2025,
      confidenceScore: 100,
      notes: 'Official IRS publication containing percentage method tables and standard deductions for 2025. Tax rates made permanent by the One Big Beautiful Bill Act (OBBBA).',
      isActive: true
    };
  }

  static generateReciprocalAgreementsDataSource(): Omit<InsertTaxDataSource, 'verifiedBy'> {
    return {
      sourceType: 'state_websites',
      sourceName: 'State Reciprocal Agreement Compilation (2025)',
      sourceUrl: 'https://www.patriotsoftware.com/blog/payroll/tax-reciprocity-between-states-agreement/',
      dataType: 'reciprocal_agreements',
      taxYear: 2025,
      dataVersion: '2025 Tax Year',
      lastUpdated: new Date('2025-01-01'),
      lastVerified: new Date(),
      dataPayload: { agreements: STATE_RECIPROCAL_AGREEMENTS_2025 },
      confidenceScore: 95,
      notes: '17 states with reciprocal tax agreements as of 2025. NY, NJ, CT (tri-state area) have NO reciprocal agreements with each other.',
      isActive: true
    };
  }

  static getFederalTaxData(): FederalTaxData {
    return FEDERAL_TAX_DATA_2025;
  }

  static getReciprocalAgreements(): ReciprocalAgreementData[] {
    return STATE_RECIPROCAL_AGREEMENTS_2025;
  }

  static checkReciprocalAgreement(workState: string, residenceState: string): {
    hasAgreement: boolean;
    exemptionForm?: string;
    notes?: string;
  } {
    if (workState === residenceState) {
      return { hasAgreement: false };
    }

    const agreement = STATE_RECIPROCAL_AGREEMENTS_2025.find(
      (a) => a.workState === workState.toUpperCase()
    );

    if (!agreement) {
      return { hasAgreement: false };
    }

    const hasAgreement = 
      agreement.residenceStates.includes('ALL') ||
      agreement.residenceStates.includes(residenceState.toUpperCase());

    if (hasAgreement) {
      return {
        hasAgreement: true,
        exemptionForm: agreement.exemptionForm,
        notes: agreement.notes
      };
    }

    return { hasAgreement: false };
  }

  static calculateFederalWithholding(
    annualIncome: number,
    filingStatus: 'single' | 'married_joint' | 'head_of_household',
    additionalDeductions: number = 0
  ): {
    taxableIncome: number;
    totalTax: number;
    effectiveRate: number;
    bracketBreakdown: Array<{ rate: number; amount: number }>;
  } {
    const standardDeduction = FEDERAL_TAX_DATA_2025.standardDeductions[filingStatus];
    const taxableIncome = Math.max(0, annualIncome - standardDeduction - additionalDeductions);
    const brackets = FEDERAL_TAX_DATA_2025.brackets[filingStatus];

    let totalTax = 0;
    const bracketBreakdown: Array<{ rate: number; amount: number }> = [];

    for (const bracket of brackets) {
      if (taxableIncome <= bracket.minIncome) {
        break;
      }

      const bracketMax = bracket.maxIncome ?? Infinity;
      const incomeInBracket = Math.min(taxableIncome, bracketMax) - bracket.minIncome;

      if (incomeInBracket > 0) {
        const taxInBracket = incomeInBracket * bracket.rate;
        totalTax = bracket.baseAmount + taxInBracket;
        bracketBreakdown.push({
          rate: bracket.rate,
          amount: taxInBracket
        });
      }
    }

    const effectiveRate = annualIncome > 0 ? totalTax / annualIncome : 0;

    return {
      taxableIncome,
      totalTax: Math.round(totalTax * 100) / 100,
      effectiveRate: Math.round(effectiveRate * 10000) / 10000,
      bracketBreakdown
    };
  }
}
