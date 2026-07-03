export default function DashboardPreviewSection() {
  return (
    <section
      className="bg-[var(--color-background)] px-4 py-16 sm:py-20 lg:py-24"
      id="dashboard-preview"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
            See what you need to study today
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[var(--color-text-secondary)]">
            When you open IELTS Journey, your dashboard shows everything you need
            to know — your tasks, progress, weak skills, and AI guidance. No
            searching, no guessing.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-5xl" role="img" aria-label="IELTS Journey dashboard mockup showing tasks, progress, roadmap, and AI tutor messages">
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-6 py-4">
              <div className="h-3 w-3 rounded-full bg-[var(--color-danger)]" />
              <div className="h-3 w-3 rounded-full bg-[var(--color-warning)]" />
              <div className="h-3 w-3 rounded-full bg-[var(--color-success)]" />
              <span className="ml-3 text-sm font-medium text-[var(--color-text-secondary)]">
                IELTS Journey — Dashboard
              </span>
            </div>

            <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-12">
              {/* Sidebar — Roadmap and Goal */}
              <div className="space-y-4 lg:col-span-3">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    IELTS Goal
                  </span>
                  <p className="mt-2 text-base font-semibold text-[var(--color-text)]">
                    Target Band 7.0
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                    <span>Exam in 8 weeks</span>
                    <span className="inline-block h-1 w-1 rounded-full bg-[var(--color-text-secondary)]" />
                    <span>Current: 5.5</span>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Study Roadmap
                  </span>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-success)] text-[10px] font-bold text-white">
                        ✓
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text)]">
                          Foundation
                        </p>
                        <p className="text-xs text-[var(--color-success)]">
                          Completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white">
                        2
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text)]">
                          Skill Building
                        </p>
                        <p className="text-xs text-[var(--color-primary)]">
                          In progress
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[10px] font-medium text-[var(--color-text-secondary)]">
                        3
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text)]">
                          Practice Tests
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          Upcoming
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[10px] font-medium text-[var(--color-text-secondary)]">
                        4
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text)]">
                          Exam Prep
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          Upcoming
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main — Today's Tasks and Recent Practice */}
              <div className="space-y-4 lg:col-span-6">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-primary-light)] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                      Today&apos;s Tasks
                    </span>
                    <span className="rounded-full bg-[var(--color-primary)] px-2.5 py-0.5 text-xs font-medium text-white">
                      4 remaining
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-3 rounded-lg bg-white/70 px-3 py-2">
                      <div className="h-4 w-4 rounded border border-[var(--color-primary)]" />
                      <span className="text-sm text-[var(--color-text)]">
                        Reading Practice — Passage 1
                      </span>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg bg-white/70 px-3 py-2">
                      <div className="h-4 w-4 rounded border border-[var(--color-primary)]" />
                      <span className="text-sm text-[var(--color-text)]">
                        Vocabulary Review — 15 words
                      </span>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg bg-white/70 px-3 py-2">
                      <div className="h-4 w-4 rounded border border-[var(--color-primary)]" />
                      <span className="text-sm text-[var(--color-text)]">
                        Writing Task 2 — Essay Outline
                      </span>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg bg-white/70 px-3 py-2">
                      <div className="h-4 w-4 rounded border border-[var(--color-primary)]" />
                      <span className="text-sm text-[var(--color-text)]">
                        Listening — Section 3 Practice
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Recent Practice
                  </span>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface)] px-3 py-2">
                      <div>
                        <span className="text-sm font-medium text-[var(--color-text)]">
                          Reading — Passage 3
                        </span>
                        <span className="ml-2 inline-block rounded-full bg-[var(--color-success)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-success)]">
                          7/10
                        </span>
                      </div>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        2h ago
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface)] px-3 py-2">
                      <div>
                        <span className="text-sm font-medium text-[var(--color-text)]">
                          Grammar — Tenses Review
                        </span>
                        <span className="ml-2 inline-block rounded-full bg-[var(--color-success)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-success)]">
                          8/10
                        </span>
                      </div>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        Yesterday
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface)] px-3 py-2">
                      <div>
                        <span className="text-sm font-medium text-[var(--color-text)]">
                          Vocabulary — Academic Words
                        </span>
                        <span className="ml-2 inline-block rounded-full bg-[var(--color-warning)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-warning)]">
                          5/10
                        </span>
                      </div>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        Yesterday
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right sidebar — Progress, Streak, Weak Skills, Saved Words, AI Tutor */}
              <div className="space-y-4 lg:col-span-3">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Progress
                  </span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[var(--color-text)]">68</span>
                    <span className="text-sm text-[var(--color-text-secondary)]">%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[var(--color-border)]">
                    <div className="h-full w-[68%] rounded-full bg-[var(--color-primary)]" />
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                    <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-success)]" />
                    Study streak: 5 days
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Weak Skills
                  </span>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-danger)]">
                      Writing Task 2
                    </span>
                    <span className="rounded-full border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-danger)]">
                      Listening
                    </span>
                    <span className="rounded-full border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-warning)]">
                      Vocabulary
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                      Saved Words
                    </span>
                    <span className="rounded-full bg-[var(--color-primary-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-primary)]">
                      24
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-text)]">Phenomenon</span>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        n.
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-text)]">Significant</span>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        adj.
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-text)]">Implement</span>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        v.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary-light)] p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                    AI Tutor
                  </span>
                  <div className="mt-2 space-y-2">
                    <div className="rounded-lg bg-white/70 px-3 py-2">
                      <p className="text-xs leading-relaxed text-[var(--color-text)]">
                        Your writing practice today focuses on Task 2 essays.
                        Review the structure from last week&apos;s lesson first.
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/70 px-3 py-2">
                      <p className="text-xs leading-relaxed text-[var(--color-text)]">
                        You have 24 saved words. Would you like to review them
                        with a quick quiz?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
