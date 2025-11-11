# Supabase to Backend Migration Roadmap

**Status:** Option A Complete ✅ | Option B In Progress 🔄 | Option C Pending ⏳  
**Last Updated:** November 11, 2025

---

## Executive Summary

HRStudio360 has successfully migrated from Supabase authentication to a secure backend password system. The next phase involves migrating real-time features, knowledge base, and other Supabase-dependent functionality to self-hosted backend APIs.

**Current State:**
- ✅ Password authentication (Argon2id, OWASP-compliant)
- ✅ Session management (httpOnly cookies)
- ✅ User profiles via backend API
- ❌ Real-time chat/calling (41 files affected)
- ❌ Knowledge base system
- ❌ File uploads

---

## Migration Phases

### ✅ Phase 0: Foundation (COMPLETE)
**Duration:** 1 week  
**Status:** Complete

- [x] Implement Argon2id password hashing
- [x] Add progressive account lockout
- [x] Implement rate limiting (5 req/15min)
- [x] Create auth_credentials table
- [x] Update signup/login endpoints
- [x] Remove Supabase from AuthContext
- [x] Remove @supabase/supabase-js package
- [x] Document breaking changes

---

### 🔄 Phase 1: Critical Real-Time Features (NEXT)
**Duration:** 2-3 weeks  
**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 40-60 hours

#### 1.1 WebSocket Infrastructure (Week 1)
**Goal:** Replace Supabase Realtime with WebSocket server

**Tasks:**
- [ ] Install `ws` package (already present)
- [ ] Create WebSocket server in `server/websocket.ts`
- [ ] Implement connection authentication
- [ ] Add room/channel management
- [ ] Create event broadcasting system
- [ ] Add presence tracking (online/offline)
- [ ] Implement reconnection logic

**Files to Create:**
- `server/websocket.ts` - WebSocket server
- `server/lib/websocket-auth.ts` - WS authentication
- `client/src/lib/websocket-client.ts` - Frontend WS client
- `shared/websocket-events.ts` - Event type definitions

**Deliverables:**
- Working WebSocket server on backend
- Authenticated WS connections
- Basic pub/sub system

---

#### 1.2 Real-Time Chat Migration (Week 2)
**Goal:** Migrate chat from Supabase to backend APIs + WebSocket

**Backend Tasks:**
- [ ] Add `messages` table API endpoints (GET /api/channels/:id/messages, POST)
- [ ] Add `channels` table API endpoints (if not present)
- [ ] Add `channel_members` API endpoints
- [ ] Implement WebSocket message broadcasting
- [ ] Add typing indicators via WebSocket
- [ ] Add read receipts tracking

**Frontend Tasks:**
- [ ] Update `enhancedChatService.ts` to use backend API
- [ ] Replace Supabase subscriptions with WebSocket
- [ ] Update `EnterpriseChatModal.tsx` to use new service
- [ ] Add reconnection handling
- [ ] Test real-time message delivery

**Files to Migrate:**
- `src/utils/enhancedChatService.ts`
- `src/utils/enhancedChatFeatures.ts`
- `src/utils/chatEncryptionService.ts`
- `src/components/modals/EnterpriseChatModal.tsx`
- `src/components/modals/NewChannelModal.tsx`

**Deliverables:**
- Real-time chat working via WebSocket
- Message history via REST API
- Typing indicators functional

---

#### 1.3 WebRTC Calling Migration (Week 2-3)
**Goal:** Migrate voice/video calling to backend

**Backend Tasks:**
- [ ] Add `call_sessions` table schema to `shared/schema.ts`
- [ ] Add `call_participants` table schema
- [ ] Add `call_signaling` table schema (optional, can use WebSocket)
- [ ] Create API endpoints:
  - POST /api/calls - Start call
  - GET /api/calls/:id - Get call details
  - POST /api/calls/:id/join - Join call
  - POST /api/calls/:id/leave - Leave call
  - DELETE /api/calls/:id - End call
- [ ] Implement WebRTC signaling via WebSocket
- [ ] Add call participant tracking

**Frontend Tasks:**
- [ ] Update `callingService.ts` to use backend API
- [ ] Replace Supabase subscriptions with WebSocket signaling
- [ ] Update call UI components
- [ ] Test voice calls
- [ ] Test video calls
- [ ] Test call notifications

**Files to Migrate:**
- `src/utils/callingService.ts`
- `src/components/modals/EnterpriseChatModal.tsx` (call handlers)

**Tables Needed:**
```typescript
// shared/schema.ts additions
export const callSessions = pgTable('call_sessions', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar('channel_id').references(() => channels.id),
  callerId: varchar('caller_id').references(() => profiles.id),
  callType: varchar('call_type', { enum: ['voice', 'video'] }).notNull(),
  status: varchar('status', { enum: ['ringing', 'active', 'ended', 'missed', 'declined'] }).notNull(),
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  duration: integer('duration').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

export const callParticipants = pgTable('call_participants', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  callSessionId: varchar('call_session_id').references(() => callSessions.id, { onDelete: 'cascade' }),
  userId: varchar('user_id').references(() => profiles.id),
  joinedAt: timestamp('joined_at').defaultNow(),
  leftAt: timestamp('left_at'),
  status: varchar('status', { enum: ['calling', 'connected', 'disconnected'] }).notNull()
});
```

**Deliverables:**
- Voice/video calls working
- WebRTC signaling via WebSocket
- Call history tracked in database

---

### Phase 2: Knowledge Base & Content (3-4 weeks)
**Priority:** 🟡 IMPORTANT  
**Estimated Effort:** 20-30 hours

#### 2.1 Knowledge Base Schema & API
**Tasks:**
- [ ] Add KB tables to schema (articles, categories, views, ratings, bookmarks)
- [ ] Run database migration
- [ ] Create API endpoints for articles CRUD
- [ ] Create API endpoints for categories
- [ ] Implement article search
- [ ] Add view tracking
- [ ] Add bookmark system
- [ ] Add rating system

**Files to Migrate:**
- `src/utils/knowledgeBaseService.ts`
- `src/components/KnowledgeBaseWidget.tsx`
- `src/components/modals/KnowledgeBaseModal.tsx`

**Deliverables:**
- Knowledge base fully functional
- Search working
- Analytics tracked

---

### Phase 3: Notifications & Presence (1-2 weeks)
**Priority:** 🟡 IMPORTANT  
**Estimated Effort:** 15-20 hours

#### 3.1 Notification System
**Tasks:**
- [ ] Add `notifications` table to schema
- [ ] Create notification API endpoints
- [ ] Implement WebSocket notification delivery
- [ ] Update NotificationsModal
- [ ] Add notification preferences

**Files to Migrate:**
- `src/components/modals/NotificationsModal.tsx`

#### 3.2 User Presence
**Tasks:**
- [ ] Implement presence tracking via WebSocket heartbeat
- [ ] Add online/offline status to user profiles
- [ ] Update UI to show presence

**Files to Migrate:**
- `src/hooks/useUserPresence.ts`

**Deliverables:**
- Real-time notifications working
- User presence visible

---

### Phase 4: File Storage (2-3 weeks)
**Priority:** 🟢 LOW  
**Estimated Effort:** 20-30 hours

**Tasks:**
- [ ] Choose storage solution (local filesystem, S3, Cloudflare R2)
- [ ] Implement file upload API
- [ ] Add file access controls
- [ ] Migrate chat attachment uploads
- [ ] Migrate document uploads (payroll, etc.)

**Deliverables:**
- File uploads working
- Chat attachments functional

---

### Phase 5: Performance Reviews (1-2 weeks)
**Priority:** 🟡 IMPORTANT  
**Estimated Effort:** 10-15 hours

**Tasks:**
- [ ] Update `performanceReviewService.ts` to use backend API
- [ ] Add real-time collaboration via WebSocket (optional)
- [ ] Update review modals

**Files to Migrate:**
- `src/utils/performanceReviewService.ts`
- `src/components/modals/ComprehensivePerformanceReviewModal.tsx`

---

### Phase 6: Final Cleanup (1 week)
**Priority:** 🟢 LOW  
**Estimated Effort:** 8-12 hours

**Tasks:**
- [ ] Remove all remaining Supabase imports
- [ ] Clean up unused utilities
- [ ] Update theme persistence to use backend API
- [ ] Update dashboard state persistence
- [ ] Final testing of all features
- [ ] Update documentation

**Files to Clean:**
- All 41 files with Supabase references
- Remove dead code
- Update tests

---

## Resource Requirements

### Backend Developer Skills Needed
- Node.js/Express
- WebSocket (ws library)
- PostgreSQL/Drizzle ORM
- WebRTC signaling understanding
- Real-time system architecture

### Frontend Developer Skills Needed
- React/TypeScript
- WebSocket client implementation
- State management for real-time data
- WebRTC peer connections

### DevOps/Infrastructure
- WebSocket server deployment
- Load balancing for WebSocket connections
- File storage setup
- Monitoring for WebSocket connections

---

## Risk Assessment

### High Risk Items
1. **WebRTC Signaling** - Complex peer-to-peer connection setup
2. **Real-time Message Delivery** - Must be reliable, no message loss
3. **WebSocket Scalability** - May need sticky sessions or Redis pub/sub

### Medium Risk Items
1. **File Storage** - Need secure, scalable solution
2. **Database Performance** - Real-time queries must be optimized
3. **Reconnection Logic** - Must handle network interruptions gracefully

### Mitigation Strategies
- Start with MVP for each feature
- Implement comprehensive error handling
- Add retry logic and fallbacks
- Monitor performance closely
- User testing at each phase

---

## Testing Strategy

### Unit Tests
- WebSocket connection handling
- Message serialization/deserialization
- Authentication middleware
- API endpoint validation

### Integration Tests
- End-to-end message flow
- Call setup and signaling
- File upload/download
- Notification delivery

### Manual Testing Checklist
- [ ] Real-time chat between 2+ users
- [ ] Voice call functionality
- [ ] Video call functionality
- [ ] Typing indicators
- [ ] Presence updates
- [ ] Notifications
- [ ] Knowledge base search
- [ ] File uploads

---

## Success Metrics

### Phase 1 (Critical)
- ✅ Message delivery latency < 500ms
- ✅ Call connection success rate > 95%
- ✅ WebSocket uptime > 99%
- ✅ Zero data loss on reconnection

### Phase 2-6
- All Supabase dependencies removed
- All features functional
- Performance metrics maintained or improved
- No security regressions

---

## Timeline Summary

| Phase | Duration | Priority | Status |
|-------|----------|----------|--------|
| Phase 0: Foundation | 1 week | CRITICAL | ✅ COMPLETE |
| Phase 1: Real-Time (Chat/Calls) | 2-3 weeks | CRITICAL | 🔄 NEXT |
| Phase 2: Knowledge Base | 3-4 weeks | IMPORTANT | ⏳ PENDING |
| Phase 3: Notifications/Presence | 1-2 weeks | IMPORTANT | ⏳ PENDING |
| Phase 4: File Storage | 2-3 weeks | LOW | ⏳ PENDING |
| Phase 5: Performance Reviews | 1-2 weeks | IMPORTANT | ⏳ PENDING |
| Phase 6: Final Cleanup | 1 week | LOW | ⏳ PENDING |

**Total Estimated Time:** 10-16 weeks (2.5-4 months)

---

## Next Immediate Actions (Option C)

1. **This Week:**
   - Set up WebSocket server infrastructure
   - Implement WS authentication
   - Create basic pub/sub system

2. **Next Week:**
   - Migrate chat messages to backend API
   - Implement real-time message delivery via WebSocket
   - Begin call signaling migration

3. **Following Week:**
   - Complete WebRTC calling migration
   - Test end-to-end calling
   - Begin knowledge base migration

---

## Decision Points

### Storage Solution Options
- **Local Filesystem**: Simple, no external deps, limited scalability
- **AWS S3**: Industry standard, reliable, additional cost
- **Cloudflare R2**: S3-compatible, no egress fees
- **Recommendation**: Start with local filesystem, migrate to R2 later

### WebSocket Architecture
- **Single Server**: Simple, works for small teams (<100 users)
- **Redis Pub/Sub**: Scalable, supports multiple servers
- **Recommendation**: Start with single server, add Redis when needed

### Real-Time Signaling
- **WebSocket**: Best for bidirectional, low-latency communication
- **Server-Sent Events**: One-way, simpler
- **Polling**: Fallback only
- **Recommendation**: WebSocket primary, SSE fallback

---

## Appendix: File Migration Checklist

### Critical (41 files total)
- [ ] src/utils/callingService.ts
- [ ] src/utils/enhancedChatService.ts
- [ ] src/utils/enhancedChatFeatures.ts
- [ ] src/utils/chatEncryptionService.ts
- [ ] src/components/modals/EnterpriseChatModal.tsx
- [ ] src/components/modals/NewChannelModal.tsx
- [ ] src/utils/knowledgeBaseService.ts
- [ ] src/components/KnowledgeBaseWidget.tsx
- [ ] src/components/modals/KnowledgeBaseModal.tsx
- [ ] src/components/modals/NotificationsModal.tsx
- [ ] src/utils/performanceReviewService.ts
- [ ] src/hooks/useUserPresence.ts

### Low Priority (29 files)
- [ ] src/contexts/ThemeContext.tsx
- [ ] src/components/Dashboard.tsx
- [ ] src/utils/weatherService.ts
- [ ] src/utils/paycheckFunFacts.ts
- [ ] src/utils/snapshotService.ts
- [ ] src/utils/aiDiagnosticsService.ts
- [ ] ... (remaining 23 modal files)

---

**Document Status:** Living document, updated as migration progresses
