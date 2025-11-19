import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Wallet, ChevronDown, Copy, LogOut, ExternalLink, Check } from 'lucide-react';

export const WalletButton: FC = () => {
  const { publicKey, disconnect, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch balance when connected
  useState(() => {
    if (publicKey && connected) {
      connection.getBalance(publicKey).then((bal) => {
        setBalance(bal / LAMPORTS_PER_SOL);
      });
    } else {
      setBalance(null);
    }
  });

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openExplorer = () => {
    if (publicKey) {
      window.open(`https://solscan.io/account/${publicKey.toString()}`, '_blank');
    }
  };

  if (!connected || !publicKey) {
    return (
      <div className="wallet-button-wrapper">
        <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-pink-600 !rounded-lg !px-4 !py-2 !text-white !font-medium !text-sm hover:!from-purple-700 hover:!to-pink-700 !transition-all" />
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-3 bg-purple-900/40 border border-purple-500/50 rounded-lg px-4 py-2 hover:bg-purple-900/60 transition-all"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <Wallet className="w-4 h-4 text-white" />
        </div>
        <div className="text-left">
          <p className="text-xs text-gray-400">Wallet Connected</p>
          <p className="text-sm font-mono text-white">{formatAddress(publicKey.toString())}</p>
        </div>
        {balance !== null && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Balance</p>
            <p className="text-sm font-semibold text-purple-400">{balance.toFixed(4)} SOL</p>
          </div>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-purple-500/50 rounded-lg shadow-xl z-50">
            <div className="p-4 border-b border-purple-800/30">
              <p className="text-xs text-gray-400 mb-1">Wallet Address</p>
              <p className="text-sm font-mono text-white break-all">{publicKey.toString()}</p>
              {balance !== null && (
                <div className="mt-3 pt-3 border-t border-purple-800/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Balance</span>
                    <span className="text-lg font-bold text-purple-400">{balance.toFixed(4)} SOL</span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-2">
              <button
                onClick={copyAddress}
                className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-purple-500/10 rounded-lg transition-colors text-left"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm text-white">{copied ? 'Copied!' : 'Copy Address'}</span>
              </button>
              <button
                onClick={openExplorer}
                className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-purple-500/10 rounded-lg transition-colors text-left"
              >
                <ExternalLink className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white">View on Solscan</span>
              </button>
              <div className="border-t border-purple-800/30 my-2" />
              <button
                onClick={() => {
                  disconnect();
                  setShowDropdown(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-red-500/10 rounded-lg transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">Disconnect</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
