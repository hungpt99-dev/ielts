# FlowTask Context Pack

## Original User Prompt

Add a production-ready landing page for the existing IELTS Journey project.

Goal:
Create a beautiful, modern, trustworthy landing page that explains the product, attracts IELTS learners, and also includes creator information for recruitment and donation support.

Important:
The project already exists. Do not rebuild the whole app.
Add the landing page into the current codebase using the existing tech stack, design system, routing, components, and styling.
Keep the implementation clean, responsive, accessible, and production-ready.

Landing page purpose:

1. Explain what IELTS Journey is.
2. Show that the product is free.
3. Highlight the Chrome extension and local-first learning experience.
4. Encourage users to start using the app.
5. Show creator information for recruitment opportunities.
6. Allow users to support the project by donation.

Main positioning:
IELTS Journey is a free, local-first IELTS learning app and browser extension that turns real internet content into IELTS vocabulary, exercises, speaking questions, writing ideas, and daily study tasks.

Landing page sections:

1. Hero section
   Include:

* Product name: IELTS Journey
* Headline: Free IELTS learning from the real internet
* Subheadline: Read articles, news, and web content. IELTS Journey helps you highlight vocabulary, save words, generate IELTS exercises, and build a personal study journey.
* Primary CTA: Start Learning Free
* Secondary CTA: Install Chrome Extension
* Small trust text: No account required. No backend. Your data stays in your browser.

2. Problem section
   Explain the learner problems:

* IELTS learners forget vocabulary easily.
* Studying random word lists is boring.
* Reading real articles is useful but difficult.
* Most IELTS tools are paid or limited.
* Learners need a personal system, not just mock tests.

3. Solution section
   Explain:
   IELTS Journey turns anything you read online into IELTS learning material.
   The extension helps while reading.
   The web app tracks your study journey.
   AI features can use the user’s own API key.

4. Feature highlights
   Show cards for:

* IELTS word highlighter
* Click word to see meaning and examples
* Save vocabulary from any webpage
* Save articles to study later
* Generate IELTS Reading questions
* Generate Speaking Part 1, Part 2, Part 3 questions
* Extract Writing Task 2 ideas
* Daily study plan
* Progress dashboard
* Local-first data storage
* Import and export data
* AI tutor with user’s own API key

5. Chrome extension section
   Explain:
   The Chrome extension works while users read news, blogs, articles, and online content.
   It highlights useful IELTS words, explains difficult sentences, saves vocabulary, and turns selected text into IELTS practice.

Include CTA:
Install Extension

6. Free and privacy-first section
   Make this section very clear:

* The app is free.
* No login required.
* No backend required.
* User data is stored locally in the browser.
* AI features are optional.
* If AI is used, the user provides their own API key.
* Show what content is sent to AI before sending.

7. How it works section
   Use 3 or 4 steps:
   Step 1: Read any article online.
   Step 2: Highlight and save useful IELTS vocabulary.
   Step 3: Generate IELTS exercises, speaking questions, and writing ideas.
   Step 4: Review progress in the IELTS Journey dashboard.

8. Creator / recruitment section
   Add a personal creator section.

Use this information:
Name: Phạm Thanh Hưng
English name: Harry
Role: Software Engineer Full-stack
Background: Java/Spring Boot backend developer with experience building production systems, browser extensions, local-first applications, and AI-powered tools.
Current focus: Building useful AI tools, browser extensions, and learning products.
Open to: Software Engineer, Backend Engineer, Full-stack Engineer, Java/Spring Boot Engineer, AI tool development, browser extension development, remote work, and freelance projects.

Include CTA buttons:

* View GitHub
* Contact Me
* Download CV
* Hire Me

Use placeholders for links if not available:
GitHub: https://github.com/hungpt99-dev
Email: [ADD_EMAIL_HERE]
CV: [ADD_CV_LINK_HERE]
LinkedIn: [ADD_LINKEDIN_HERE]

9. Donation / support section
   Add a friendly donation section.

Message:
IELTS Journey is built as a free project for learners. If this tool helps you, you can support development with a small donation. Your support helps maintain the project, improve features, and keep the app free.

Include donation methods as configurable placeholders:

* Buy Me a Coffee: [ADD_BUY_ME_A_COFFEE_LINK]
* GitHub Sponsors: [ADD_GITHUB_SPONSORS_LINK]
* PayPal: [ADD_PAYPAL_LINK]
* Bank transfer / QR code: [ADD_BANK_QR_OR_INFO]

Do not make donation feel forced.
Use soft wording:
“Support the project”
“Buy me a coffee”
“Help keep IELTS Journey free”

10. FAQ section
    Add FAQ items:

* Is IELTS Journey free?
* Do I need an account?
* Where is my data stored?
* Do I need an AI API key?
* Does it work offline?
* Is the Chrome extension required?
* Can I export my data?
* Who built IELTS Journey?

11. Final CTA section
    Include:
    Start your IELTS learning journey today.
    Buttons:
    Start Learning Free
    Install Chrome Extension
    Support the Project

Design requirements:

* Modern SaaS landing page style
* Clean, simple, trustworthy
* IELTS/education feeling
* Fully responsive for mobile, tablet, and desktop
* Good spacing and typography
* Clear CTA buttons
* Use existing UI components if available
* Add dark mode support if the project already supports it
* Accessible colors and semantic HTML
* SEO-friendly content
* Fast loading
* No unnecessary animation
* Smooth but lightweight UI

Technical requirements:

* Use existing routing system.
* Add landing page route, preferably  or .
* Keep app dashboard route separate if needed.
* Create reusable landing page components.
* Avoid putting all code in one huge file.
* Add constants/config for creator links and donation links.
* Add graceful fallback when links are not configured.
* Add metadata/title/description if the framework supports it.
* Make all CTA links work.
* Do not leave broken buttons.
* Do not leave placeholder text visible unless clearly marked in config.
* Do not use fake testimonials unless explicitly marked as examples.
* Do not add tracking or analytics unless already part of the project.

Suggested component structure:
LandingPage
HeroSection
ProblemSection
SolutionSection
FeatureGrid
ExtensionSection
PrivacySection
HowItWorksSection
CreatorSection
DonationSection
FAQSection
FinalCTASection

Quality requirements:

* Strict TypeScript
* Clean component names
* Responsive layout
* Accessible buttons and links
* No console errors
* No unused imports
* No dead code
* No broken routes
* No layout shift issues
* Build must pass
* Lint must pass
* Tests should be added or updated if the project has tests

Final deliverables:

1. Completed landing page.
2. Creator/recruitment section.
3. Donation/support section.
4. Working CTA buttons.
5. Responsive design.
6. SEO title and description.
7. Summary of files changed.
8. Run/build/test commands.


## Current Task

### Implement DonationSection component with friendly support message and methods

Create src/components/landing/DonationSection.tsx with message about free project and optional support. Include donation methods with placeholders: Buy Me a Coffee, GitHub Sponsors, PayPal, Bank transfer/QR code. Use soft wording and existing UI components. Use config constants for links with graceful fallback. Ensure responsiveness and accessibility.

## Project Rules

## Source: /Users/phamthanhhung/Desktop/MyProject/IELTS/.flowtask/rules/mode.md

# Development Mode Rules

This project is in **development** mode.

## Behavior
- Inspect the project before editing.
- Make focused, small code changes.
- Follow existing code style and project conventions.
- Do not make unrelated changes.
- Validate with lint/typecheck/test when configured.
- Do not claim success without evidence.
- Risky actions (install dependency, delete files, git push) require approval.

## Validation
- Code validation is enabled by default.
- Run configured quality commands when available.
- Validation runs serially and safely by default.
- Avoid spawning many test workers at once.
- Use narrow, focused test commands when possible.
- Do not run expensive full test suites repeatedly.
- Git diff may be required for changes.


## Source: /Users/phamthanhhung/Desktop/MyProject/IELTS/.flowtask/rules/project.md

# Project Rules

FlowTask manages one project at a time.

## Source: /Users/phamthanhhung/Desktop/MyProject/IELTS/.flowtask/rules/workflow.md

# Workflow Rules

Tasks execute sequentially by default.


## Previous Completed Tasks

- Create landing page route and main LandingPage component (done)
- Implement HeroSection component with product introduction and CTAs (done)
- Implement ProblemSection component describing learner problems (done)
- Implement SolutionSection component explaining product solution (done)
- Implement FeatureGrid component showing feature highlight cards (done)
- Implement ExtensionSection component describing Chrome extension (done)
- Implement PrivacySection component clarifying free and privacy-first nature (done)
- Implement HowItWorksSection component with 4-step usage process (done)
- Implement CreatorSection component with personal and recruitment info (done)

## Acceptance Criteria

- DonationSection renders message and donation methods correctly
- Links use configured URLs or fallback gracefully
- Section is responsive and accessible

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Create** `src/components/landing/DonationSection.tsx`
  - Donation and support section
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
