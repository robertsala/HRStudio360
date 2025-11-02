import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Sparkles, TrendingUp, Clock, Star, ChevronRight, ExternalLink } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category_id: string;
  slug: string;
  view_count: number;
  average_rating: number;
  is_featured: boolean;
  created_at: string;
  category?: {
    name: string;
    color: string;
    icon: string;
  };
}

interface KnowledgeBaseWidgetProps {
  onOpenModal: () => void;
}

export default function KnowledgeBaseWidget({ onOpenModal }: KnowledgeBaseWidgetProps) {
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'featured' | 'popular' | 'recent'>('featured');

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);

      // Load featured articles
      const { data: featured, error: featuredError } = await supabase
        .from('kb_articles')
        .select(`
          *,
          category:kb_categories(name, color, icon)
        `)
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('view_count', { ascending: false })
        .limit(3);

      if (featuredError) throw featuredError;
      setFeaturedArticles(featured || []);

      // Load popular articles
      const { data: popular, error: popularError } = await supabase
        .from('kb_articles')
        .select(`
          *,
          category:kb_categories(name, color, icon)
        `)
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(3);

      if (popularError) throw popularError;
      setPopularArticles(popular || []);

      // Load recent articles
      const { data: recent, error: recentError } = await supabase
        .from('kb_articles')
        .select(`
          *,
          category:kb_categories(name, color, icon)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentError) throw recentError;
      setRecentArticles(recent || []);
    } catch (error) {
      console.error('Error loading knowledge base articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentArticles = () => {
    switch (activeTab) {
      case 'featured':
        return featuredArticles;
      case 'popular':
        return popularArticles;
      case 'recent':
        return recentArticles;
      default:
        return featuredArticles;
    }
  };

  const getTabIcon = (tab: 'featured' | 'popular' | 'recent') => {
    switch (tab) {
      case 'featured':
        return <Star className="h-4 w-4" />;
      case 'popular':
        return <TrendingUp className="h-4 w-4" />;
      case 'recent':
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Knowledge Base
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Search policies, guides & FAQs
              </p>
            </div>
          </div>
          <button
            onClick={onOpenModal}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Open Knowledge Base"
          >
            <ExternalLink className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* AI Search Bar */}
      <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <button
          onClick={onOpenModal}
          className="w-full flex items-center space-x-3 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all group"
        >
          <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              AI Search Knowledge Base
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Try "PTO policy", "Benefits enrollment", "401k", etc...
            </div>
          </div>
          <Search className="h-5 w-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('featured')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'featured'
              ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {getTabIcon('featured')}
          <span>Featured</span>
        </button>
        <button
          onClick={() => setActiveTab('popular')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'popular'
              ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {getTabIcon('popular')}
          <span>Popular</span>
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'recent'
              ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {getTabIcon('recent')}
          <span>Recent</span>
        </button>
      </div>

      {/* Articles List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {loading ? (
          <div className="px-6 py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading articles...</p>
          </div>
        ) : getCurrentArticles().length === 0 ? (
          <div className="px-6 py-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No articles available</p>
          </div>
        ) : (
          getCurrentArticles().map((article) => (
            <button
              key={article.id}
              onClick={onOpenModal}
              className="w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {article.category && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${article.category.color}15`,
                          color: article.category.color,
                        }}
                      >
                        {article.category.name}
                      </span>
                    )}
                    {article.is_featured && (
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                    {article.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{article.view_count} views</span>
                    </div>
                    {article.average_rating > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-current text-yellow-500" />
                        <span>{article.average_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex-shrink-0 ml-2" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onOpenModal}
          className="w-full text-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
        >
          Browse All Articles →
        </button>
      </div>
    </div>
  );
}
