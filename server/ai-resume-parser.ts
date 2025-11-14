/**
 * AI Resume Parser - OpenAI GPT-4 Integration
 * 
 * Extracts structured data from resume text using GPT-4.
 * Falls back to basic parsing if OpenAI is unavailable.
 */

export interface ParsedResumeData {
  parsedName?: string;
  parsedEmail?: string;
  parsedPhone?: string;
  parsedLocation?: string;
  parsedSkills?: string[];
  parsedExperience?: Array<{
    company: string;
    title: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  parsedEducation?: Array<{
    school: string;
    degree: string;
    field?: string;
    startDate?: string;
    endDate?: string;
  }>;
  parsedCertifications?: string[];
  parsedLanguages?: string[];
  totalYearsExperience?: number;
  rawResumeText: string;
  parsingConfidence?: number;
  parsingService: string;
}

/**
 * Parse resume text using AI
 */
export async function parseResumeWithAI(resumeText: string): Promise<ParsedResumeData> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  // If no OpenAI key, use basic parsing
  if (!OPENAI_API_KEY) {
    console.warn('[AI Resume Parser] OpenAI API key not found. Using basic parsing.');
    return basicResumeParser(resumeText);
  }
  
  try {
    // Call OpenAI GPT-4 for structured parsing
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a professional resume parser. Extract structured information from resumes and return it as JSON. 
Extract: name, email, phone, location, skills (array), work experience (array of {company, title, startDate, endDate, description}), 
education (array of {school, degree, field, startDate, endDate}), certifications (array), languages (array), and estimate total years of experience.

Return ONLY valid JSON, no markdown or additional text.`
          },
          {
            role: 'user',
            content: `Parse this resume:\n\n${resumeText}`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    
    return {
      parsedName: parsed.name,
      parsedEmail: parsed.email,
      parsedPhone: parsed.phone,
      parsedLocation: parsed.location,
      parsedSkills: Array.isArray(parsed.skills) ? parsed.skills : [],
      parsedExperience: Array.isArray(parsed.experience) ? parsed.experience : [],
      parsedEducation: Array.isArray(parsed.education) ? parsed.education : [],
      parsedCertifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      parsedLanguages: Array.isArray(parsed.languages) ? parsed.languages : [],
      totalYearsExperience: parsed.totalYearsExperience || 0,
      rawResumeText: resumeText,
      parsingConfidence: 95,
      parsingService: 'openai'
    };
    
  } catch (error: any) {
    console.error('[AI Resume Parser] OpenAI parsing failed:', error.message);
    console.warn('[AI Resume Parser] Falling back to basic parsing');
    return basicResumeParser(resumeText);
  }
}

/**
 * Basic resume parser (fallback when AI unavailable)
 * Uses regex and heuristics
 */
function basicResumeParser(resumeText: string): ParsedResumeData {
  const text = resumeText.toLowerCase();
  
  // Extract email
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const emails = resumeText.match(emailRegex);
  const parsedEmail = emails?.[0];
  
  // Extract phone
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = resumeText.match(phoneRegex);
  const parsedPhone = phones?.[0];
  
  // Extract common skills (basic keyword matching)
  const commonSkills = [
    'javascript', 'typescript', 'python', 'java', 'react', 'node', 'nodejs',
    'sql', 'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum',
    'html', 'css', 'mongodb', 'postgresql', 'express', 'angular', 'vue'
  ];
  
  const foundSkills = commonSkills.filter(skill => 
    text.includes(skill)
  );
  
  return {
    parsedEmail,
    parsedPhone,
    parsedSkills: foundSkills.length > 0 ? foundSkills : undefined,
    rawResumeText: resumeText,
    parsingConfidence: 50,
    parsingService: 'basic'
  };
}
