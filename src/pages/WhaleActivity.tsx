import { useState, useEffect } from 'react';
import { supabase, EDGE_FUNCTIONS } from '../lib/supabase';
import { Activity, AlertTriangle, TrendingUp, Wallet, ExternalLink, Filter, ArrowUpDown } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { CopyButton } from '../components/ui/CopyButton';
import { SearchBar } from '../components/ui/SearchBar';
import { ExportButton } from '../components/ui/ExportButton';

interface WhaleEvent {
  id: number;
  signature: string;
  wallet_address: string;
  transaction_type: string;
  amount: number;
  token_symbol: string;
  usd_value: number;
  timestamp: number;
  is_suspicious: boolean;
  created_at: string;
}

type SortField = 'timestamp' | 'amount' | 'usd_value';
type SortOrder = 'asc' | 'desc';

export default function WhaleActivity() {
  const [whaleEvents, setWhaleEvents] = useState<WhaleEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<WhaleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ count: 0, threshold: 100, totalValue: 0 });
  const [selectedEvent, setSelectedEvent] = useState<WhaleEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchWhaleData();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('whale_events')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'whale_events' },
        () => {
          fetchWhaleData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterAndSortEvents();
  }, [whaleEvents, searchQuery, filterType, sortField, sortOrder]);

  const fetchWhaleData = async () => {
    try {
      const response = await supabase.functions.invoke('fetch-whale-transactions', {
        body: {}
      });

      if (response.data?.data) {
        const { whale_events, count, threshold } = response.data.data;
        setWhaleEvents(whale_events);
        const totalValue = whale_events.reduce((sum: number, event: WhaleEvent) => sum + event.usd_value, 0);
        setStats({ count, threshold, totalValue });
      }
    } catch (error) {
      console.error('Error fetching whale data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortEvents = () => {
    let filtered = [...whaleEvents];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.wallet_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.transaction_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.token_symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      if (filterType === 'suspicious') {
        filtered = filtered.filter(event => event.is_suspicious);
      } else {
        filtered = filtered.filter(event => event.transaction_type === filterType);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    });

    setFilteredEvents(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('id-ID');
  };

  const formatFullTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('id-ID', {
      dateStyle: 'full',
      timeStyle: 'long'
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openInExplorer = (signature: string) => {
    window.open(`https://solscan.io/tx/${signature}`, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="shimmer h-32 card" />
        <div className="shimmer h-64 card" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Whale Activity</h2>
          <p className="text-gray-400 mt-1">Monitor transaksi besar di Solana blockchain</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card cursor-pointer hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Events</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.count}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="stat-card cursor-pointer hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Threshold</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.threshold} SOL</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="stat-card cursor-pointer hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Value</p>
              <p className="text-3xl font-bold text-white mt-1">${stats.totalValue.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari wallet address, type, atau token..."
            className="flex-1 max-w-md"
          />
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
            <ExportButton data={filteredEvents} filename="whale-activity" format="csv" />
            <button 
              onClick={fetchWhaleData}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-purple-800/30">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('swap')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'swap'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                }`}
              >
                Swaps
              </button>
              <button
                onClick={() => setFilterType('transfer')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'transfer'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                }`}
              >
                Transfers
              </button>
              <button
                onClick={() => setFilterType('suspicious')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'suspicious'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                }`}
              >
                Suspicious
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Whale Events Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            Recent Whale Transactions
            <span className="ml-3 text-sm text-gray-400">({filteredEvents.length} results)</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-purple-800/30">
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Wallet</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Type</th>
                <th 
                  className="text-left py-3 px-4 text-gray-400 font-medium text-sm cursor-pointer hover:text-purple-400"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Amount</span>
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 text-gray-400 font-medium text-sm cursor-pointer hover:text-purple-400"
                  onClick={() => handleSort('usd_value')}
                >
                  <div className="flex items-center space-x-1">
                    <span>USD Value</span>
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 text-gray-400 font-medium text-sm cursor-pointer hover:text-purple-400"
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Time</span>
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Status</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr 
                  key={event.id} 
                  className="border-b border-purple-800/10 hover:bg-purple-500/5 transition-colors cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <Wallet className="w-4 h-4 text-purple-400" />
                      <span className="text-white font-mono text-sm">{formatAddress(event.wallet_address)}</span>
                      <CopyButton text={event.wallet_address} />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/50">
                      {event.transaction_type}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-semibold">{event.amount} {event.token_symbol}</span>
                      <CopyButton text={event.amount.toString()} />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-400 font-semibold">${event.usd_value.toLocaleString()}</span>
                      <CopyButton text={event.usd_value.toString()} />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-400 text-sm">{formatTimestamp(event.timestamp)}</span>
                  </td>
                  <td className="py-4 px-4">
                    {event.is_suspicious ? (
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="badge-danger">Suspicious</span>
                      </div>
                    ) : (
                      <span className="badge-success">Normal</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openInExplorer(event.signature);
                      }}
                      className="p-2 hover:bg-purple-500/10 rounded-lg transition-colors"
                      title="View on Solscan"
                    >
                      <ExternalLink className="w-4 h-4 text-purple-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title="Transaction Details"
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Transaction Signature</p>
                <div className="flex items-center space-x-2">
                  <p className="text-white font-mono text-sm break-all">{selectedEvent.signature}</p>
                  <CopyButton text={selectedEvent.signature} showText />
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Status</p>
                <div>
                  {selectedEvent.is_suspicious ? (
                    <span className="badge-danger">Suspicious Activity</span>
                  ) : (
                    <span className="badge-success">Normal</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Wallet Address</p>
                <div className="flex items-center space-x-2">
                  <p className="text-white font-mono text-sm break-all">{selectedEvent.wallet_address}</p>
                  <CopyButton text={selectedEvent.wallet_address} showText />
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Transaction Type</p>
                <p className="text-white font-semibold">{selectedEvent.transaction_type}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Amount</p>
                <p className="text-white font-bold text-2xl">{selectedEvent.amount} {selectedEvent.token_symbol}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">USD Value</p>
                <p className="text-green-400 font-bold text-2xl">${selectedEvent.usd_value.toLocaleString()}</p>
              </div>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Timestamp</p>
              <p className="text-white">{formatFullTimestamp(selectedEvent.timestamp)}</p>
            </div>

            <div className="pt-4 border-t border-purple-800/30">
              <button
                onClick={() => openInExplorer(selectedEvent.signature)}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <ExternalLink className="w-5 h-5" />
                <span>View on Solscan</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
