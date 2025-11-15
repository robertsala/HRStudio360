import { storage } from './storage.js';
import type { TaxJurisdiction, ReciprocalAgreement, EmployeeTaxConfiguration } from '../shared/schema.js';

export interface TaxBreakdown {
  federalIncomeTax: number;
  stateIncomeTax: number;
  localIncomeTax: number;
  socialSecurity: number;
  medicare: number;
  additionalMedicare: number;
  totalTax: number;
  jurisdictions: {
    federal?: TaxJurisdiction;
    state?: TaxJurisdiction;
    local?: TaxJurisdiction;
  };
  reciprocalAgreementApplied?: ReciprocalAgreement;
  taxExplanation: string[];
}

export interface PayrollCalculationInput {
  employeeId: string;
  grossPay: number;
  workLocationState?: string;
  workLocationCity?: string;
  residenceState?: string;
  residenceCity?: string;
}

class TaxCalculator {
  // Social Security wage base limit for 2025 (this should be configurable)
  private readonly SS_WAGE_BASE = 168600;
  // Additional Medicare threshold for high earners
  private readonly ADDITIONAL_MEDICARE_THRESHOLD = 200000;

  async calculateTaxes(input: PayrollCalculationInput): Promise<TaxBreakdown> {
    const explanation: string[] = [];
    let federalTax = 0;
    let stateTax = 0;
    let localTax = 0;
    let socialSecurity = 0;
    let medicare = 0;
    let additionalMedicare = 0;

    const jurisdictions: TaxBreakdown['jurisdictions'] = {};
    let reciprocalAgreement: ReciprocalAgreement | undefined;

    // Get employee tax configuration
    const taxConfig = await storage.getEmployeeTaxConfiguration(input.employeeId);

    // Determine work and residence locations
    const workState = input.workLocationState || taxConfig?.workLocationState;
    const workCity = input.workLocationCity || taxConfig?.workLocationCity;
    const residenceState = input.residenceState || taxConfig?.residenceState;
    const residenceCity = input.residenceCity || taxConfig?.residenceCity;

    // Step 1: Federal Tax (always applies unless exempt)
    if (!taxConfig?.exemptFromFederal) {
      const federalJurisdiction = await this.getFederalJurisdiction();
      if (federalJurisdiction) {
        jurisdictions.federal = federalJurisdiction;
        
        // Federal income tax
        if (federalJurisdiction.federalIncomeTaxRate) {
          federalTax = input.grossPay * parseFloat(federalJurisdiction.federalIncomeTaxRate);
          explanation.push(`Federal income tax: ${(parseFloat(federalJurisdiction.federalIncomeTaxRate) * 100).toFixed(2)}%`);
        }

        // Social Security (FICA) - capped at wage base
        if (federalJurisdiction.socialSecurityRate) {
          const ssWages = Math.min(input.grossPay, this.SS_WAGE_BASE);
          socialSecurity = ssWages * parseFloat(federalJurisdiction.socialSecurityRate);
          explanation.push(`Social Security: ${(parseFloat(federalJurisdiction.socialSecurityRate) * 100).toFixed(2)}% (capped at $${this.SS_WAGE_BASE.toLocaleString()})`);
        }

        // Medicare (FICA) - no cap
        if (federalJurisdiction.medicareRate) {
          medicare = input.grossPay * parseFloat(federalJurisdiction.medicareRate);
          explanation.push(`Medicare: ${(parseFloat(federalJurisdiction.medicareRate) * 100).toFixed(2)}%`);
        }

        // Additional Medicare for high earners
        if (federalJurisdiction.additionalMedicareRate && input.grossPay > this.ADDITIONAL_MEDICARE_THRESHOLD) {
          const excessWages = input.grossPay - this.ADDITIONAL_MEDICARE_THRESHOLD;
          additionalMedicare = excessWages * parseFloat(federalJurisdiction.additionalMedicareRate);
          explanation.push(`Additional Medicare (high earner): ${(parseFloat(federalJurisdiction.additionalMedicareRate) * 100).toFixed(2)}% on wages over $${this.ADDITIONAL_MEDICARE_THRESHOLD.toLocaleString()}`);
        }
      }
    } else {
      explanation.push('Employee is exempt from federal taxes');
    }

    // Step 2: Check for Reciprocal Agreement
    if (workState && residenceState && workState !== residenceState) {
      reciprocalAgreement = await storage.getReciprocalAgreementByStates(workState, residenceState);
      
      if (reciprocalAgreement) {
        explanation.push(`🔄 Reciprocal agreement applies between ${workState} and ${residenceState}`);
        
        if (reciprocalAgreement.agreementType === 'full_reciprocity') {
          explanation.push(`✓ Full reciprocity: Taxes withheld for residence state (${residenceState}) only`);
        } else if (reciprocalAgreement.agreementType === 'partial_reciprocity') {
          explanation.push(`⚠ Partial reciprocity: Special rules apply - ${reciprocalAgreement.description || 'see agreement details'}`);
        }
      }
    }

    // Step 3: State Tax
    if (!taxConfig?.exemptFromState) {
      let stateForTax = workState;
      
      // Apply reciprocal agreement logic
      if (reciprocalAgreement?.agreementType === 'full_reciprocity') {
        stateForTax = residenceState; // Tax in residence state instead
      }

      if (stateForTax) {
        const stateJurisdiction = await storage.getTaxJurisdictionByState(stateForTax);
        if (stateJurisdiction && stateJurisdiction.stateIncomeTaxRate) {
          jurisdictions.state = stateJurisdiction;
          stateTax = input.grossPay * parseFloat(stateJurisdiction.stateIncomeTaxRate);
          explanation.push(`${stateForTax} state income tax: ${(parseFloat(stateJurisdiction.stateIncomeTaxRate) * 100).toFixed(2)}%`);
        }
      }
    } else {
      explanation.push('Employee is exempt from state taxes');
    }

    // Step 4: Local/City Tax
    if (!taxConfig?.exemptFromLocal) {
      let cityForTax = workCity;
      let stateForLocalTax = workState;

      // Apply reciprocal agreement logic for local taxes too
      if (reciprocalAgreement?.agreementType === 'full_reciprocity') {
        cityForTax = residenceCity;
        stateForLocalTax = residenceState;
      }

      if (cityForTax && stateForLocalTax) {
        const localJurisdiction = await storage.getTaxJurisdictionByCity(stateForLocalTax, cityForTax);
        if (localJurisdiction && localJurisdiction.localIncomeTaxRate) {
          jurisdictions.local = localJurisdiction;
          localTax = input.grossPay * parseFloat(localJurisdiction.localIncomeTaxRate);
          explanation.push(`${cityForTax}, ${stateForLocalTax} local income tax: ${(parseFloat(localJurisdiction.localIncomeTaxRate) * 100).toFixed(2)}%`);
        }
      }
    } else {
      explanation.push('Employee is exempt from local taxes');
    }

    // Step 5: Apply additional withholding if configured
    if (taxConfig?.additionalWithholding) {
      const additionalAmount = parseFloat(taxConfig.additionalWithholding.toString());
      federalTax += additionalAmount;
      explanation.push(`Additional withholding: $${additionalAmount.toFixed(2)}`);
    }

    const totalTax = federalTax + stateTax + localTax + socialSecurity + medicare + additionalMedicare;

    return {
      federalIncomeTax: Math.round(federalTax * 100) / 100,
      stateIncomeTax: Math.round(stateTax * 100) / 100,
      localIncomeTax: Math.round(localTax * 100) / 100,
      socialSecurity: Math.round(socialSecurity * 100) / 100,
      medicare: Math.round(medicare * 100) / 100,
      additionalMedicare: Math.round(additionalMedicare * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      jurisdictions,
      reciprocalAgreementApplied: reciprocalAgreement,
      taxExplanation: explanation
    };
  }

  private async getFederalJurisdiction(): Promise<TaxJurisdiction | undefined> {
    const jurisdictions = await storage.getTaxJurisdictions();
    return jurisdictions.find(j => j.jurisdictionType === 'federal' && j.isActive);
  }

  async initializeDefaultTaxRates(): Promise<void> {
    // Check if federal jurisdiction already exists
    const existing = await this.getFederalJurisdiction();
    if (existing) {
      console.log('✅ Federal tax jurisdiction already configured');
      return;
    }

    // Create default federal tax rates (2025 estimates)
    await storage.createTaxJurisdiction({
      jurisdictionType: 'federal',
      jurisdictionName: 'United States Federal',
      stateCode: null,
      cityName: null,
      federalIncomeTaxRate: '0.2200', // 22% simplified rate
      stateIncomeTaxRate: null,
      localIncomeTaxRate: null,
      socialSecurityRate: '0.0620', // 6.2% employee portion
      medicareRate: '0.0145', // 1.45% employee portion
      additionalMedicareRate: '0.0090', // 0.9% for high earners
      unemploymentTaxRate: null,
      isActive: true,
      effectiveDate: '2025-01-01',
      expirationDate: null,
      notes: 'Default federal tax rates for 2025. These are simplified rates - actual federal income tax is progressive.'
    });

    console.log('✅ Initialized default federal tax rates');
  }
}

export const taxCalculator = new TaxCalculator();
