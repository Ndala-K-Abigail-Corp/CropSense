import { HeroSection } from '@/components/HeroSection';

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeroSection />

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-custom">
          <h2 
            className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16"
            style={{ color: 'var(--cs-text)' }}
          >
            Trusted by Farmers Worldwide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StatCard number="10,000+" label="Active Users" />
            <StatCard number="50,000+" label="Questions Answered" />
            <StatCard number="100+" label="Agricultural Resources" />
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center p-8 rounded-xl bg-gradient-to-br from-neutral-50 to-white border border-neutral-200 hover:shadow-lg transition-shadow">
      <div 
        className="text-4xl md:text-5xl font-bold mb-2"
        style={{ color: 'var(--cs-primary)' }}
      >
        {number}
      </div>
      <div className="text-neutral-600 font-medium">{label}</div>
    </div>
  );
}

