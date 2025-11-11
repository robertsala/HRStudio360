import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  BookOpen,
  Star,
  TrendingUp,
  Clock,
  Bookmark,
  MessageSquare,
  ThumbsUp,
  Share2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  FileText,
  Heart,
  Calendar,
  GraduationCap,
  Shield,
  Monitor,
  HelpCircle,
  Eye,
  BarChart3,
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuthContext } from '../../contexts/AuthContext';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  display_order: number;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category_id: string;
  status: string;
  view_count: number;
  avg_rating: number;
  rating_count: number;
  is_featured: boolean;
  is_required_reading: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: { [key: string]: React.ComponentType<any> } = {
  FileText,
  Heart,
  Calendar,
  TrendingUp,
  GraduationCap,
  Shield,
  Monitor,
  HelpCircle,
  BookOpen,
};

export default function KnowledgeBaseModal({ isOpen, onClose }: KnowledgeBaseModalProps) {
  const { user } = useAuthContext();
  const [view, setView] = useState<'browse' | 'article' | 'search'>('browse');
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set());
  const [userRating, setUserRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular');

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadBookmarks();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedCategory) {
      loadArticles(selectedCategory);
    }
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('kb_categories')
        .select('*')
        .eq('active', true)
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadArticles = async (categoryId: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('kb_articles')
        .select(`
          *,
          category:kb_categories(*)
        `)
        .eq('status', 'published')
        .eq('category_id', categoryId);

      // Apply sorting
      if (sortBy === 'popular') {
        query = query.order('view_count', { ascending: false });
      } else if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'rating') {
        query = query.order('avg_rating', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('kb_bookmarks')
        .select('article_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setBookmarkedArticles(new Set(data?.map((b) => b.article_id) || []));
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);

      // Search across title and content using PostgreSQL full-text search
      const { data, error } = await supabase
        .from('kb_articles')
        .select(`
          *,
          category:kb_categories(*)
        `)
        .eq('status', 'published')
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      setSearchResults(data || []);
      setView('search');
    } catch (error) {
      console.error('Error searching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const openArticle = async (article: Article) => {
    setSelectedArticle(article);
    setView('article');

    // Track article view
    if (user) {
      try {
        await supabase.from('kb_article_views').insert({
          article_id: article.id,
          user_id: user.id,
          time_spent_seconds: 0,
        });

        // Increment view count
        await supabase
          .from('kb_articles')
          .update({ view_count: article.view_count + 1 })
          .eq('id', article.id);
      } catch (error) {
        console.error('Error tracking article view:', error);
      }
    }

    // Load user's rating if exists
    if (user) {
      const { data } = await supabase
        .from('kb_article_ratings')
        .select('rating')
        .eq('article_id', article.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setUserRating(data.rating);
      } else {
        setUserRating(0);
      }
    }
  };

  const toggleBookmark = async (articleId: string) => {
    if (!user) return;

    try {
      if (bookmarkedArticles.has(articleId)) {
        await supabase
          .from('kb_bookmarks')
          .delete()
          .eq('article_id', articleId)
          .eq('user_id', user.id);

        setBookmarkedArticles((prev) => {
          const next = new Set(prev);
          next.delete(articleId);
          return next;
        });
      } else {
        await supabase.from('kb_bookmarks').insert({
          article_id: articleId,
          user_id: user.id,
        });

        setBookmarkedArticles((prev) => new Set(prev).add(articleId));
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const rateArticle = async (rating: number) => {
    if (!user || !selectedArticle) return;

    try {
      await supabase.from('kb_article_ratings').upsert(
        {
          article_id: selectedArticle.id,
          user_id: user.id,
          rating,
        },
        {
          onConflict: 'article_id,user_id',
        }
      );

      setUserRating(rating);

      // Refresh article to get updated rating
      const { data } = await supabase
        .from('kb_articles')
        .select('avg_rating, rating_count')
        .eq('id', selectedArticle.id)
        .single();

      if (data && selectedArticle) {
        setSelectedArticle({
          ...selectedArticle,
          avg_rating: data.avg_rating,
          rating_count: data.rating_count,
        });
      }
    } catch (error) {
      console.error('Error rating article:', error);
    }
  };

  const goBack = () => {
    if (view === 'article') {
      setView('browse');
      setSelectedArticle(null);
    } else if (view === 'search') {
      setView('browse');
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName];
    return IconComponent || BookOpen;
  };

  const renderBrowseView = () => (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Categories Grid */}
      {!selectedCategory ? (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Browse Knowledge Base
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Select a category to explore articles and resources
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const IconComponent = getIconComponent(category.icon);
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg transition-all group text-left"
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${category.color}15` }}
                  >
                    <IconComponent className="h-6 w-6" style={{ color: category.color }} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {category.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Articles List */
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Back to Categories</span>
              </button>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-sm border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="popular">Most Popular</option>
                  <option value="recent">Most Recent</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {categories.find((c) => c.id === selectedCategory) && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {categories.find((c) => c.id === selectedCategory)?.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {categories.find((c) => c.id === selectedCategory)?.description}
                </p>
              </div>
            )}
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No articles found in this category</p>
              </div>
            ) : (
              <div className="space-y-4">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <button
                        onClick={() => openArticle(article)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          {article.is_featured && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              Featured
                            </span>
                          )}
                          {article.is_required_reading && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              Required Reading
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{article.view_count} views</span>
                          </div>
                          {article.rating_count > 0 && (
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 fill-current text-yellow-500" />
                              <span>{article.avg_rating.toFixed(1)} ({article.rating_count})</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(article.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => toggleBookmark(article.id)}
                        className={`ml-4 p-2 rounded-lg transition-colors ${
                          bookmarkedArticles.has(article.id)
                            ? 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30'
                            : 'text-gray-400 hover:text-purple-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Bookmark
                          className={`h-5 w-5 ${bookmarkedArticles.has(article.id) ? 'fill-current' : ''}`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderArticleView = () => {
    if (!selectedArticle) return null;

    return (
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Article Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <button
            onClick={goBack}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Articles</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                {selectedArticle.category && (
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${selectedArticle.category.color}15`,
                      color: selectedArticle.category.color,
                    }}
                  >
                    {selectedArticle.category.name}
                  </span>
                )}
                {selectedArticle.is_featured && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Featured
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {selectedArticle.title}
              </h1>
              <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>{selectedArticle.view_count} views</span>
                </div>
                {selectedArticle.rating_count > 0 && (
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    <span>{selectedArticle.avg_rating.toFixed(1)} ({selectedArticle.rating_count} ratings)</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Updated {new Date(selectedArticle.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => toggleBookmark(selectedArticle.id)}
                className={`p-2 rounded-lg transition-colors ${
                  bookmarkedArticles.has(selectedArticle.id)
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30'
                    : 'text-gray-400 hover:text-purple-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Bookmark"
              >
                <Bookmark
                  className={`h-5 w-5 ${bookmarkedArticles.has(selectedArticle.id) ? 'fill-current' : ''}`}
                />
              </button>
              <button
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Share"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-purple dark:prose-invert max-w-none">
              <div
                className="text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{
                  __html: selectedArticle.content
                    .replace(/\n/g, '<br/>')
                    .replace(/#{3} (.+?)(<br\/>|$)/g, '<h3>$1</h3>')
                    .replace(/#{2} (.+?)(<br\/>|$)/g, '<h2>$1</h2>')
                    .replace(/#{1} (.+?)(<br\/>|$)/g, '<h1>$1</h1>')
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/- (.+?)(<br\/>|$)/g, '<li>$1</li>')
                }}
              />
            </div>

            {/* Rate Article */}
            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Was this article helpful?
              </h3>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => rateArticle(rating)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        rating <= userRating
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {userRating > 0 && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Thank you for your feedback!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSearchView = () => (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <button
          onClick={goBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Back to Browse</span>
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Search Results
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Found {searchResults.length} articles matching "{searchQuery}"
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No articles found. Try different keywords.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {searchResults.map((article) => (
            <div
              key={article.id}
              className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all"
            >
              <button onClick={() => openArticle(article)} className="w-full text-left">
                <div className="flex items-center space-x-2 mb-2">
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
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {article.excerpt}
                </p>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Knowledge Base</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Policies, procedures, and helpful guides
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search Bar */}
        {view !== 'article' && (
          <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 rounded-lg">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <input
                type="text"
                placeholder="AI Search: Try 'PTO policy', 'Benefits enrollment', '401k', etc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500"
              />
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        )}

        {/* Content */}
        {view === 'browse' && renderBrowseView()}
        {view === 'article' && renderArticleView()}
        {view === 'search' && renderSearchView()}
      </div>
    </div>
  );
}
