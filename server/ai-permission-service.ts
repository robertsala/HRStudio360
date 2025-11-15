import OpenAI from 'openai';
import { storage } from './storage.js';
import type { Permission } from '../shared/schema.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

export interface PermissionSuggestion {
  permissionId: string;
  permissionCode: string;
  permissionName: string;
  category: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface TemplateSuggestion {
  name: string;
  description: string;
  targetRole: string;
  permissions: PermissionSuggestion[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RiskAnalysis {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendations: string[];
  conflictingPermissions: string[];
}

export class AIPermissionService {
  /**
   * Generate smart permission suggestions for a role using AI
   */
  async suggestPermissionsForRole(
    role: string,
    description?: string
  ): Promise<PermissionSuggestion[]> {
    try {
      // Get all available permissions for context
      const allPermissions = await storage.getPermissions();
      
      const permissionList = allPermissions.map(p => 
        `${p.code} - ${p.name} (${p.category}): ${p.description || 'No description'}`
      ).join('\n');

      const prompt = `You are an HR access control expert. Analyze the role "${role}"${description ? ` with description: "${description}"` : ''} and suggest appropriate permissions from the available list.

Available Permissions:
${permissionList}

Instructions:
1. Return a JSON array of suggested permissions
2. For each permission, provide: permissionCode, confidence (high/medium/low), reasoning
3. Consider role hierarchy (e.g., managers need more permissions than employees)
4. Only suggest permissions that make sense for this specific role
5. Be conservative - it's better to suggest fewer permissions than too many

Example response:
[
  {
    "permissionCode": "timesheets.view_team",
    "confidence": "high",
    "reasoning": "Managers typically need to view their team's timesheets for approval"
  }
]

Return only valid JSON array, no additional text.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR access control system that suggests appropriate permissions based on roles. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const responseText = completion.choices[0]?.message?.content || '[]';
      const aiSuggestions = JSON.parse(responseText.trim());

      // Map AI suggestions to our format with actual permission data
      const suggestions: PermissionSuggestion[] = [];
      for (const suggestion of aiSuggestions) {
        const permission = allPermissions.find(p => p.code === suggestion.permissionCode);
        if (permission) {
          suggestions.push({
            permissionId: permission.id,
            permissionCode: permission.code,
            permissionName: permission.name,
            category: permission.category,
            confidence: suggestion.confidence || 'medium',
            reasoning: suggestion.reasoning || 'AI recommended based on role analysis'
          });
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating AI permission suggestions:', error);
      return [];
    }
  }

  /**
   * Generate a complete permission template suggestion for a role
   */
  async generateTemplate(
    role: string,
    description?: string
  ): Promise<TemplateSuggestion | null> {
    try {
      const suggestions = await this.suggestPermissionsForRole(role, description);
      
      if (suggestions.length === 0) {
        return null;
      }

      // Analyze risk level based on permission count and types
      const riskAnalysis = await this.analyzePermissionRisk(
        suggestions.map(s => s.permissionId)
      );

      return {
        name: `${role} Standard Template`,
        description: `AI-generated permission template for ${role} role`,
        targetRole: role,
        permissions: suggestions,
        riskLevel: riskAnalysis.overallRisk === 'critical' ? 'high' : 
                   riskAnalysis.overallRisk === 'high' ? 'medium' : 'low'
      };
    } catch (error) {
      console.error('Error generating template suggestion:', error);
      return null;
    }
  }

  /**
   * Analyze risk of a permission combination
   */
  async analyzePermissionRisk(permissionIds: string[]): Promise<RiskAnalysis> {
    try {
      const allPermissions = await storage.getPermissions();
      const selectedPermissions = allPermissions.filter(p => 
        permissionIds.includes(p.id)
      );

      const permissionList = selectedPermissions.map(p => 
        `${p.code} - ${p.name} (${p.category})`
      ).join('\n');

      const prompt = `You are a security expert analyzing HR system permissions. Analyze the risk of granting this combination of permissions:

Permissions:
${permissionList}

Instructions:
1. Assess the overall risk level: low, medium, high, or critical
2. Identify specific risk factors (e.g., combination allows data export + deletion)
3. Provide security recommendations
4. Identify any conflicting or redundant permissions

Return valid JSON only:
{
  "overallRisk": "low|medium|high|critical",
  "riskFactors": ["factor 1", "factor 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "conflictingPermissions": ["permission code pairs that conflict"]
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a security expert that analyzes permission combinations for risk. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const analysis = JSON.parse(responseText.trim());

      return {
        overallRisk: analysis.overallRisk || 'medium',
        riskFactors: analysis.riskFactors || [],
        recommendations: analysis.recommendations || [],
        conflictingPermissions: analysis.conflictingPermissions || []
      };
    } catch (error) {
      console.error('Error analyzing permission risk:', error);
      return {
        overallRisk: 'medium',
        riskFactors: ['Unable to perform AI risk analysis'],
        recommendations: ['Review permissions manually'],
        conflictingPermissions: []
      };
    }
  }

  /**
   * Suggest role hierarchy based on existing roles
   */
  async suggestRoleHierarchy(roles: string[]): Promise<Array<{
    role: string;
    suggestedParent: string | null;
    reasoning: string;
  }>> {
    try {
      const prompt = `You are an HR organizational expert. Analyze these roles and suggest a logical hierarchy:

Roles: ${roles.join(', ')}

Instructions:
1. Suggest a parent role for each role (or null for top-level roles)
2. Create a logical hierarchy (e.g., Employee -> Manager -> HR -> Product Owner)
3. Provide reasoning for each suggestion

Return valid JSON only:
[
  {
    "role": "Employee",
    "suggestedParent": null,
    "reasoning": "Base level role with no parent"
  },
  {
    "role": "Manager",
    "suggestedParent": "Employee",
    "reasoning": "Managers inherit all employee permissions plus management capabilities"
  }
]`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an organizational expert that suggests role hierarchies. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const responseText = completion.choices[0]?.message?.content || '[]';
      return JSON.parse(responseText.trim());
    } catch (error) {
      console.error('Error suggesting role hierarchy:', error);
      return [];
    }
  }
}

export const aiPermissionService = new AIPermissionService();
