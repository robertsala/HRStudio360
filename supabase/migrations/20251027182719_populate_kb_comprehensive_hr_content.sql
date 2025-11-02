/*
  # Populate Knowledge Base with Comprehensive HR Content
  
  ## Overview
  Adds production-ready HR articles across all categories with searchable content
  for AI-powered natural language queries.
  
  ## Categories Covered
  - Company Policies (Remote work, code of conduct)
  - Time Off & Leave (PTO, FMLA)
  - IT & Systems (Quick start, security)
  - General HR Support (FAQ)
*/

-- Get or create system author
DO $$
DECLARE
  system_author_id uuid;
BEGIN
  -- Try to get existing author
  SELECT author_id INTO system_author_id FROM kb_articles LIMIT 1;
  
  -- If no articles exist, use a default UUID
  IF system_author_id IS NULL THEN
    system_author_id := 'fd470cf0-2c89-413a-865c-69af50e716e4';
  END IF;

  -- Add new categories if they don't exist
  INSERT INTO kb_categories (id, name, slug, description, icon, color, display_order, active) VALUES
    ('66666666-6666-6666-6666-666666666666', 'Company Policies', 'company-policies', 'Core policies and guidelines for all employees', 'FileText', '#3b82f6', 6, true),
    ('77777777-7777-7777-7777-777777777777', 'Time Off & Leave', 'time-off-leave', 'PTO, sick leave, FMLA, and other time-off policies', 'Calendar', '#8b5cf6', 7, true),
    ('88888888-8888-8888-8888-888888888888', 'Compliance & Legal', 'compliance-legal', 'Required policies, legal information, and compliance guidelines', 'Shield', '#ef4444', 8, true),
    ('99999999-9999-9999-9999-999999999999', 'IT & Systems', 'it-systems', 'Software access, security, and technical support', 'Monitor', '#06b6d4', 9, true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'General HR Support', 'general-hr-support', 'FAQs and common HR questions', 'HelpCircle', '#84cc16', 10, true)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = now();

  -- Add comprehensive articles with proper author
  INSERT INTO kb_articles (category_id, author_id, title, slug, content, excerpt, status, is_featured, is_required_reading, published_at) VALUES
  -- Time Off Articles
  (
    '77777777-7777-7777-7777-777777777777',
    system_author_id,
    'Paid Time Off (PTO) Policy',
    'pto-policy-guide',
    E'# Paid Time Off (PTO) Policy\n\n## Overview\nHRStudio360 provides generous PTO combining vacation, sick time, and personal days into one flexible bank.\n\n## Accrual Rates\n- **0-2 Years**: 15 days (120 hours) | 10 hours/month\n- **3-5 Years**: 20 days (160 hours) | 13.33 hours/month  \n- **6-10 Years**: 25 days (200 hours) | 16.67 hours/month\n- **11+ Years**: 30 days (240 hours) | 20 hours/month\n\n## How to Request\n1. Submit in HRStudio360 at least 2 weeks in advance\n2. Manager reviews based on business needs\n3. Receive confirmation email\n4. Update calendar and set out-of-office\n\n## Emergency/Sick Time\n- Use PTO same-day for illness or emergency\n- Notify manager as early as possible\n- No advance approval needed\n\n## Carryover\n- Maximum: 1.5x annual allotment\n- Up to 80 hours carry to next year\n- Excess hours forfeited December 31\n\n## Company Holidays (11 Days)\nNew Year''s Day, MLK Day, Presidents Day, Memorial Day, Juneteenth, Independence Day, Labor Day, Thanksgiving, Day After Thanksgiving, Christmas Eve, Christmas Day\n\n**Plus 2 floating holidays!**\n\n## Questions?\npto@hrstudio360.com',
    'Comprehensive PTO policy with accrual rates, usage guidelines, carryover rules, and holidays.',
    'published',
    true,
    false,
    now()
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    system_author_id,
    'Family and Medical Leave (FMLA) Guide',
    'fmla-leave-guide',
    E'# Family and Medical Leave (FMLA)\n\n## Eligibility\n- 12+ months with company\n- 1,250+ hours in past 12 months\n- Location with 50+ employees within 75 miles\n\n## Qualifying Reasons\n\n**Personal Medical**\n- Serious health condition\n- Chronic conditions\n- Pregnancy/childbirth\n- Surgery recovery\n\n**Family Care**\n- Spouse, child, or parent with serious condition\n- Newborn/adoption bonding (within 12 months)\n- Military caregiver (up to 26 weeks)\n\n**Military Family**\n- Deployment-related qualifying exigency\n\n## Leave Duration\n- Standard: Up to 12 weeks\n- Military Caregiver: Up to 26 weeks\n- Intermittent: Blocks when medically necessary\n\n## Pay During Leave\n- Use accrued PTO first (concurrent with FMLA)\n- Short-term disability if eligible\n- Remainder unpaid after PTO exhausted\n\n## Benefits Continue\n- Health insurance maintained\n- You pay normal premium\n- Life/disability insurance continues\n- 401(k) pauses, PTO accrual pauses\n\n## How to Request\n1. Notify HR ASAP (30 days if foreseeable)\n2. Complete paperwork + medical certification\n3. Receive approval within 5 days\n4. Keep HR updated\n\n## Job Protection\n- Same/equivalent position upon return\n- Same pay, benefits, terms\n- No retaliation\n\n## Questions?\nleaves@hrstudio360.com | 1-800-FMLA-HELP',
    'Complete FMLA guide covering eligibility, qualifying reasons, pay, benefits, and request process.',
    'published',
    false,
    false,
    now()
  ),
  
  -- Company Policies
  (
    '66666666-6666-6666-6666-666666666666',
    system_author_id,
    'Remote Work Policy',
    'remote-work-comprehensive',
    E'# Remote Work Policy\n\n## Work Arrangements\n\n**Fully Remote**\n- 5 days/week from home\n- Occasional office visits\n- Must reside within reasonable distance\n\n**Hybrid**\n- Office + remote split\n- Min 2 days/week in office (Tue-Thu)\n- Flexible with manager approval\n\n## Home Office Requirements\n- Dedicated quiet workspace\n- High-speed internet (50+ Mbps)\n- Ergonomic chair and desk\n- Good lighting\n\n**Company Provides**\n- Laptop, monitor (on request)\n- Keyboard, mouse, headset\n\n## Work Hours\n- Regular business hours (9am-5pm local)\n- Available during core hours (10am-3pm)\n- Respond within 2 hours\n- Keep calendar updated\n\n## Communication\n- Camera on in video meetings\n- Prompt message responses\n- Attend all required meetings\n- Regular manager check-ins\n\n## Security\n- Use company VPN always\n- Never share credentials\n- Lock computer when away\n- Keep software updated\n- Report incidents immediately\n\n## Performance\nSame standards as in-office:\n- Work quality and timeliness\n- Communication and collaboration\n- Meeting participation\n- Responsiveness\n\n## Questions?\nremotework@hrstudio360.com',
    'Remote and hybrid work guidelines including requirements, equipment, and expectations.',
    'published',
    true,
    false,
    now()
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    system_author_id,
    'Code of Conduct and Ethics',
    'code-of-conduct-ethics',
    E'# Code of Conduct and Ethics\n\n## Core Values\n\n**Integrity**\n- Act honestly\n- Report conflicts of interest\n- Never accept bribes\n- Protect confidential info\n\n**Respect**\n- Treat colleagues with dignity\n- Embrace diversity and inclusion\n- Harassment-free workplace\n- Professional communication\n\n**Excellence**\n- High-quality work\n- Ownership of responsibilities\n- Continuous improvement\n- Team support\n\n## Expected Behaviors\n1. Professional communication\n2. Punctuality\n3. Appropriate dress code\n4. Workplace safety\n5. Data security\n\n## Prohibited Conduct\n- Harassment or discrimination\n- Violence or threats\n- Substance abuse\n- Resource misuse\n- Confidentiality violations\n\n## Reporting\n- Manager or HR immediately\n- Ethics hotline: 1-800-ETHICS-1\n- Email: ethics@hrstudio360.com\n\nRetaliation strictly prohibited.\n\n## Consequences\nDisciplinary action up to termination.',
    'Ethical standards and professional behavior expectations for all employees.',
    'published',
    true,
    true,
    now()
  ),
  
  -- IT & Systems
  (
    '99999999-9999-9999-9999-999999999999',
    system_author_id,
    'HRStudio360 Quick Start Guide',
    'hrstudio360-quickstart',
    E'# HRStudio360 Quick Start\n\n## Login\n1. Go to app.hrstudio360.com\n2. Enter work email\n3. Get verification code\n4. Set up MFA\n\n## Dashboard Features\n- **Time Off**: Request PTO, view balance\n- **Payroll**: Pay stubs, tax docs\n- **Benefits**: Enroll and manage\n- **Performance**: Goals and reviews\n- **Directory**: Find colleagues\n\n## Quick Actions\n- Request Time Off\n- View Pay Stub\n- Update Profile\n- Submit Expense\n- Chat with HR\n\n## Mobile App\n**Download**: Search \"HRStudio360\" in App/Play Store\n\n**Features**\n- Request time off\n- Clock in/out\n- View pay stubs\n- Access directory\n- Push notifications\n\n## Getting Help\n- Click ? icon\n- Search knowledge base\n- Chat with AI assistant\n- Submit support ticket\n\n**Help Desk**\n- support@hrstudio360.com\n- 1-800-HR-HELP-1\n- Mon-Fri 7am-7pm EST\n\n## Security Tips\n- Never share password\n- Log out when leaving\n- Use strong passwords\n- Enable MFA\n- Report suspicious activity\n\n## Success Tips\n1. Update profile with photo\n2. Set up notifications\n3. Explore features\n4. Use mobile app\n5. Check regularly',
    'Quick start guide for HRStudio360 platform access and navigation.',
    'published',
    true,
    false,
    now()
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    system_author_id,
    'IT Security Best Practices',
    'it-security-best-practices',
    E'# IT Security Best Practices\n\n## Passwords\n\n**Requirements**\n- 12+ characters\n- Uppercase + number + special char\n- Can''t reuse last 5\n- Expires every 90 days\n\n**Best Practices**\n- Use password manager\n- Never share\n- Unique per account\n- Enable MFA\n\n## Multi-Factor Authentication\n\n**Required for**\n- Email\n- HR systems\n- Financial apps\n- VPN/remote access\n\n**Setup**\n1. Security settings\n2. Enable MFA\n3. Download authenticator app\n4. Scan QR code\n5. Save backup codes\n\n## VPN Usage\n\n**When to Use**\n- Remote access\n- Public WiFi\n- Working from home\n- Business travel\n\n## Email Security\n\n**Phishing Red Flags**\n- Urgent requests\n- Suspicious senders\n- Unexpected attachments\n- Password requests\n- Poor grammar\n- Mismatched URLs\n\n**What to Do**\n1. Don''t click/download\n2. Verify sender separately\n3. Report: phishing@hrstudio360.com\n4. Delete\n\n## Data Protection\n\n**Confidential Info**\n- Customer data\n- Employee records\n- Financial info\n- Business strategies\n- Intellectual property\n\n**Handling**\n- Access only what needed\n- Don''t share unauthorized\n- Encrypt sensitive files\n- Shred physical docs\n- Lock screen when away\n\n## Device Security\n\n**Company Devices**\n- Keep updated\n- Enable encryption\n- Screen lock (5 min max)\n- Report loss immediately\n- Never leave unattended\n\n## Incident Reporting\n\n**Report If**\n- Lost/stolen device\n- Data breach\n- Phishing email\n- Malware\n- Unauthorized access\n\n**Contact**\n- Emergency: 1-800-IT-HELP-1\n- security@hrstudio360.com\n\n## Training\nAnnual security awareness required\n\n## Questions?\nsecurity@hrstudio360.com | 1-800-SECURE-1',
    'IT security guidelines covering passwords, phishing, VPN, data protection, and incident reporting.',
    'published',
    true,
    true,
    now()
  ),
  
  -- General HR Support
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    system_author_id,
    'HR Frequently Asked Questions',
    'hr-faq-common-questions',
    E'# Frequently Asked Questions\n\n## Getting Started\n\n**When do benefits start?**\nFirst day of month after hire date.\n\n**How do I set up direct deposit?**\nPayroll > Direct Deposit, enter bank info, upload voided check.\n\n**When is my first paycheck?**\nSecond Friday after start date (bi-weekly on Fridays).\n\n## Time Off\n\n**How much PTO?**\n0-2 yrs: 15 days | 3-5 yrs: 20 days | 6-10 yrs: 25 days | 11+ yrs: 30 days\n\n**Can I use PTO in first 90 days?**\nYes! Accrues from day one, usable after 30 days.\n\n**Paid for unused PTO when leaving?**\nYes, paid with final paycheck.\n\n**Can I donate PTO?**\nYes! PTO donation program available. Contact HR.\n\n## Benefits\n\n**Change benefits outside open enrollment?**\nOnly with qualifying life event within 30 days.\n\n**401(k) match?**\n100% match on first 6% of salary, starts after 90 days.\n\n**When to enroll?**\nNew hires: 30 days | Current: November open enrollment\n\n## Payroll\n\n**Update W-4?**\nPayroll > Tax Documents, complete new W-4.\n\n**When is W-2 available?**\nBy January 31 in HRStudio360.\n\n**Paycheck advance?**\nNot available, but 401(k) loans possible.\n\n## Performance\n\n**When are reviews?**\nAnnual in February, mid-year check-in in July.\n\n**How are raises determined?**\nPerformance ratings + company performance + budget. Effective April 1.\n\n**Request feedback anytime?**\nYes! Use HRStudio360 feedback tool.\n\n## Career Development\n\n**Professional development budget?**\nICs: $2,000/yr | Managers: $3,000/yr | Directors+: $5,000/yr\n\n**Tuition reimbursement?**\nUndergrad: $5,250/yr | Grad: $10,000/yr\n\n**Time before transferring?**\nMinimum 18 months.\n\n## Workplace\n\n**Dress code?**\nBusiness casual Mon-Thu, casual Friday. No ripped jeans or offensive graphics.\n\n**Work remotely?**\nRole-dependent. Hybrid: 2+ days in office. Fully remote for eligible roles.\n\n**Free snacks?**\nYes! Coffee, tea, healthy snacks in all kitchens.\n\n## IT & Equipment\n\n**Personal devices for work?**\nMust have company security software. Contact IT.\n\n**What software access?**\nAll get Microsoft 365, Slack, Zoom + role-specific. Request through IT.\n\n**Tech issues?**\nsupport@hrstudio360.com | 1-800-HR-HELP-1\n\n## Contacts\n\n- **General HR**: hr@hrstudio360.com | 2000\n- **Benefits**: benefits@hrstudio360.com | 2100\n- **Payroll**: payroll@hrstudio360.com | 2200\n- **IT Support**: support@hrstudio360.com | 4000\n\n## Still Have Questions?\nSearch Knowledge Base or chat with AI assistant!',
    'Common HR questions about benefits, payroll, time off, career development, and workplace policies.',
    'published',
    true,
    false,
    now()
  ) ON CONFLICT (slug) DO NOTHING;
END $$;