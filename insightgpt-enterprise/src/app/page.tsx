'use client';
// InsightGPT Enterprise - Home Page with Redirect
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);
  
  return (
    <div className="min-h-screen bg-[#F3F2F1] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#0078D4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading Dashboard...</p>
      </div>
    </div>
  );
}
