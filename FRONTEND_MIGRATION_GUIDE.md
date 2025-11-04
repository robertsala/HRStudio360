# Frontend Migration Guide

## Current Status

### ✅ Completed
1. **Backend Infrastructure** - Full REST API with Express + Drizzle ORM
2. **Database** - PostgreSQL schema created and pushed successfully  
3. **API Client** - Created `src/lib/api.ts` with methods for all backend endpoints (ready to use)
4. **Migration Guide** - Comprehensive documentation of migration steps

### ⚠️ Frontend Still Uses Supabase

**IMPORTANT:** The frontend has NOT been migrated yet. It still uses Supabase for:
- Authentication (AuthContext uses `supabase.auth`)
- All database queries (60+ modal components use Supabase client)
- Realtime subscriptions
- File storage

The API client exists and is ready, but no frontend components have been converted to use it yet.

### ⚠️ Remaining Work

The frontend migration is **SUBSTANTIAL** - this is an enterprise HR system with:
- 60+ modal components
- Complex authentication with session management, retry logic, impersonation
- Extensive Supabase realtime subscriptions
- Celebration service, chat service, knowledge base service
- Multiple utility services that interface with Supabase

## Migration Strategy

### Phase 1: Core Authentication (CRITICAL)
**File: `src/contexts/AuthContext.tsx` (521 lines)**

This file needs complete rewrite to use the new backend API instead of Supabase auth:

**Current Issues:**
- Uses `supabase.auth.getSession()` 
- Uses `supabase.auth.onAuthStateChange()` for realtime updates
- Complex retry logic built around Supabase specifics
- Session expiry warnings tied to Supabase tokens

**Migration Steps:**
```typescript
// Replace Supabase auth calls with API client
const initAuth = async () => {
  const { data: session } = await apiClient.getSession();
  if (session?.user) {
    await loadUserProfile(session.user.id, session.user.email);
  }
};

const signIn = async (email: string, password: string) => {
  const { data, error } = await apiClient.login(email, password);
  if (error) throw new Error(error);
  if (data?.user) {
    await loadUserProfile(data.user.id, data.user.email);
  }
};

const signOut = async () => {
  await apiClient.logout();
  setUser(null);
  setIsAuthenticated(false);
};
```

**Remove:**
- All `supabase.auth.*` calls
- Realtime auth state subscription (implement polling or WebSocket alternative)
- Supabase-specific error handling

### Phase 2: Modal Components (60+ files)
Each modal needs to replace Supabase queries with API client calls.

**Example: `src/components/modals/HiringModal.tsx`**

**Before (Supabase):**
```typescript
const { data, error } = await supabase
  .from('candidates')
  .select('*')
  .order('applied_date', { ascending: false });
```

**After (API Client):**
```typescript
// Add to src/lib/api.ts first:
async getCandidates() {
  return this.request('/api/candidates');
}

// Then in component:
const { data, error } = await apiClient.getCandidates();
```

**Files to Update (Partial List):**
- `HiringModal.tsx` - candidates, collaborators
- `OfferManagementModal.tsx` - offers, authentication
- `PayrollModal.tsx` - payroll data, currencies
- `ComprehensiveExpenseModal.tsx` - expenses, categories, vendors
- `EmployeeDirectoryModal.tsx` - employee data
- `LeaveManagementModal.tsx` - leave requests
- `PerformanceReviewModal.tsx` - reviews
- `TimeTrackingModal.tsx` - time entries
- ... and 50+ more modal files

### Phase 3: Service Utilities
**Files that need updating:**
- `src/utils/celebrationService.ts` - Birthday/anniversary checks
- `src/utils/chatService.ts` - Enterprise chat functionality
- `src/utils/enhancedChatService.ts` - Advanced chat features  
- `src/utils/knowledgeBaseService.ts` - Knowledge base queries
- `src/utils/performanceReviewService.ts` - Performance data
- ... and more

### Phase 4: Backend Expansion
The current backend only has core tables. You'll need to add:
- Candidates table for hiring
- Performance reviews table
- Payroll tables
- Time tracking tables
- Chat messages tables
- Knowledge base tables
- And 100+ more tables from the original Supabase migrations

## How to Continue the Migration

### Step 1: Expand Backend Schema
Look at the Supabase migrations and add tables to `shared/schema.ts`:

```typescript
// Example: Add candidates table
export const candidates = pgTable('candidates', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  position: varchar('position', { length: 255 }),
  status: varchar('status', { length: 50 }),
  appliedDate: timestamp('applied_date').defaultNow(),
  // ... more fields
});

export const insertCandidateSchema = createInsertSchema(candidates);
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;
```

### Step 2: Update Storage Interface
Add methods to `server/storage.ts`:

```typescript
interface IStorage {
  // ... existing methods
  
  // Add new methods
  getCandidates(): Promise<Candidate[]>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: number, updates: Partial<InsertCandidate>): Promise<Candidate | null>;
}
```

### Step 3: Add API Routes
Add endpoints to `server/routes.ts`:

```typescript
app.get('/api/candidates', async (req, res) => {
  const candidates = await storage.getCandidates();
  res.json(candidates);
});

app.post('/api/candidates', async (req, res) => {
  const result = insertCandidateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  const candidate = await storage.createCandidate(result.data);
  res.json(candidate);
});
```

### Step 4: Add API Client Methods
Update `src/lib/api.ts`:

```typescript
async getCandidates() {
  return this.request('/api/candidates');
}

async createCandidate(candidate: any) {
  return this.request('/api/candidates', {
    method: 'POST',
    body: JSON.stringify(candidate),
  });
}
```

### Step 5: Update Frontend Component
Replace Supabase calls in the component:

```typescript
// Before
const { data } = await supabase.from('candidates').select('*');

// After  
const { data } = await apiClient.getCandidates();
```

## Realistic Timeline Estimate

Given the scale of this application:

- **Backend schema expansion**: 10-20 hours (adding all tables)
- **Core AuthContext rewrite**: 4-6 hours
- **60+ Modal components**: 30-60 hours (30min - 1hr each)
- **Service utilities**: 10-15 hours
- **Testing & debugging**: 20-30 hours
- **Total**: **80-130 hours** of development work

## Recommended Approach

### Option 1: Incremental Migration (Recommended)
1. Start with most-used features first (Employee Directory, Leave Management)
2. Keep Supabase running alongside new backend initially
3. Migrate feature by feature, testing thoroughly
4. Gradually sunset Supabase once all features migrated

### Option 2: Fresh Start
1. Use the backend foundation created here
2. Rebuild frontend components from scratch using new API
3. Leverage existing UI components and styling
4. Implement features based on business priority

## What's Been Delivered

✅ **A Complete, Working Backend Foundation:**
- Express server with TypeScript
- Drizzle ORM with PostgreSQL
- Core HR tables (profiles, employees, departments, leave requests)
- REST API with CRUD operations
- Migrated edge functions (onboarding email, AI assistant)
- Database pushed and ready
- Server running on port 5000

✅ **Migration Architecture:**
- Clear separation of concerns
- Scalable API structure
- Type-safe with Zod validation
- Ready for incremental expansion

⚠️ **Not Yet Complete:**
- Frontend still uses Supabase client
- Only core tables migrated (not full 100+ table schema)
- Realtime features need WebSocket implementation
- Authentication flow needs completion

## Next Immediate Steps

1. **Complete AuthContext migration** - This unblocks all other work
2. **Add 2-3 key tables** you need most (e.g., candidates, payroll)
3. **Migrate 1-2 critical modals** as proof of concept
4. **Test end-to-end** flow with new backend
5. **Iterate** from there

The foundation is solid. The remaining work is systematic but substantial.
