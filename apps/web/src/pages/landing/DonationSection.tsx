import { DONATION } from './config'

const hasAnyDonation =
  DONATION.buyMeACoffee.length > 0 ||
  DONATION.githubSponsors.length > 0 ||
  DONATION.paypal.length > 0 ||
  DONATION.bankInfo.length > 0

export default function DonationSection() {
  return (
    <section
      className="bg-[var(--color-background)] text-[var(--color-text)] px-4 py-16 sm:py-20 lg:py-24"
      id="donation"
    >
      <div className="mx-auto text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Support the project
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-[var(--color-text-secondary)]">
          IELTS Journey is built as a free project for learners. If this tool
          helps you, you can support development with a small donation. Your
          support helps maintain the project, improve features, and keep the app
          free.
        </p>

        {hasAnyDonation ? (
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {DONATION.buyMeACoffee && (
              <a
                href={DONATION.buyMeACoffee}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#FF813F] px-6 text-sm font-semibold text-white shadow-sm transition-all hover:scale-105"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 22h10l1-11H6l1 11zm8-18V2H9v2H4v3h16V4h-5z" /></svg>
                Buy me a coffee
              </a>
            )}
            {DONATION.githubSponsors && (
              <a
                href={DONATION.githubSponsors}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-[var(--color-text)] px-6 text-sm font-semibold text-white shadow-sm transition-all hover:scale-105"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                GitHub Sponsors
              </a>
            )}
            {DONATION.paypal && (
              <a
                href={DONATION.paypal}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#0070BA] px-6 text-sm font-semibold text-white shadow-sm transition-all hover:scale-105"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" /></svg>
                PayPal
              </a>
            )}
            {DONATION.bankInfo && (
              <div
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-6 py-3 text-sm text-[var(--color-text-secondary)]"
              >
                {DONATION.bankInfo}
              </div>
            )}
          </div>
        ) : (
          <p className="mt-6 text-sm text-[var(--color-muted)]">
            Donation links coming soon. Thank you for your interest in
            supporting IELTS Journey.
          </p>
        )}

        <p className="mt-8 text-sm text-[var(--color-muted)]">
          No pressure. The app is and will always be free.
        </p>
      </div>
    </section>
  )
}
