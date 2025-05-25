import Link from 'next/link';
import Image from 'next/image';

export default function AuthNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative w-8 h-8">
              <Image
                src="/logo.png"
                alt="FocusQuest Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-mint-400 to-lavender-400">
              FocusQuest
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
} 