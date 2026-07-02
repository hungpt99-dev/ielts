# Plan: Remove AI Tutor Tab and Add AI Tutor Chat Popup Input

## Summary

Remove the AI Tutor tab from navigation and add an AI Tutor chat popup input component

## Tasks

1. Remove AI Tutor tab from navigation in src/services/ChatContext.ts
2. Add AI Tutor chat popup input component in src/components/aiTutor/ChatPopup.tsx (depends on: Remove AI Tutor tab from navigation in src/services/ChatContext.ts)
3. Remove AI Tutor tab references from UI components and routes (depends on: Remove AI Tutor tab from navigation in src/services/ChatContext.ts)
4. Integrate AI Tutor chat popup input with chat message state and submission logic (depends on: Add AI Tutor chat popup input component in src/components/aiTutor/ChatPopup.tsx)
5. Update apps/extension/popup.html to ensure chat popup input is rendered (depends on: Add AI Tutor chat popup input component in src/components/aiTutor/ChatPopup.tsx)
6. Test and validate removal of AI Tutor tab and addition of chat popup input (depends on: Remove AI Tutor tab from navigation in src/services/ChatContext.ts, Add AI Tutor chat popup input component in src/components/aiTutor/ChatPopup.tsx, Remove AI Tutor tab references from UI components and routes, Integrate AI Tutor chat popup input with chat message state and submission logic, Update apps/extension/popup.html to ensure chat popup input is rendered)