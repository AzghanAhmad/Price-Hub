import { useState } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

// fallback chain in case a Pexels URL fails
const FALLBACKS = [
  'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/274973/pexels-photo-274973.jpeg?auto=compress&cs=tinysrgb&w=600',
];

export default function SafeImage({ src, alt, className }: Props) {
  const [idx, setIdx] = useState(0);
  const current = idx === 0 ? src : FALLBACKS[idx - 1];
  return (
    <img
      src={current}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => {
        if (idx < FALLBACKS.length) setIdx(idx + 1);
      }}
    />
  );
}
