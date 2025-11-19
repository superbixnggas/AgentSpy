import { Link, useLocation } from 'react-router-dom';
import { Activity, TrendingUp, Shield, Zap } from 'lucide-react';
import { WalletButton } from '../WalletButton';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/whale-activity', label: 'Whale Activity', icon: Activity },
    { path: '/market-flow', label: 'Market Flow', icon: TrendingUp },
    { path: '/staking-monitor', label: 'Staking Monitor', icon: Shield },
    { path: '/real-time-feed', label: 'Real Time Feed', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <header className="border-b border-purple-800/30 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AgentSpy
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-400 font-medium">Live</span>
              </div>
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-purple-800/30 bg-slate-900/30 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-3 transition-all ${
                    isActive
                      ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-800/30 bg-slate-900/50 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-400">
              Solana Blockchain Monitor - Powered by Supabase
            </p>
            <p className="text-gray-500">
              Data updates in real-time
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
