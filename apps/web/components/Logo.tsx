/**
 * VITAL brand mark — the same baked PNG the mobile app ships
 * (`apps/mobile/assets/vital-logo.png`), so the wordmark is pixel-identical
 * across clients regardless of installed fonts.
 */
const RATIO = 324 / 272; // intrinsic height / width of the trimmed logo

export function VitalLogo({ size = 120, className = '' }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/vital-logo.png"
      alt="VITAL"
      width={size}
      height={Math.round(size * RATIO)}
      className={className}
      style={{ width: size, height: 'auto' }}
    />
  );
}
