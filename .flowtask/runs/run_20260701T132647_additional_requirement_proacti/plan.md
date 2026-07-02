# Plan: Implement AI Tutor Chat Widget with Proactive Messaging

## Summary

Add AI Tutor chat icon, messenger-style popup, proactive message engine, settings, and notification center with local-first behavior

## Tasks

1. Add AI Tutor Chat Icon Component in src/components/aiTutor/ChatIcon.tsx
2. Implement Messenger-Style Chat Popup in src/components/aiTutor/ChatPopup.tsx (depends on: Add AI Tutor Chat Icon Component in src/components/aiTutor/ChatIcon.tsx)
3. Design and Implement Local Proactive Message Engine in src/services/ProactiveMessageEngine.ts (depends on: Implement Messenger-Style Chat Popup in src/components/aiTutor/ChatPopup.tsx)
4. Add Proactive Message Settings UI in src/components/aiTutor/ProactiveSettings.tsx (depends on: Design and Implement Local Proactive Message Engine in src/services/ProactiveMessageEngine.ts)
5. Implement Notification Center in src/components/aiTutor/NotificationCenter.tsx (depends on: Add Proactive Message Settings UI in src/components/aiTutor/ProactiveSettings.tsx)
6. Implement Chat Context Awareness in src/services/ChatContext.ts (depends on: Implement Notification Center in src/components/aiTutor/NotificationCenter.tsx)
7. Implement Local Chat Memory Storage in src/services/LocalChatMemory.ts (depends on: Implement Chat Context Awareness in src/services/ChatContext.ts)
8. Implement Extension Proactive Assistant Integration in src/extension/ProactiveAssistant.ts (depends on: Implement Local Chat Memory Storage in src/services/LocalChatMemory.ts)
9. Implement UX Enhancements for AI Tutor Chat Widget in src/components/aiTutor/ChatUXEnhancements.tsx (depends on: Implement Messenger-Style Chat Popup in src/components/aiTutor/ChatPopup.tsx)