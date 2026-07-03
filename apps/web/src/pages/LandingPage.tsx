import HeroSection from '../components/HeroSection'
import ProblemSection from './landing/ProblemSection'
import SolutionSection from './landing/SolutionSection'
import FeatureSection from '../components/FeatureSection'
import HowItWorksSection from './landing/HowItWorksSection'
import AITutorSection from '../components/AITutorSection'
import DashboardPreviewSection from '../components/DashboardPreviewSection'
import ProductValueSection from './landing/ProductValueSection'
import RecruitmentSection from '../components/RecruitmentSection'
import DonationSection from '../components/DonationSection'
import FAQSection from './landing/FAQSection'
import FinalCTASection from '../components/FinalCTASection'
import Footer from '../components/Footer'
import SEOHead from '../components/SEOHead'

export default function LandingPage() {
  return (
    <>
      <SEOHead
        title="IELTS Journey - Learn IELTS with a Clear Daily Roadmap"
        description="IELTS Journey gives IELTS learners a clear daily study roadmap with ready-to-learn content. Stop guessing what to study — follow a personalized plan, complete daily tasks, and prepare for IELTS with confidence."
        ogTitle="IELTS Journey - Your Personal IELTS Learning Roadmap"
        ogDescription="A clear daily study roadmap for IELTS self-study. Set your goal, follow daily tasks, and learn with ready-made content. No more searching — just focused preparation."
        keywords="IELTS study plan, IELTS roadmap, IELTS daily learning, IELTS self-study, IELTS learning app, IELTS Journey, prepare IELTS, IELTS study guide, daily IELTS tasks, IELTS preparation tool"
        canonical="https://ielts-journey.app"
      />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>

      <main id="main-content" aria-label="IELTS Journey landing page">
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <FeatureSection />
        <HowItWorksSection />
        <AITutorSection />
        <DashboardPreviewSection />
        <ProductValueSection />
        <RecruitmentSection />
        <DonationSection />
        <FAQSection />
        <FinalCTASection />
        <Footer />
      </main>
    </>
  )
}
