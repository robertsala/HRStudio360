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
  SelectCandidate, 
  SelectApplication, 
  SelectResumeData,
  SelectJobPosting 
} from '../shared/schema';

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
  candidate: SelectCandidate,
  application: SelectApplication,
  resumeData: SelectResumeData | null,
  jobPosting: SelectJobPosting
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
Department: ${jobPosting.department}
Requirements: ${jobPosting.requirements.join(', ')}
Experience Level: ${jobPosting.experienceLevel}
Education: ${jobPosting.educationLevel}

CANDIDATE:
Name: ${candidate.fullName}
Email: ${candidate.email}
Phone: ${candidate.phoneNumber || 'Not provided'}

RESUME DATA:
Skills: ${resumeData?.skills?.join(', ') || 'Not extracted'}
Experience: ${resumeData?.experience?.map(exp => `${exp.title} at ${exp.company} (${exp.duration})`).join('; ') || 'Not extracted'}
Education: ${resumeData?.education?.map(edu => `${edu.degree} in ${edu.field} from ${edu.institution}`).join('; ') || 'Not extracted'}

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
    candidate: SelectCandidate;
    application: SelectApplication;
    resumeData: SelectResumeData | null;
    jobPosting: SelectJobPosting;
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
  applications: SelectApplication[]
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
Applications by Stage: ${JSON.stringify(
    applications.reduce((acc, app) => {
      acc[app.stage] = (acc[app.stage] || 0) + 1;
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
