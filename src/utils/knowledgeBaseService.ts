import { supabase } from './supabaseClient';

export interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  category_id: string;
  relevance_score: number;
  category?: {
    name: string;
    color: string;
    icon: string;
  };
}

export interface SearchSuggestion {
  query: string;
  category?: string;
  count: number;
}

/**
 * AI-Powered Knowledge Base Search Service
 * Provides natural language search with intelligent query understanding
 */
class KnowledgeBaseService {
  /**
   * Perform AI-powered natural language search
   * Understands queries like "how do I request time off" or "what is our remote work policy"
   */
  async searchArticles(query: string, userId?: string): Promise<SearchResult[]> {
    try {
      // Track search query for analytics
      if (userId) {
        await this.trackSearchQuery(query, userId);
      }

      // Clean and process query
      const processedQuery = this.processQuery(query);

      // Perform multi-field search with relevance scoring
      const { data, error } = await supabase
        .from('kb_articles')
        .select(`
          id,
          title,
          excerpt,
          content,
          slug,
          category_id,
          view_count,
          avg_rating,
          is_featured,
          category:kb_categories(name, color, icon)
        `)
        .eq('status', 'published')
        .or(
          `title.ilike.%${processedQuery}%,excerpt.ilike.%${processedQuery}%,content.ilike.%${processedQuery}%,tags.cs.{${processedQuery}}`
        );

      if (error) throw error;

      // Calculate relevance scores and sort results
      const scoredResults = this.scoreResults(data || [], processedQuery);

      return scoredResults;
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return [];
    }
  }

  /**
   * Get search suggestions based on common queries and popular articles
   */
  async getSearchSuggestions(partialQuery: string): Promise<SearchSuggestion[]> {
    if (partialQuery.length < 2) return [];

    try {
      // Get popular searches containing the partial query
      const { data, error } = await supabase
        .from('kb_search_queries')
        .select('query')
        .ilike('query', `%${partialQuery}%`)
        .limit(5);

      if (error) throw error;

      // Aggregate and count suggestions
      const suggestionMap = new Map<string, number>();
      (data || []).forEach((item) => {
        const count = suggestionMap.get(item.query) || 0;
        suggestionMap.set(item.query, count + 1);
      });

      return Array.from(suggestionMap.entries())
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  /**
   * Get recommended articles based on user role, department, and behavior
   */
  async getRecommendedArticles(userId: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      // Get user profile for personalization
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, department')
        .eq('id', userId)
        .single();

      // Get articles user hasn't viewed yet
      const { data: viewedIds } = await supabase
        .from('kb_article_views')
        .select('article_id')
        .eq('user_id', userId);

      const viewed = new Set((viewedIds || []).map((v) => v.article_id));

      // Get recommended articles based on role and popularity
      let query = supabase
        .from('kb_articles')
        .select(`
          id,
          title,
          excerpt,
          content,
          slug,
          category_id,
          view_count,
          avg_rating,
          is_featured,
          is_required_reading,
          category:kb_categories(name, color, icon)
        `)
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(limit * 2); // Get extra to filter out viewed

      const { data, error } = await query;

      if (error) throw error;

      // Filter out viewed articles and limit
      const recommendations = (data || [])
        .filter((article) => !viewed.has(article.id))
        .slice(0, limit)
        .map((article) => ({
          ...article,
          relevance_score: this.calculateRelevanceScore(article, profile),
        }))
        .sort((a, b) => b.relevance_score - a.relevance_score);

      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  /**
   * Get similar articles based on content and tags
   */
  async getSimilarArticles(articleId: string, limit: number = 3): Promise<SearchResult[]> {
    try {
      // Get the current article's category and tags
      const { data: article } = await supabase
        .from('kb_articles')
        .select('category_id, tags')
        .eq('id', articleId)
        .single();

      if (!article) return [];

      // Find similar articles in the same category
      const { data, error } = await supabase
        .from('kb_articles')
        .select(`
          id,
          title,
          excerpt,
          content,
          slug,
          category_id,
          view_count,
          avg_rating,
          category:kb_categories(name, color, icon)
        `)
        .eq('status', 'published')
        .eq('category_id', article.category_id)
        .neq('id', articleId)
        .order('view_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((item) => ({
        ...item,
        relevance_score: 0,
      }));
    } catch (error) {
      console.error('Error getting similar articles:', error);
      return [];
    }
  }

  /**
   * Get trending articles based on recent views and ratings
   */
  async getTrendingArticles(limit: number = 5): Promise<SearchResult[]> {
    try {
      // Get articles with recent high engagement
      const { data, error } = await supabase
        .from('kb_articles')
        .select(`
          id,
          title,
          excerpt,
          content,
          slug,
          category_id,
          view_count,
          avg_rating,
          is_featured,
          category:kb_categories(name, color, icon)
        `)
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((item) => ({
        ...item,
        relevance_score: item.view_count + item.avg_rating * 10,
      }));
    } catch (error) {
      console.error('Error getting trending articles:', error);
      return [];
    }
  }

  /**
   * Track article view for analytics
   */
  async trackArticleView(articleId: string, userId: string, timeSpent: number = 0): Promise<void> {
    try {
      // Insert view record
      await supabase.from('kb_article_views').insert({
        article_id: articleId,
        user_id: userId,
        time_spent_seconds: timeSpent,
      });

      // Increment article view count
      const { data: article } = await supabase
        .from('kb_articles')
        .select('view_count')
        .eq('id', articleId)
        .single();

      if (article) {
        await supabase
          .from('kb_articles')
          .update({ view_count: article.view_count + 1 })
          .eq('id', articleId);
      }
    } catch (error) {
      console.error('Error tracking article view:', error);
    }
  }

  /**
   * Track search query for analytics and suggestions
   */
  private async trackSearchQuery(query: string, userId: string): Promise<void> {
    try {
      await supabase.from('kb_search_queries').insert({
        user_id: userId,
        query: query.toLowerCase(),
        results_count: 0, // Will be updated after search completes
      });
    } catch (error) {
      console.error('Error tracking search query:', error);
    }
  }

  /**
   * Process and clean search query for better results
   */
  private processQuery(query: string): string {
    // Convert to lowercase
    let processed = query.toLowerCase().trim();

    // Remove common question words
    const questionWords = ['how', 'what', 'when', 'where', 'who', 'why', 'can', 'do', 'does', 'is', 'are'];
    questionWords.forEach((word) => {
      processed = processed.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    });

    // Remove extra whitespace
    processed = processed.replace(/\s+/g, ' ').trim();

    // Handle common abbreviations
    const abbreviations: { [key: string]: string } = {
      'pto': 'paid time off',
      'fmla': 'family medical leave',
      '401k': 'retirement',
      'hr': 'human resources',
      'it': 'information technology',
    };

    Object.entries(abbreviations).forEach(([abbr, full]) => {
      if (processed.includes(abbr)) {
        processed = `${processed} ${full}`;
      }
    });

    return processed;
  }

  /**
   * Score search results based on relevance
   */
  private scoreResults(results: any[], query: string): SearchResult[] {
    return results
      .map((result) => {
        let score = 0;
        const lowerQuery = query.toLowerCase();
        const lowerTitle = result.title.toLowerCase();
        const lowerContent = result.content.toLowerCase();
        const lowerExcerpt = result.excerpt?.toLowerCase() || '';

        // Title match (highest weight)
        if (lowerTitle.includes(lowerQuery)) {
          score += 100;
          // Exact title match bonus
          if (lowerTitle === lowerQuery) {
            score += 50;
          }
        }

        // Excerpt match (medium weight)
        if (lowerExcerpt.includes(lowerQuery)) {
          score += 50;
        }

        // Content match (lower weight)
        if (lowerContent.includes(lowerQuery)) {
          score += 25;
        }

        // Featured article bonus
        if (result.is_featured) {
          score += 20;
        }

        // Popularity bonus (view count)
        score += Math.min(result.view_count / 10, 20);

        // Rating bonus
        if (result.avg_rating > 0) {
          score += result.avg_rating * 5;
        }

        return {
          ...result,
          relevance_score: score,
        };
      })
      .filter((result) => result.relevance_score > 0)
      .sort((a, b) => b.relevance_score - a.relevance_score);
  }

  /**
   * Calculate relevance score for personalized recommendations
   */
  private calculateRelevanceScore(article: any, profile: any): number {
    let score = 0;

    // Base score from popularity
    score += article.view_count / 10;
    score += article.avg_rating * 10;

    // Required reading bonus
    if (article.is_required_reading) {
      score += 50;
    }

    // Featured bonus
    if (article.is_featured) {
      score += 30;
    }

    // Role-based relevance (if we had role-specific articles)
    // This could be enhanced with access_level or required_for_roles checks
    if (profile?.role && article.required_for_roles?.includes(profile.role)) {
      score += 40;
    }

    return score;
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
