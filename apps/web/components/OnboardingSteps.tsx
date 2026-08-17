/**
 * Three-step progress rail for the post-signup flow, mirroring the mobile
 * onboarding order: health profile → goals → location.
 */
const STEPS = ['Health profile', 'Goals', 'Location'];

export function OnboardingSteps({ current }: { current: number }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      {STEPS.map((label, i) => (
        <div key={label} className="flex flex-1 flex-col gap-1.5">
          <span
            className={`h-1 rounded-sm transition ${i <= current ? 'bg-accent' : 'bg-line'}`}
            aria-hidden
          />
          <span
            className={`font-mono text-[10px] uppercase tracking-eyebrow ${
              i <= current ? 'text-accent' : 'text-inkMuted'
            }`}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
