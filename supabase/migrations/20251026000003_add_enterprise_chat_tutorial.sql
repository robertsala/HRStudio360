/*
  # Add Enterprise Chat Tutorial to Knowledge Base

  This migration adds comprehensive tutorial content for the Enterprise Chat feature
  to the knowledge base system.
*/

-- Insert the main Enterprise Chat guide
INSERT INTO knowledge_base_articles (title, category, content, tags, is_published, view_count, created_at, updated_at)
VALUES (
  'Enterprise Chat: Complete Guide',
  'Communication Tools',
  E'# Enterprise Chat: Complete User Guide

## What is Enterprise Chat?

Enterprise Chat is HRStudio360''s secure, end-to-end encrypted messaging system that lets you communicate instantly with colleagues. Think of it as your company''s private Slack or Teams - but with military-grade encryption to keep your conversations completely secure.

## Getting Started

### Accessing Enterprise Chat

1. **From the Dashboard**: Click on the **Enterprise Chat** tile in the Quick Access section
2. **Chat Icon**: The Enterprise Chat tile has a gradient blue-purple background with a message icon

### First Time Setup

When you open Enterprise Chat for the first time:
- The system automatically generates encryption keys for you (this happens in the background)
- You''ll see your personal "Studio AI Assistant" channel already created
- The AI Assistant welcomes you and is ready to answer HR questions

## Understanding Channels

### Channel Types

**Studio AI Assistant** (Purple robot icon)
- Your personal AI assistant for HR questions
- Ask about benefits, time off, payroll, or any HR topic
- Always available, instant responses
- Private to you only

**Direct Messages** (Person avatar)
- One-on-one private conversations
- Perfect for quick questions or private discussions
- Only you and the other person can see messages

**Group Chats** (Multiple people icon)
- Conversations with multiple team members
- Great for project teams or cross-functional collaboration
- All members can see all messages

**Department Channels** (# hashtag icon)
- Organized by department (Engineering, Marketing, HR, etc.)
- Team-wide announcements and discussions
- Visible to all department members

## Creating New Channels

### Start a Direct Message

1. Click **New Channel** button in the left sidebar
2. Select **Direct Message** option
3. Search for a colleague by name, email, or department
4. Click on their name to select them
5. Click **Create Channel**
6. Start chatting immediately!

### Create a Group Chat

1. Click **New Channel** button
2. Select **Group Chat** option
3. Enter a name for your group (e.g., "Project Phoenix Team")
4. Add a description (optional but helpful)
5. Search and select multiple team members
6. Click **Create Channel**
7. Everyone you added can now chat together

### Create a Department Channel

1. Click **New Channel** button
2. Select **Department** option
3. Enter the channel name (e.g., "Engineering Team")
4. Specify the department
5. Add a description explaining the channel''s purpose
6. Select team members to invite
7. Click **Create Channel**

## Sending Messages

### Basic Messaging

1. Select a channel from the left sidebar
2. Type your message in the input box at the bottom
3. Press **Enter** to send (or click the Send button)
4. Press **Shift + Enter** to add a new line without sending

### Message Features

- **Edit Messages**: Coming soon - ability to edit sent messages
- **Delete Messages**: Coming soon - remove messages you''ve sent
- **Read Receipts**: See who has read your messages (double check marks)
- **Timestamps**: Every message shows when it was sent
- **Message History**: Scroll up to see older messages

### Attachments

Currently, text messages are supported. File sharing capabilities are coming soon!

## Finding Your Messages

### Searching Channels

- Use the **Search channels** box at the top of the sidebar
- Search by channel name, person''s name, or department
- Channels update in real-time as you type

### Reading Messages

- **Bold Channel Names** = Unread messages
- **Blue Badges** = Number of unread messages in that channel
- Click any channel to read its messages
- Messages automatically mark as read when you view them

## Notifications

### Message Notifications

When someone sends you a message:
1. A **notification bubble** appears in the bottom-right corner
2. The bubble shows the sender''s avatar and message preview
3. Click the bubble to open chat directly to that conversation
4. Or click the **floating chat button** with the unread count

### Managing Notifications

- Notification settings for each channel coming soon
- Desktop notifications for new messages
- Sound alerts (configurable)

## Privacy & Security

### End-to-End Encryption

Your conversations are protected by military-grade encryption:
- **Messages are encrypted** on your device before sending
- **Keys are generated** automatically and stored securely on your device
- **Nobody can read your messages** - not even HRStudio360 servers
- **Private keys never leave** your device

### What This Means for You

- Your conversations are completely private
- Messages cannot be intercepted or read by anyone except intended recipients
- Even system administrators cannot decrypt your messages
- Your encryption keys are unique to you

## Features Coming Soon

- **File Sharing**: Send documents, images, and files securely
- **Message Reactions**: React to messages with emojis
- **Voice & Video Calls**: Direct calling from chat
- **Screen Sharing**: Share your screen during calls
- **Message Threading**: Reply directly to specific messages
- **Channel Pinning**: Pin important channels to the top
- **Message Search**: Search through all your messages
- **Custom Notifications**: Set notification preferences per channel

## Tips & Best Practices

### Communication Etiquette

1. **Use Direct Messages** for private or sensitive conversations
2. **Use Group Chats** for project-specific discussions
3. **Use Department Channels** for team-wide announcements
4. **Use Studio AI Assistant** for HR questions instead of bothering colleagues

### Staying Organized

1. Name group chats clearly (e.g., "Q4 Planning Team", not "Group 1")
2. Add descriptions to channels so new members understand the purpose
3. Keep conversations on-topic in department channels
4. Use direct messages for off-topic or personal discussions

### Security Tips

1. Your encryption keys are automatically managed - no action needed
2. Don''t share screenshots of sensitive conversations
3. Remember that deleted channels may still have backups
4. Report any security concerns to IT immediately

## Troubleshooting

### "No channels found"

- Refresh the chat by closing and reopening it
- Make sure you''re connected to the internet
- Your Studio AI Assistant channel should always appear

### Messages not sending

- Check your internet connection
- Try refreshing the page
- If problem persists, contact IT support

### Can''t find a colleague

- Make sure you''re spelling their name correctly
- Try searching by email address
- Try searching by department
- They must have an active HRStudio360 account

### Encryption errors

- Your keys are managed automatically
- If you see decryption errors, try refreshing the page
- Clear your browser cache if issues persist
- Contact IT if problems continue

## Getting Help

### Ask Studio AI Assistant

Your personal AI assistant can answer questions about:
- How to use chat features
- HR policies and procedures
- Benefits and time off
- Payroll questions
- And much more!

Just open your Studio AI Assistant channel and ask!

### Contact IT Support

For technical issues:
1. Go to Dashboard → System Settings
2. Click "Contact Support"
3. Or email: support@hrstudio360.com

## Keyboard Shortcuts

- **Enter**: Send message
- **Shift + Enter**: New line
- **Ctrl/Cmd + F**: Search channels (coming soon)
- **Esc**: Close chat modal

---

**Remember**: Enterprise Chat is designed to make workplace communication easy, instant, and secure. Don''t hesitate to create channels and start conversations - that''s what it''s here for!',
  ARRAY['chat', 'messaging', 'communication', 'enterprise-chat', 'direct-message', 'security', 'encryption'],
  true,
  0,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Insert quick start guide
INSERT INTO knowledge_base_articles (title, category, content, tags, is_published, view_count, created_at, updated_at)
VALUES (
  'Enterprise Chat: Quick Start Guide',
  'Communication Tools',
  E'# Enterprise Chat Quick Start

## 5-Minute Getting Started Guide

### Step 1: Open Enterprise Chat
- Go to your Dashboard
- Click the **Enterprise Chat** tile (blue-purple gradient)

### Step 2: Explore Your First Channel
- You''ll see "Studio AI Assistant" already created
- Click on it to see the welcome message
- Try asking the AI a question like "What are my PTO benefits?"

### Step 3: Start Your First Direct Message
1. Click **New Channel** button
2. Choose **Direct Message**
3. Search for a colleague''s name
4. Click their name to select them
5. Click **Create Channel**
6. Type a message and press Enter!

### Step 4: Create a Group Chat
1. Click **New Channel** button
2. Choose **Group Chat**
3. Name it (e.g., "Lunch Planning")
4. Search and add multiple people
5. Click **Create Channel**
6. Start chatting with your group!

## Key Features to Know

✅ **Messages are encrypted** - Your conversations are private and secure
✅ **Instant delivery** - Messages arrive in real-time
✅ **Unread badges** - Blue numbers show unread message counts
✅ **Notification bubbles** - Pop-ups appear when you get new messages
✅ **Studio AI Assistant** - Always available to answer HR questions

## Common Actions

**Send a message**: Type and press Enter
**Start a new chat**: Click "New Channel"
**Find a channel**: Use the search box at top
**Mark as read**: Just open and view the channel

That''s it! You''re ready to start chatting securely with your team.',
  ARRAY['chat', 'quick-start', 'getting-started', 'tutorial'],
  true,
  0,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Insert FAQ article
INSERT INTO knowledge_base_articles (title, category, content, tags, is_published, view_count, created_at, updated_at)
VALUES (
  'Enterprise Chat: Frequently Asked Questions',
  'Communication Tools',
  E'# Enterprise Chat FAQ

## General Questions

**Q: Is Enterprise Chat secure?**
A: Yes! All messages use end-to-end encryption. Your private keys never leave your device, and even HRStudio360 servers cannot decrypt your messages.

**Q: Can I use Enterprise Chat on mobile?**
A: Currently, Enterprise Chat works in any modern web browser. A dedicated mobile app is coming soon!

**Q: How do I know if someone read my message?**
A: Look for the double check marks (✓✓) next to your sent messages.

**Q: Can I delete messages?**
A: Message deletion is coming soon. For now, be thoughtful about what you send.

## Using Channels

**Q: What''s the difference between Direct Messages and Group Chats?**
A: Direct Messages are 1-on-1 conversations. Group Chats include multiple people.

**Q: How do I add someone to an existing group?**
A: Channel member management is coming soon. For now, create a new group with all desired members.

**Q: Can I leave a channel?**
A: Yes, you can leave any group chat or department channel. Direct messages remain in your list.

**Q: Who can see department channels?**
A: Only members of that specific department can access department channels.

## Studio AI Assistant

**Q: What can I ask the AI Assistant?**
A: Anything HR-related! Benefits, time off policies, payroll questions, how to use HR features, and more.

**Q: Is the AI Assistant conversation private?**
A: Yes, your AI Assistant channel is private to you only.

**Q: Does the AI have access to my personal data?**
A: The AI can reference your general employee information to provide personalized help, but it respects your privacy.

## Technical Questions

**Q: Why don''t I see any channels?**
A: Try refreshing the page. Your Studio AI Assistant channel should always appear. If not, contact IT support.

**Q: What browsers are supported?**
A: Any modern browser (Chrome, Firefox, Safari, Edge) works great.

**Q: Can I access chat from multiple devices?**
A: Yes! Your encryption keys sync automatically, and messages appear on all devices.

**Q: What happens if I clear my browser data?**
A: Your encryption keys are backed up securely. Simply log back in and everything will restore.

## Getting More Help

Still have questions? Ask your Studio AI Assistant or contact IT Support through System Settings!',
  ARRAY['chat', 'faq', 'help', 'troubleshooting'],
  true,
  0,
  now(),
  now()
) ON CONFLICT DO NOTHING;
