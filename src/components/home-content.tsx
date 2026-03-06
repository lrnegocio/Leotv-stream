'use client';

import { useSearchParams } from 'next/navigation';

export default function HomeContent() {
  const searchParams = useSearchParams();
  
  return (
    <div>
      <p>Home Page</p>
    </div>
  );
}
