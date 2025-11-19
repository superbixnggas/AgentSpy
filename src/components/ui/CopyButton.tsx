import { FC, useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  className?: string;
  showText?: boolean;
}

export const CopyButton: FC<CopyButtonProps> = ({ text, className = '', showText = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center space-x-2 px-2 py-1 hover:bg-purple-500/10 rounded transition-colors ${className}`}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-400" />
          {showText && <span className="text-xs text-green-400">Copied!</span>}
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 text-gray-400" />
          {showText && <span className="text-xs text-gray-400">Copy</span>}
        </>
      )}
    </button>
  );
};
