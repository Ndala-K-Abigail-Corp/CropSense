import { HeroSection } from '@/components/HeroSection';

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeroSection />

      {/* Additional sections can be added here */}
      <section className="py-16 bg-muted">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12 text-text-primary">
            Trusted by Farmers Worldwide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
    <div className="card text-center bg-surface">
      <div className="text-4xl font-bold text-primary mb-2">{number}</div>
      <div className="text-text-secondary">{label}</div>
    </div>
  );
}

