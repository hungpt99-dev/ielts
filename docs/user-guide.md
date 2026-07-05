# IELTS Learning Journey — User Guide

> How to use IELTS Journey's features to maximize your study efficiency.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [AI Learning Progress Review](#2-ai-learning-progress-review)

---

## 1. Getting Started

Open IELTS Journey in your browser (Chrome, Edge, Firefox, or Safari). All features work after installation — no sign-up required.

- **Core features** (vocabulary, practice logging, analytics): Work offline immediately
- **AI features** (AI Learning Progress Review, AI Tutor): Require an OpenAI-compatible API key configured in Settings

To configure AI, go to **Settings → AI Provider** and enter your API key, model, and endpoint. The default model is `gpt-4o-mini`.

---

## 2. AI Learning Progress Review

The AI Learning Progress Review acts like a personal IELTS tutor that analyzes your study data over a period and generates a detailed report.

### Accessing the Feature

1. Navigate to **Progress** from the main navigation
2. Click **AI Learning Progress Review** tab
3. You will see the review panel with a date range selector and a "Generate Progress Report" button

### Selecting a Review Period

Choose how far back you want to analyze:

| Option | When to Use |
|--------|-------------|
| **Last 7 Days** | Weekly check-ins to track short-term progress and stay on top of mistakes |
| **Last 30 Days** | Monthly deep-dive to spot trends, measure improvement, and adjust your study plan |
| **Custom Range** | Review a specific period (e.g., the past 2 weeks, or since your last mock test) |

To select a custom range, click **Custom Range**, then pick start and end dates using the date pickers. Click **Apply** to confirm.

### Generating a Report

1. Select your desired review period
2. Click **Generate Progress Report**
3. If AI is configured, the system will analyze your data and generate a personalized report
4. If AI is not configured, a data-driven report based on your study stats will be shown instead

Generation may take a few seconds while the AI processes your data.

### Understanding the Report

The report contains 9 sections:

#### 1. Overall Learning Summary

A high-level overview of your activity during the period, including total study time, sessions completed, tasks finished, and active days. Read this first to get a quick sense of how much you studied.

#### 2. What You Improved

Specific skills or habits where you made progress. Each item is marked with a checkmark. If no significant improvement is detected, this section will say so — use it as motivation to push harder.

#### 3. What You Still Struggle With

Areas that need more work. Each item is marked with an exclamation icon. Pay close attention to this section — it tells you exactly where to focus your energy.

#### 4. Repeated Mistakes

Mistake patterns that occurred multiple times. Each entry shows:
- The mistake pattern (e.g., "Subject-verb agreement errors")
- The skill it relates to (Reading, Listening, Writing, Speaking)
- How many times it occurred
- An analysis explaining why it matters and how to fix it

If no repeated mistakes are detected, the section will show a clean message.

#### 5. Vocabulary Review Status

A snapshot of your vocabulary journey:
- **Total Saved** — Words you added during this period
- **Mastered** — Words you have reviewed enough to commit to long-term memory (21+ day interval, 5+ repetitions)
- **Still Learning** — Words in progress

A progress bar shows your mastery percentage, and a recommendation tells you whether to keep reviewing or start saving more words.

#### 6. Skill-by-Skill Progress

For each IELTS skill you practiced (Reading, Listening, Writing, Speaking), you will see:
- **Status** — "improving", "needs work", or "stable"
- **Trend badge** — ↑ Improving, ↓ Declining, → Stable
- **Sessions count** — How many practice sessions you completed
- **Accuracy bar** — Visual percentage bar with your accuracy/score
- **Analysis** — A brief written assessment

Use this section to identify which skills are your strengths and which need extra attention.

#### 7. Study Plan Adherence

Evaluates how consistently you followed your study plan. Shows:
- Active days count
- Consistency percentage
- Current study streak

A low consistency score (< 50%) is a signal to build a more regular study habit.

#### 8. Recommended Focus for Next Period

A prioritized list of 3-5 specific actions for your next study period. Examples:
- "Focus on Reading and Writing — your weakest skill areas"
- "Improve study consistency with daily 15-30 minute sessions"
- "Review saved vocabulary more frequently using spaced repetition"

Follow these recommendations to make the most of your next study period.

#### 9. Tutor's Feedback

A warm, personalized message from the AI tutor. This section:
- Celebrates what you did well
- Acknowledges challenges honestly but constructively
- Ends with an encouraging reminder

Think of this as a real tutor reviewing your notebook and giving you a pep talk.

### AI vs Data-Driven Reports

| Scenario | Report Type |
|----------|-------------|
| AI configured, API responds successfully | AI-generated report (richer analysis, personalized feedback) |
| AI configured but API fails | Fallback: data-driven report with an error banner |
| AI not configured | Data-driven report (no AI call attempted) |

The data-driven report uses the same 9-section structure but relies on computed statistics and rule-based recommendations instead of AI analysis.

### Regenerating a Report

After viewing a report, you can click **Regenerate Report** at the bottom to refresh it. This is useful after:
- Adding more study sessions
- Resolving mistakes
- Saving new vocabulary

### Tips for Effective Reviews

- **Review weekly** — 7-day reviews help catch small issues before they become habits
- **Review before mock tests** — Get a clear picture of your weak areas before a practice test
- **Act on recommendations** — The report is most useful when you follow the focus areas it suggests
- **Compare reports over time** — Generate monthly reports and compare them to see long-term trends
- **Configure AI for best results** — An AI-generated report provides deeper analysis and more natural tutor feedback than the data-driven fallback
