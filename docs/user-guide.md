# IELTS Journey — User Guide

> Welcome to IELTS Journey! This guide walks you through getting started, using core and AI features, and getting the most out of your study experience.

---

## Table of Contents

1. [Welcome](#1-welcome)
2. [Getting Started](#2-getting-started)
3. [AI Configuration](#3-ai-configuration)
4. [AI Learning Progress Review](#4-ai-learning-progress-review)
5. [AI Tutor Chat](#5-ai-tutor-chat)
6. [Exercise Generator](#6-exercise-generator)
7. [Proactive Messages](#7-proactive-messages)
8. [Other AI Features](#8-other-ai-features)
9. [Tips & Best Practices](#9-tips--best-practices)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Welcome

IELTS Journey is a comprehensive, local-first IELTS preparation tool that runs entirely in your browser. It helps you manage vocabulary, practice all four IELTS skills (Reading, Listening, Writing, Speaking), track mistakes, monitor progress, and optionally use AI for personalized feedback — all while keeping your data private and under your control.

### What Makes It Different

- **Local-first**: All data lives in your browser. You own it.
- **Privacy-safe**: No cloud, no telemetry, no data leaving your device unless you explicitly use AI features with your own API key.
- **Offline-capable**: Core features work without internet. AI features require a connection but are entirely optional.
- **AI-enhanced**: Optional AI integration provides personalized tutoring, progress reviews, exercise generation, and more.

---

## 2. Getting Started

### 2.1 Opening the App

Open IELTS Journey in any modern browser (Chrome, Edge, Firefox, or Safari). For the best experience:

- **Install as PWA**: Click the install icon in your browser's address bar to add IELTS Journey to your home screen. It will then work like a native app and remain usable offline.
- **Chrome users**: Use the extension for collecting content from any webpage directly into your study database.

### 2.2 First-Run Experience

The first time you open the app, an onboarding wizard will guide you through:

1. **Welcome screen** — A brief introduction to the app
2. **Profile setup** — Set your target band score and exam date (optional but recommended)
3. **Feature tour** — A quick walkthrough of the main sections
4. **AI configuration prompt** — Optionally configure AI (or skip and do it later from Settings)

You can revisit the onboarding at any time from **Settings → Onboarding**.

### 2.3 Core Features (No Setup Required)

These features work immediately after opening the app — no sign-up, no API key, and no internet required:

| Feature | How to Access |
|---------|---------------|
| **Vocabulary Management** | Add, tag, filter, and review words with spaced repetition |
| **Reading Practice** | Log reading sessions, track comprehension |
| **Listening Practice** | Log listening sessions, track scores |
| **Writing Practice** | Practice Task 1 & 2 essays, track band estimates |
| **Speaking Practice** | Log speaking sessions across Parts 1–3 |
| **Grammar Notes** | Organize grammar topics with examples |
| **Mistake Notebook** | Record and review mistakes with correction tracking |
| **Mock Test Tracker** | Log band scores and track progress over time |
| **Daily Study Plan** | Plan and track daily tasks across all skills |
| **Progress Analytics** | Charts for study days, hours, skill balance, and band trends |
| **Content Library** | Built-in IELTS reading and listening content |
| **Import/Export** | Full JSON backup and restore |

### 2.4 AI Features (Requires Configuration)

AI features are opt-in and require an OpenAI-compatible API key. See [AI Configuration](#3-ai-configuration) to set them up.

| Feature | What It Does |
|---------|--------------|
| **AI Learning Progress Review** | Generates a detailed, personalized study progress report |
| **AI Tutor Chat** | A context-aware IELTS tutor that answers questions and provides feedback |
| **Exercise Generator** | Creates IELTS practice exercises from your vocabulary and content |
| **Proactive Messages** | Rule-based study reminders, tips, and progress nudges |
| **Vocabulary AI Enrichment** | AI-powered word definitions, synonyms, and collocations |
| **Article Analysis** | Generates comprehension questions from saved articles |
| **Video Analysis** | Extracts vocabulary, summaries, and questions from transcripts |

---

## 3. AI Configuration

### 3.1 Prerequisites

- An API key from an OpenAI-compatible provider (e.g., OpenAI, Azure OpenAI, or a local LLM with an OpenAI-compatible endpoint)
- An active internet connection when using AI features

### 3.2 Setting Up AI

1. Go to **Settings → AI Provider**
2. Enter your **API Key**
3. (Optional) Change the **Model** (default: `gpt-4o-mini`)
4. (Optional) Change the **Base URL** if using a custom endpoint
5. (Optional) Adjust **Temperature** and **Max Tokens** for response style
6. Click **Save**

Once configured, all AI features become available. You can test the connection by opening the AI Tutor Chat and sending a message.

### 3.3 Managing Your API Key

- Your API key is stored locally in your browser's `localStorage` (or `chrome.storage.local` for extension users)
- It is never sent anywhere except the configured AI endpoint
- You can update or remove it at any time from **Settings → AI Provider**

---

## 4. AI Learning Progress Review

The AI Learning Progress Review acts like a personal IELTS tutor that analyzes your study data over a period and generates a detailed report.

### 4.1 Accessing the Feature

1. Navigate to **Progress** from the main navigation
2. Click the **AI Learning Progress Review** tab
3. You will see the review panel with a date range selector and a **Generate Progress Report** button

### 4.2 Selecting a Review Period

Choose how far back you want to analyze:

| Option | When to Use |
|--------|-------------|
| **Last 7 Days** | Weekly check-ins to track short-term progress and stay on top of mistakes |
| **Last 30 Days** | Monthly deep-dive to spot trends, measure improvement, and adjust your study plan |
| **Custom Range** | Review a specific period (e.g., the past 2 weeks, or since your last mock test) |

To select a custom range, click **Custom Range**, then pick start and end dates using the date pickers. Click **Apply** to confirm.

### 4.3 Generating a Report

1. Select your desired review period
2. Click **Generate Progress Report**
3. If AI is configured, the system will analyze your data and generate a personalized report
4. If AI is not configured, a data-driven report based on your study stats will be shown instead

Generation may take a few seconds while processing your data.

### 4.4 Understanding the Report

The report contains 9 sections:

#### 4.4.1 Overall Learning Summary

A high-level overview of your activity during the period, including total study time, sessions completed, tasks finished, and active days. Read this first to get a quick sense of how much you studied.

#### 4.4.2 What You Improved

Specific skills or habits where you made progress. Each item is marked with a checkmark. If no significant improvement is detected, this section will say so — use it as motivation to push harder.

#### 4.4.3 What You Still Struggle With

Areas that need more work. Each item is marked with an exclamation icon. Pay close attention to this section — it tells you exactly where to focus your energy.

#### 4.4.4 Repeated Mistakes

Mistake patterns that occurred multiple times. Each entry shows:
- The mistake pattern (e.g., "Subject-verb agreement errors")
- The skill it relates to (Reading, Listening, Writing, Speaking)
- How many times it occurred
- An analysis explaining why it matters and how to fix it

If no repeated mistakes are detected, the section will show a clean message.

#### 4.4.5 Vocabulary Review Status

A snapshot of your vocabulary journey:
- **Total Saved** — Words you added during this period
- **Mastered** — Words you have reviewed enough to commit to long-term memory (21+ day interval, 5+ repetitions)
- **Still Learning** — Words in progress

A progress bar shows your mastery percentage, and a recommendation tells you whether to keep reviewing or start saving more words.

#### 4.4.6 Skill-by-Skill Progress

For each IELTS skill you practiced (Reading, Listening, Writing, Speaking), you will see:
- **Status** — "improving", "needs work", or "stable"
- **Trend badge** — ↑ Improving, ↓ Declining, → Stable
- **Sessions count** — How many practice sessions you completed
- **Accuracy bar** — Visual percentage bar with your accuracy/score
- **Analysis** — A brief written assessment

Use this section to identify which skills are your strengths and which need extra attention.

#### 4.4.7 Study Plan Adherence

Evaluates how consistently you followed your study plan. Shows:
- Active days count
- Consistency percentage
- Current study streak

A low consistency score (< 50%) is a signal to build a more regular study habit.

#### 4.4.8 Recommended Focus for Next Period

A prioritized list of 3–5 specific actions for your next study period. Examples:
- "Focus on Reading and Writing — your weakest skill areas"
- "Improve study consistency with daily 15–30 minute sessions"
- "Review saved vocabulary more frequently using spaced repetition"

Follow these recommendations to make the most of your next study period.

#### 4.4.9 Tutor's Feedback

A warm, personalized message from the AI tutor. This section:
- Celebrates what you did well
- Acknowledges challenges honestly but constructively
- Ends with an encouraging reminder

Think of this as a real tutor reviewing your notebook and giving you a pep talk.

### 4.5 AI vs Data-Driven Reports

| Scenario | Report Type |
|----------|-------------|
| AI configured, API responds successfully | AI-generated report (richer analysis, personalized feedback) |
| AI configured but API fails | Fallback: data-driven report with an error banner |
| AI not configured | Data-driven report (no AI call attempted) |

The data-driven report uses the same 9-section structure but relies on computed statistics and rule-based recommendations instead of AI analysis.

### 4.6 Regenerating a Report

After viewing a report, you can click **Regenerate Report** at the bottom to refresh it. This is useful after:
- Adding more study sessions
- Resolving mistakes
- Saving new vocabulary

---

## 5. AI Tutor Chat

The AI Tutor Chat is your personal IELTS companion. It understands your study context, remembers your progress, and provides tailored guidance across 11 different assistant modes.

### 5.1 Accessing the Tutor

You can open the AI Tutor Chat from anywhere in the app:

- **Floating button** (bottom-right corner) — Opens a chat widget overlay
- **Header icon** (top-right, shows unread badge) — Opens the chat widget
- **Sidebar navigation** (desktop) or **bottom navigation** (mobile) — Opens the full `/tutor` page
- **Contextual buttons** throughout the app — Opens chat pre-loaded with relevant context (e.g., a specific word, essay, or mistake)

### 5.2 Assistant Modes

Switch between modes to get the right kind of help:

| Mode | Best For |
|------|----------|
| **Friendly Chat** | Casual conversation, daily check-ins, general questions |
| **IELTS Tutor** | Exam strategies, skill advice, study planning |
| **Speaking Partner** | Simulated IELTS Speaking Parts 1, 2, and 3 |
| **Writing Coach** | Essay feedback, brainstorming, structure improvement |
| **Grammar Teacher** | Grammar explanations and practice |
| **Vocabulary Coach** | Word explanations, collocations, and usage |
| **Reading Explainer** | Passage analysis and comprehension help |
| **Listening Coach** | Transcript analysis and listening strategies |
| **Study Planner** | Schedule optimization and task prioritization |
| **Motivation Coach** | Encouragement and study habit building |
| **Socratic Tutor** | Guided learning through questions rather than answers |

### 5.3 What You Can Ask

The AI Tutor can help with a wide range of requests:

- **Answer IELTS questions** — "What's the difference between past simple and present perfect?"
- **Review your writing** — Open the chat from a writing practice result page for immediate feedback
- **Practice speaking** — Switch to Speaking Partner mode for a simulated interview
- **Generate exercises** — Say "Quiz me on my vocabulary" or "Make a reading exercise"
- **Get daily briefing** — Receive a personalized summary of what to study today
- **Learn from mistakes** — Open the chat from a mistake card for an AI explanation
- **Plan your study** — "Create a 2-week study plan for Writing Task 2"

### 5.4 Context Awareness

The AI Tutor automatically knows:
- Your target and current band scores
- Your weak skill areas
- Your study streak and consistency
- Your exam countdown (if set)
- Recent mistakes and vocabulary

This means you do not need to repeat yourself — the tutor already has the full picture.

### 5.5 Adjusting the Tutor Style

From the chat settings, you can customize:

| Setting | Options |
|---------|---------|
| **Explanation style** | Simple, Detailed, Example-based, Socratic, Step-by-step |
| **Correction strictness** | Gentle, Balanced, Strict |
| **Feedback depth** | Minimal, Standard, Thorough |
| **Response language** | English, Vietnamese, Both |

---

## 6. Exercise Generator

Generate IELTS practice exercises powered by AI or rule-based templates.

### 6.1 From Your Vocabulary

1. Open any saved word in the **Vocabulary** section
2. Click **Generate Exercises**
3. The AI creates IELTS-style writing prompts and practice questions using your saved words

### 6.2 From Study Content

When viewing saved articles, reading passages, or video transcripts:

- **Comprehension questions** — Literal, inference, and vocabulary-in-context questions
- **Opinion questions** — Discussion questions similar to Speaking Part 3 or Writing Task 2
- **Vocabulary lists** — Key IELTS vocabulary extracted from the text
- **Summaries** — Concise summaries with key points and IELTS relevance
- **Gap-fill, T/F/NG, matching** — Standard IELTS exercise formats

### 6.3 From the AI Tutor

In any chat conversation, you can ask:
- "Quiz me on these words"
- "Make a grammar exercise"
- "Practice with me"
- "Create a reading comprehension exercise"

### 6.4 Fallback Behavior

If AI is not configured or the API call fails, the system falls back to template-based exercises so you can still practice.

---

## 7. Proactive Messages

The app sends helpful notifications to keep you on track — no manual triggers needed.

### 7.1 Types of Messages

| Trigger | Example |
|---------|---------|
| **Review due** | "You have 12 vocabulary words waiting to be reviewed." |
| **Exam countdown** | "7 days until your exam! Focus on reviewing key strategies." |
| **Weak skill detected** | "You're 1.5 bands away from your target of 7.0." |
| **Study streak** | "5-day learning streak! Keep the momentum going." |
| **Low activity** | "It's been 3 days since your last session. A quick 10-minute review can help." |
| **Mistake pattern** | "You've made 8 recent mistakes. Reviewing now can prevent bad habits." |
| **Daily plan ready** | "Your daily study plan is ready." |
| **Missed tasks** | "You missed 2 study days this week. Let's get back on track." |
| **Weekly/Monthly review** | Periodic progress summaries |

### 7.2 Where Messages Appear

- **Dashboard** — "Tutor Says" card shows top messages
- **Header icon** — Unread badge on the chat icon
- **Chat widget** — Notification center with full history
- **Floating tutor bubble** — Hover preview of the latest message
- **After actions** — Completion toasts and banners

### 7.3 Customizing Notifications

Go to **Settings → Proactive Messages** to:

- Enable or disable specific message categories
- Set quiet hours (default: 22:00–08:00)
- Adjust daily message cap (default: 5)
- Choose tone: Friendly, Strict, Motivational, Simple, or Vietnamese

---

## 8. Other AI Features

### 8.1 Vocabulary AI Enrichment

When you save a word, the AI can automatically provide:
- Meaning in context
- Part of speech
- Example sentences
- Synonyms and collocations

This works from both the web app and the browser extension. Results are cached for 30 minutes to avoid redundant API calls.

### 8.2 Article & Video Analysis

When studying with the **Content Library** or saved videos:

- **Articles**: Generate comprehension questions for reading practice
- **Videos**: Extract vocabulary, generate summaries, create listening comprehension questions, and build shadowing scripts from YouTube transcripts

### 8.3 Browser Extension Features

If you use the Chrome extension, you can:

- Select text on any webpage and choose from 7 explanation modes: Simplify, Translate, IELTS Vocabulary, Grammar Analysis, Rewrite, Example Sentences, or Quiz
- Save selected text directly to your study database
- The extension shares your AI configuration with the web app

---

## 9. Tips & Best Practices

### 9.1 For All Users

- **Review weekly** — Generate 7-day progress reports to catch small issues early
- **Log everything** — The more data you record, the more accurate your analytics and AI insights become
- **Use the daily study plan** — It helps distribute practice across all four skills
- **Track mistakes immediately** — Record mistakes right after practice while they are fresh
- **Back up regularly** — Use Import/Export to save your data as a JSON file

### 9.2 For AI Users

- **Configure AI first** — Set up your API key in Settings before trying AI features
- **Start with a progress review** — Generate a report to see where you stand before diving into specific areas
- **Use contextual AI** — Click the AI Tutor button from within a word, essay, or mistake card for the most relevant help
- **Try different tutor modes** — Each mode excels at different tasks; switch freely
- **Review before mock tests** — Get a clear picture of weak areas before taking a practice test
- **Compare reports over time** — Generate monthly reports and compare them to see long-term trends

### 9.3 Privacy Best Practices

- Your data stays on your device — no cloud backups unless you export manually
- AI API keys are stored locally and never shared
- Always review what data is sent to the AI — only explicitly triggered content is transmitted
- Use the Import/Export feature to create manual backups

---

## 10. Troubleshooting

### 10.1 AI Features Not Working

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| "AI not configured" message | No API key set | Go to **Settings → AI Provider** and enter your key |
| AI returns errors | Invalid or expired API key | Verify your key is correct and has sufficient credits |
| AI is slow | Network issues or provider latency | Check your internet connection or try a different model |
| AI responses are poor quality | Wrong model or settings | Try `gpt-4o` or `gpt-4o-mini`; adjust temperature in Settings |

### 10.2 Data Issues

| Symptom | Solution |
|---------|----------|
| Lost data after clearing browser storage | Restore from a JSON backup using Import/Export |
| Data not syncing between devices | The app is local-first — use Export on one device and Import on the other |
| Study plan not generating | Ensure you have set a target band score and exam date in your profile |

### 10.3 General Issues

| Symptom | Solution |
|---------|----------|
| App not loading | Clear your browser cache and reload |
| Changes not saving | Check that IndexedDB is enabled in your browser settings |
| PWA not installing | Use a supported browser (Chrome, Edge, or Safari) |
| Feature not working offline | Some features (AI, content updates) require an internet connection |

### 10.4 Getting Help

If you encounter an issue not covered here:

- Open a [GitHub Issue](https://github.com/<your-username>/ielts-journey/issues)
- Check the [Troubleshooting Guide](troubleshooting.md)
- Review docs in the `docs/` directory for detailed subsystem documentation
