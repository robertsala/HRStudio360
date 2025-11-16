/**
 * Autonomous AI Agent for HRStudio360
 * 
 * This is a true AI agent, not just a chatbot. It can:
 * - Make autonomous decisions
 * - Take actions without human input
 * - Run on schedules
 * - Screen candidates automatically
 * - Send notifications
 * - Learn from outcomes
 */

import OpenAI from 'openai';
import type { 
  Candidate, 
  Application, 
  ResumeData,
  JobPosting 
} from '../shared/schema.js';
import { TaxDataService } from './tax-data-service.js';

// Initialize OpenAI with Replit AI Integrations
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Agent capabilities
export const AGENT_CAPABILITIES = {
  SCREEN_CANDIDATES: 'screen_candidates',
  RANK_APPLICATIONS: 'rank_applications',
  SUGGEST_INTERVIEWS: 'suggest_interviews',
  ANALYZE_SKILLS: 'analyze_skills',
  ANSWER_HR_QUESTIONS: 'answer_hr_questions',
  GENERATE_INSIGHTS: 'generate_insights',
  SUGGEST_TAX_CONFIG: 'suggest_tax_config',
} as const;

// Agent personality and context
const AGENT_SYSTEM_PROMPT = `You are Studio AI, an autonomous HR assistant agent for HRStudio360.

You are NOT just a chatbot - you are an AI agent that:
- Makes autonomous decisions about candidates
- Screens applications without human input
- Runs scheduled workflows (e.g., daily candidate reviews)
- Provides data-driven insights
- Takes actions to help hiring teams

Your personality: Professional, data-driven, helpful, and proactive.
Your goal: Help companies make better hiring decisions faster.

When screening candidates, you evaluate:
1. Skills match with job requirements
2. Experience level and relevance
3. Education alignment
4. Resume quality and professionalism
5. Career progression trajectory

Provide concise, actionable recommendations.`;

/**
 * Screen a single candidate application autonomously
 */
export async function screenCandidate(
  candidate: Candidate,
  _application: Application,
  resumeData: ResumeData | null,
  jobPosting: JobPosting
): Promise<{
  score: number; // 0-100
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no';
  reasoning: string;
  strengths: string[];
  concerns: string[];
  suggestedNextSteps: string[];
}> {
  const prompt = `Screen this candidate for the following job:

JOB POSTING:
Title: ${jobPosting.title}
Department ID: ${jobPosting.departmentId}
Requirements: ${jobPosting.requirements}
Experience Level: ${jobPosting.experience}
Education: ${jobPosting.educationLevel}

CANDIDATE:
Name: ${candidate.name}
Email: ${candidate.email}
Phone: ${candidate.phone || 'Not provided'}

RESUME DATA:
Skills: ${resumeData?.parsedSkills?.join(', ') || 'Not extracted'}
Experience: ${resumeData?.parsedExperience ? JSON.stringify(resumeData.parsedExperience) : 'Not extracted'}
Education: ${resumeData?.parsedEducation ? JSON.stringify(resumeData.parsedEducation) : 'Not extracted'}

Provide a comprehensive screening assessment as a JSON object with:
- score (0-100)
- recommendation ('strong_yes' | 'yes' | 'maybe' | 'no')
- reasoning (brief explanation)
- strengths (array of 3-5 key strengths)
- concerns (array of any concerns or gaps)
- suggestedNextSteps (array of recommended actions)

Respond ONLY with valid JSON, no additional text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: AGENT_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, // Lower temperature for consistent screening
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      score: result.score || 50,
      recommendation: result.recommendation || 'maybe',
      reasoning: result.reasoning || 'Unable to assess candidate',
      strengths: result.strengths || [],
      concerns: result.concerns || [],
      suggestedNextSteps: result.suggestedNextSteps || ['Manual review recommended']
    };
  } catch (error) {
    console.error('[AI Agent] Error screening candidate:', error);
    // Fallback to basic scoring if AI fails
    return {
      score: 50,
      recommendation: 'maybe',
      reasoning: 'AI screening unavailable - manual review required',
      strengths: [],
      concerns: ['AI screening failed'],
      suggestedNextSteps: ['Manual review required']
    };
  }
}

/**
 * Batch screen multiple candidates and rank them
 */
export async function batchScreenCandidates(
  applications: Array<{
    candidate: Candidate;
    application: Application;
    resumeData: ResumeData | null;
    jobPosting: JobPosting;
  }>
): Promise<Array<{
  applicationId: string;
  candidateId: string;
  score: number;
  recommendation: string;
  reasoning: string;
  strengths: string[];
  concerns: string[];
  suggestedNextSteps: string[];
}>> {
  const results = await Promise.all(
    applications.map(async (app) => {
      const screening = await screenCandidate(
        app.candidate,
        app.application,
        app.resumeData,
        app.jobPosting
      );
      
      return {
        applicationId: app.application.id,
        candidateId: app.candidate.id,
        ...screening
      };
    })
  );

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Chat with Studio AI (conversational interface)
 */
export async function chatWithStudioAI(
  message: string,
  context?: {
    userRole?: string;
    department?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }
): Promise<string> {
  try {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: AGENT_SYSTEM_PROMPT }
    ];

    // Add conversation history if provided
    if (context?.conversationHistory) {
      messages.push(...context.conversationHistory);
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content || 'I apologize, but I was unable to generate a response.';
  } catch (error) {
    console.error('[AI Agent] Chat error:', error);
    return 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.';
  }
}

/**
 * Generate hiring insights from application data
 */
export async function generateHiringInsights(
  jobPostingId: string,
  applications: Application[]
): Promise<{
  summary: string;
  topCandidates: number;
  averageQuality: string;
  recommendedActions: string[];
  trends: string[];
}> {
  const prompt = `Analyze this hiring pipeline data:

Job Posting ID: ${jobPostingId}
Total Applications: ${applications.length}
Applications by Status: ${JSON.stringify(
    applications.reduce((acc, app) => {
      const status = app.status || 'applied';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )}

Provide insights as JSON with:
- summary (brief overview)
- topCandidates (estimated number of strong candidates)
- averageQuality ('high' | 'medium' | 'low')
- recommendedActions (array of 3-5 actions hiring team should take)
- trends (array of observed patterns)

Respond ONLY with valid JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: AGENT_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('[AI Agent] Error generating insights:', error);
    return {
      summary: 'Unable to generate insights',
      topCandidates: 0,
      averageQuality: 'medium',
      recommendedActions: ['Manual review recommended'],
      trends: []
    };
  }
}

/**
 * Autonomous daily screening workflow
 * This runs automatically to screen new applications
 */
export async function runDailyScreeningWorkflow(
  storage: any
): Promise<{
  processed: number;
  topCandidates: Array<{ candidateId: string; score: number }>;
  notificationsSent: number;
}> {
  console.log('[AI Agent] Running daily screening workflow...');
  
  try {
    // Get all applications from last 24 hours that haven't been screened
    const recentApplications = await storage.getRecentUnscreenedApplications();
    
    if (recentApplications.length === 0) {
      console.log('[AI Agent] No new applications to screen');
      return { processed: 0, topCandidates: [], notificationsSent: 0 };
    }

    // Screen all applications
    const screenings = await batchScreenCandidates(recentApplications);
    
    // Identify top candidates (score >= 75)
    const topCandidates = screenings
      .filter(s => s.score >= 75)
      .map(s => ({ candidateId: s.candidateId, score: s.score }));

    console.log(`[AI Agent] Screened ${screenings.length} applications, found ${topCandidates.length} top candidates`);

    return {
      processed: screenings.length,
      topCandidates,
      notificationsSent: 0 // TODO: Implement notification sending
    };
  } catch (error) {
    console.error('[AI Agent] Daily screening workflow error:', error);
    return { processed: 0, topCandidates: [], notificationsSent: 0 };
  }
}

/**
 * PAYROLL AI ASSISTANT
 * AI-powered payroll validation, expense analysis, and compliance checking
 */

const PAYROLL_SYSTEM_PROMPT = `You are Studio AI, an autonomous payroll assistant for HRStudio360.

You help with:
- Payroll validation and error detection
- Expense report analysis
- Leave request management
- Tax and compliance checking
- Payroll calculations verification

Your personality: Meticulous, detail-oriented, and helpful.
Your goal: Prevent payroll errors, ensure compliance, and save time.

Provide clear, actionable recommendations with specific numbers when relevant.`;

interface PayrollEmployee {
  id: string;
  name: string;
  department: string;
  employeeType: 'Hourly' | 'Salaried';
  hourlyRate?: number;
  salary?: number;
  regularHours?: number;
  overtimeHours?: number;
  grossPay: number;
  deductions: number;
  taxes: number;
  netPay: number;
  status: string;
  errors?: string[];
  warnings?: string[];
}

interface PayrollValidationResult {
  score: number; // 0-100 (100 = no issues)
  criticalIssues: Array<{
    employeeId: string;
    employeeName: string;
    issue: string;
    suggestion: string;
  }>;
  warnings: Array<{
    employeeId: string;
    employeeName: string;
    warning: string;
    suggestion: string;
  }>;
  summary: string;
  recommendations: string[];
}

/**
 * Validate payroll run for errors and compliance issues
 */
export async function validatePayrollRun(
  employees: PayrollEmployee[],
  payrollPeriod: string
): Promise<PayrollValidationResult> {
  const prompt = `Validate this payroll run for errors and compliance issues:

PAYROLL PERIOD: ${payrollPeriod}
EMPLOYEE COUNT: ${employees.length}

EMPLOYEES:
${employees.map((emp, idx) => `
${idx + 1}. ${emp.name} (${emp.department})
   - Type: ${emp.employeeType}
   ${emp.employeeType === 'Hourly' ? `- Rate: $${emp.hourlyRate}/hr` : `- Salary: $${emp.salary}`}
   ${emp.regularHours ? `- Regular Hours: ${emp.regularHours}` : ''}
   ${emp.overtimeHours ? `- Overtime Hours: ${emp.overtimeHours}` : ''}
   - Gross Pay: $${emp.grossPay}
   - Deductions: $${emp.deductions}
   - Taxes: $${emp.taxes}
   - Net Pay: $${emp.netPay}
   - Status: ${emp.status}
   ${emp.errors?.length ? `- Existing Errors: ${emp.errors.join(', ')}` : ''}
   ${emp.warnings?.length ? `- Existing Warnings: ${emp.warnings.join(', ')}` : ''}
`).join('\n')}

Check for:
1. Calculation errors (gross pay, net pay, overtime)
2. Missing data or incomplete entries
3. Duplicate entries
4. Unusual overtime patterns
5. Tax withholding issues
6. Compliance concerns

Provide assessment as JSON with:
- score (0-100, where 100 = no issues)
- criticalIssues (array of { employeeId, employeeName, issue, suggestion })
- warnings (array of { employeeId, employeeName, warning, suggestion })
- summary (brief overview)
- recommendations (array of action items)

Respond ONLY with valid JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: PAYROLL_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      score: result.score || 100,
      criticalIssues: result.criticalIssues || [],
      warnings: result.warnings || [],
      summary: result.summary || 'Payroll validation complete',
      recommendations: result.recommendations || []
    };
  } catch (error) {
    console.error('[AI Payroll] Validation error:', error);
    return {
      score: 50,
      criticalIssues: [],
      warnings: [],
      summary: 'AI validation unavailable - manual review required',
      recommendations: ['Manual payroll review recommended']
    };
  }
}

/**
 * Analyze expenses for policy compliance and budget issues
 */
export async function analyzeExpenses(
  expenses: Array<{
    employeeId: string;
    employeeName: string;
    amount: number;
    category: string;
    hasReceipt: boolean;
    date: string;
  }>,
  budgetLimits?: Record<string, number>
): Promise<{
  totalAmount: number;
  flaggedExpenses: Array<{
    employeeId: string;
    employeeName: string;
    reason: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
}> {
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const prompt = `Analyze these expense reports:

TOTAL EXPENSES: $${totalAmount}
EXPENSE COUNT: ${expenses.length}

EXPENSES:
${expenses.map((exp, idx) => `
${idx + 1}. ${exp.employeeName}
   - Amount: $${exp.amount}
   - Category: ${exp.category}
   - Has Receipt: ${exp.hasReceipt ? 'Yes' : 'No'}
   - Date: ${exp.date}
`).join('\n')}

${budgetLimits ? `BUDGET LIMITS:\n${Object.entries(budgetLimits).map(([cat, limit]) => `- ${cat}: $${limit}`).join('\n')}` : ''}

Check for:
1. Missing receipts
2. Budget overruns
3. Duplicate or suspicious expenses
4. Policy violations

Provide analysis as JSON with:
- flaggedExpenses (array of { employeeId, employeeName, reason, severity })
- recommendations (array of action items)

Respond ONLY with valid JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: PAYROLL_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      totalAmount,
      flaggedExpenses: result.flaggedExpenses || [],
      recommendations: result.recommendations || []
    };
  } catch (error) {
    console.error('[AI Payroll] Expense analysis error:', error);
    return {
      totalAmount,
      flaggedExpenses: [],
      recommendations: ['Manual expense review recommended']
    };
  }
}

/**
 * Chat with Payroll AI Assistant
 */
export async function chatWithPayrollAI(
  message: string,
  context?: {
    payrollPeriod?: string;
    employeeCount?: number;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }
): Promise<string> {
  try {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: PAYROLL_SYSTEM_PROMPT }
    ];

    // Add context if provided
    if (context?.payrollPeriod || context?.employeeCount) {
      const contextInfo = [
        context.payrollPeriod ? `Current payroll period: ${context.payrollPeriod}` : '',
        context.employeeCount ? `Processing ${context.employeeCount} employees` : ''
      ].filter(Boolean).join('. ');
      
      if (contextInfo) {
        messages.push({ role: 'system', content: contextInfo });
      }
    }

    // Add conversation history if provided
    if (context?.conversationHistory) {
      messages.push(...context.conversationHistory);
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content || 'I apologize, but I was unable to generate a response.';
  } catch (error) {
    console.error('[AI Payroll] Chat error:', error);
    return 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.';
  }
}

/**
 * Tax Configuration AI System Prompt
 */
const TAX_SYSTEM_PROMPT = `You are Studio AI's Tax Configuration Expert, specialized in multi-state tax compliance.

Your expertise includes:
- Federal and state tax withholding regulations
- State reciprocal agreements and exemptions
- Tax jurisdiction optimization
- Compliance with IRS Publication 15-T
- State Department of Revenue regulations

When suggesting tax configurations, you:
1. Analyze employee work state vs residence state
2. Check for reciprocal agreements to minimize withholding burden
3. Consider special conditions (daily commute requirements, shareholder restrictions)
4. Ensure compliance with both federal and state regulations
5. Provide clear explanations with regulatory citations

Your recommendations must be:
- Accurate and based on authoritative data sources
- Compliant with SOC 1/SOX and IRS Circular 230 requirements
- Clearly documented with rationale
- Subject to HR Admin review and approval

IMPORTANT: Your suggestions are recommendations only. All tax configurations require human review and approval before being applied.`;

/**
 * Suggest optimal tax configuration for an employee
 * Based on work state, residence state, and reciprocal agreements
 */
export async function suggestTaxConfiguration(employeeData: {
  employeeId: string;
  fullName: string;
  workState: string;
  residenceState: string;
  filingStatus?: string;
}): Promise<{
  suggestion: {
    workStateTax: boolean;
    residenceStateTax: boolean;
    useReciprocalAgreement: boolean;
    reciprocalAgreementDetails?: {
      workState: string;
      residenceState: string;
      exemptionForm: string;
      sourceUrl: string;
    };
    federalWithholding: {
      filingStatus: string;
      recommendedAllowances: number;
    };
  };
  reasoning: string;
  complianceNotes: string[];
  actionItems: string[];
  confidence: number; // 0-100
}> {
  try {
    // Get reciprocal agreement data
    const reciprocalAgreements = TaxDataService.getReciprocalAgreements();
    const federalTaxData = TaxDataService.getFederalTaxData();

    // Check if there's a reciprocal agreement
    const applicableAgreement = reciprocalAgreements.find(
      agreement => 
        agreement.workState === employeeData.workState &&
        (agreement.residenceStates.includes(employeeData.residenceState) || 
         agreement.residenceStates.includes('ALL'))
    );

    // Build context for AI
    const context = {
      employee: employeeData,
      reciprocalAgreement: applicableAgreement || null,
      workStateWithholdingRequired: !applicableAgreement,
      residenceStateWithholdingRequired: true,
      federalTaxYear: federalTaxData.taxYear
    };

    const prompt = `Analyze this employee's tax situation and suggest optimal tax configuration:

Employee Information:
- Name: ${employeeData.fullName}
- Work State: ${employeeData.workState}
- Residence State: ${employeeData.residenceState}
- Filing Status: ${employeeData.filingStatus || 'Not specified'}

Current Tax Year: ${federalTaxData.taxYear}

${applicableAgreement ? `
Reciprocal Agreement Found:
- Work State: ${applicableAgreement.workState} (${applicableAgreement.workStateName})
- Exemption Form: ${applicableAgreement.exemptionForm}
- Agreement Details: ${applicableAgreement.notes || 'Standard reciprocal agreement'}
- Source: ${applicableAgreement.sourceUrl}
- Last Verified: ${applicableAgreement.lastVerified}
- Special Conditions: ${applicableAgreement.verificationNotes || 'None'}
` : `
No Reciprocal Agreement:
${employeeData.workState} and ${employeeData.residenceState} do not have a reciprocal tax agreement.
Employee will be subject to withholding in both states.
`}

Task: Provide a comprehensive tax configuration recommendation that:
1. Determines if work state withholding is required
2. Determines if residence state withholding is required  
3. Identifies if reciprocal agreement can be used
4. Recommends federal withholding filing status
5. Explains compliance requirements
6. Lists action items for HR Admin

Respond in JSON format:
{
  "workStateTax": boolean,
  "residenceStateTax": boolean,
  "useReciprocalAgreement": boolean,
  "reciprocalDetails": { "form": "...", "instructions": "..." } or null,
  "federalFilingStatus": "single|married_joint|married_separate|head_of_household",
  "reasoning": "Detailed explanation",
  "complianceNotes": ["note1", "note2"],
  "actionItems": ["action1", "action2"],
  "confidence": 0-100
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: TAX_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2, // Low temperature for factual, consistent recommendations
      response_format: { type: 'json_object' }
    });

    const aiResponse = JSON.parse(response.choices[0].message.content || '{}');

    return {
      suggestion: {
        workStateTax: aiResponse.workStateTax,
        residenceStateTax: aiResponse.residenceStateTax,
        useReciprocalAgreement: aiResponse.useReciprocalAgreement,
        reciprocalAgreementDetails: applicableAgreement ? {
          workState: applicableAgreement.workState,
          residenceState: employeeData.residenceState,
          exemptionForm: applicableAgreement.exemptionForm,
          sourceUrl: applicableAgreement.sourceUrl || ''
        } : undefined,
        federalWithholding: {
          filingStatus: aiResponse.federalFilingStatus || 'single',
          recommendedAllowances: 0 // Default to 0, can be customized
        }
      },
      reasoning: aiResponse.reasoning || 'Tax configuration based on work and residence state analysis.',
      complianceNotes: aiResponse.complianceNotes || [],
      actionItems: aiResponse.actionItems || [],
      confidence: aiResponse.confidence || 85
    };
  } catch (error) {
    console.error('[AI Tax] Suggestion error:', error);
    // Return a conservative default suggestion
    return {
      suggestion: {
        workStateTax: true,
        residenceStateTax: true,
        useReciprocalAgreement: false,
        federalWithholding: {
          filingStatus: 'single',
          recommendedAllowances: 0
        }
      },
      reasoning: 'Error occurred during AI analysis. Conservative configuration suggested: withholding in both states.',
      complianceNotes: [
        'AI analysis failed - manual review required',
        'Default configuration applies withholding in both work and residence states'
      ],
      actionItems: [
        'Manually verify employee work and residence states',
        'Check for applicable reciprocal agreements',
        'Confirm federal filing status with employee'
      ],
      confidence: 50
    };
  }
}

/**
 * Batch suggest tax configurations for multiple employees
 * Useful for initial setup or annual review
 */
export async function batchSuggestTaxConfigurations(
  employees: Array<{
    employeeId: string;
    fullName: string;
    workState: string;
    residenceState: string;
    filingStatus?: string;
  }>
): Promise<Array<{
  employeeId: string;
  suggestion: any;
  reasoning: string;
  confidence: number;
}>> {
  const suggestions = await Promise.all(
    employees.map(async (employee) => {
      const result = await suggestTaxConfiguration(employee);
      return {
        employeeId: employee.employeeId,
        suggestion: result.suggestion,
        reasoning: result.reasoning,
        confidence: result.confidence
      };
    })
  );

  return suggestions;
}
