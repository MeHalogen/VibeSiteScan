'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewScanPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new pipeline-based scan page
    router.replace('/dashboard/new-scan-pipeline');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-emerald-400 text-lg">Redirecting to launch check...</div>
    </div>
  );
}
