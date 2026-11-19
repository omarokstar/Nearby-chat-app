import { getInitials, getAvatarColor } from '../utils';

interface Props {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

export default function Avatar({ name, size = 'md' }: Props) {
  return (
    <div
      className={`${sizes[size]} ${getAvatarColor(name)} rounded-full flex items-center justify-center font-bold text-white shrink-0 select-none`}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
