import { getInitials } from '../utils';

interface Props {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

/**
 * Deterministic neutral palettes ensuring uniform high contrast for user initials.
 */
const bgColors = [
  'bg-[#212121] text-white',
  'bg-[#374151] text-white',
  'bg-[#1e293b] text-white',
  'bg-[#475569] text-white',
  'bg-[#18181b] text-white',
  'bg-[#27272a] text-white',
];

/**
 * Computes a stable hash from a string to consistently assign the same palette to a user.
 */
function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
}

export default function Avatar({ name, size = 'md' }: Props) {
  return (
    <div
      className={`${sizes[size]} ${getColorForName(name)} rounded-full flex items-center justify-center font-semibold shrink-0 select-none border border-black/5 shadow-xs`}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
