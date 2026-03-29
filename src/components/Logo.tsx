const TrackwareLogo = ({ size = 8 }: { size?: number }) => (
  <div
    className={`w-${size} h-${size} rounded-lg bg-primary flex items-center justify-center glow-lime-sm flex-shrink-0`}
    style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
  >
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: `${size * 2.25}px`, height: `${size * 2.25}px` }}
    >
      <rect x="2" y="4" width="8" height="2.5" rx="1.25" fill="#0a0a0a" />
      <rect x="2" y="8.75" width="12" height="2.5" rx="1.25" fill="#0a0a0a" />
      <rect x="2" y="13.5" width="6" height="2.5" rx="1.25" fill="#0a0a0a" />
      <circle cx="16" cy="5.25" r="1.5" fill="#0a0a0a" opacity="0.45" />
      <circle cx="16" cy="10" r="1.5" fill="#0a0a0a" opacity="0.45" />
      <circle cx="16" cy="14.75" r="1.5" fill="#0a0a0a" opacity="0.45" />
    </svg>
  </div>
);

export default TrackwareLogo;
