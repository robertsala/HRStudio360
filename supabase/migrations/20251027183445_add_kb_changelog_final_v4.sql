/*
  # Add Knowledge Base Feature to Change Log
  
  Documents the comprehensive Knowledge Base system in the Change Log
*/

INSERT INTO change_log (
  change_type,
  title,
  description,
  affected_modules,
  impact_level,
  visibility_scope,
  version,
  approval_status,
  approval_required,
  notification_sent,
  source_type,
  technical_details
) VALUES (
  'feature',
  'Comprehensive Knowledge Base System with AI-Powered Search',
  E'Introducing the all-new Knowledge Base system - your centralized hub for all company policies, procedures, benefits information, training materials, and HR documentation.\n\n**🌟 Key Features:**\n• AI-powered search with natural language understanding\n• 18+ comprehensive HR articles covering all major topics\n• Role-based access control for sensitive content\n• Rich article viewer with ratings, comments, and bookmarks\n• Featured, popular, and recent article feeds\n• Personalized recommendations based on your role\n• Mobile-responsive design for access anywhere\n\n**💡 Benefits:**\n• Find answers instantly without waiting for HR\n• Self-service reduces support ticket volume\n• Always up-to-date policy information\n• Track required reading compliance\n• Rate and bookmark helpful articles\n\n**📍 Location:** Dashboard → Right column below Calendar widget\n\n**🔍 Try These Searches:**\n• "PTO policy" - Time off details\n• "Benefits enrollment" - Health insurance\n• "401k match" - Retirement savings\n• "Remote work policy" - Work from home\n• "FMLA" - Family leave information\n• "Direct deposit" - Payroll setup\n\n**📚 Content Categories:**\n✓ Company Policies | ✓ Benefits & Compensation\n✓ Time Off & Leave | ✓ Performance Management\n✓ Training & Development | ✓ Compliance & Legal\n✓ IT & Systems | ✓ General HR Support\n\n**🚀 Getting Started:**\n1. Click the purple AI search bar in the Knowledge Base widget\n2. Type your question in plain English\n3. Browse results or click to read full articles\n4. Bookmark favorites for quick access\n5. Rate articles to help improve content',
  ARRAY['Dashboard', 'Knowledge Base', 'Search', 'Content', 'AI Features'],
  'high',
  'all_employees',
  '3.5.0',
  'approved',
  false,
  true,
  'manual',
  jsonb_build_object(
    'implementation', jsonb_build_object(
      'database_tables', 13,
      'articles', 18,
      'categories', 10,
      'search_tech', 'PostgreSQL full-text + trigram indexing',
      'ai_features', 'Natural language processing, relevance scoring, personalization'
    ),
    'components', jsonb_build_array(
      'KnowledgeBaseWidget - Dashboard widget',
      'KnowledgeBaseModal - Article browser',
      'knowledgeBaseService - Search engine'
    ),
    'security', jsonb_build_array(
      'RLS on all tables',
      'Role-based access',
      'User-specific data isolation',
      'Complete audit trail'
    )
  )
) ON CONFLICT DO NOTHING;

-- Add to historical changes with correct source value
INSERT INTO historical_changes (
  change_date,
  change_type,
  title,
  description,
  source
) VALUES (
  now(),
  'feature',
  'Knowledge Base System Launch',
  'Launched comprehensive Knowledge Base with AI-powered search, 18 HR articles across 10 categories, intelligent recommendations, and full analytics tracking',
  'code_analysis'
) ON CONFLICT DO NOTHING;