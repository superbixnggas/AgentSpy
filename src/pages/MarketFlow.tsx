import { useState, useEffect } from 'react';
import { supabase, EDGE_FUNCTIONS } from '../lib/supabase';
import { ArrowRightLeft, BarChart3, TrendingUp, ExternalLink, ArrowUpDown } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { CopyButton } from '../components/ui/CopyButton';
import { SearchBar } from '../components/ui/SearchBar';
import { ExportButton } from '../components/ui/ExportButton';

interface MarketFlowData {
  id: number;
  token_in: string;
  token_out: string;
  amount_in: number;
  amount_out: number;
  price_impact: number;
  volume_24h: number;
  dex_name: string;
  timestamp: number;
  created_at: string;
}

type SortField = 'timestamp' | 'amount_in' | 'volume_24h' | 'price_impact';
type SortOrder = 'asc' | 'desc';

export default function MarketFlow() {
  const [marketFlows, setMarketFlows] = useState<MarketFlowData[]>([]);
  const [filteredFlows, setFilteredFlows] = useState<MarketFlowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalVolume: 0, avgPriceImpact: 0, count: 0 });
  const [selectedFlow, setSelectedFlow] = useState<MarketFlowData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDex, setSelectedDex] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetchMarketData();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('market_flow')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'market_flow' },
        () => {
          fetchMarketData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterAndSortFlows();
  }, [marketFlows, searchQuery, selectedDex, sortField, sortOrder]);

  const fetchMarketData = async () => {
    try {
      const response = await supabase.functions.invoke('fetch-market-flow', {
        body: {}
      });

      if (response.data?.data) {
        const { market_flows, count, statistics } = response.data.data;
        setMarketFlows(market_flows);
        setStats({
          totalVolume: statistics.total_volume_24h,
          avgPriceImpact: statistics.avg_price_impact,
          count
        });
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortFlows = () => {
    let filtered = [...marketFlows];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(flow =>
        flow.token_in.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flow.token_out.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flow.dex_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // DEX filter
    if (selectedDex !== 'all') {
      filtered = filtered.filter(flow => flow.dex_name === selectedDex);
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

    setFilteredFlows(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getDexes = () => {
    const dexes = new Set(marketFlows.map(flow => flow.dex_name));
    return Array.from(dexes);
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

  const getPriceImpactColor = (impact: number) => {
    if (impact > 0.5) return 'text-red-400';
    if (impact > 0.3) return 'text-yellow-400';
    return 'text-green-400';
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
          <h2 className="text-3xl font-bold text-white">Market Flow</h2>
          <p className="text-gray-400 mt-1">Monitor arus token dan volume swap di Solana DEX</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card cursor-pointer hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Volume 24h</p>
              <p className="text-3xl font-bold text-white mt-1">${(stats.totalVolume / 1000000).toFixed(2)}M</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="stat-card cursor-pointer hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Price Impact</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.avgPriceImpact.toFixed(2)}%</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="stat-card cursor-pointer hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Swaps</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.count}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6 text-purple-400" />
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
            placeholder="Cari token pair atau DEX..."
            className="flex-1 max-w-md"
          />
          
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <select
              value={selectedDex}
              onChange={(e) => setSelectedDex(e.target.value)}
              className="px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50"
            >
              <option value="all">All DEXs</option>
              {getDexes().map(dex => (
                <option key={dex} value={dex}>{dex}</option>
              ))}
            </select>
            <ExportButton data={filteredFlows} filename="market-flow" format="csv" />
            <button 
              onClick={fetchMarketData}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Market Flow Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            Recent Swaps
            <span className="ml-3 text-sm text-gray-400">({filteredFlows.length} results)</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-purple-800/30">
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Swap Pair</th>
                <th 
                  className="text-left py-3 px-4 text-gray-400 font-medium text-sm cursor-pointer hover:text-purple-400"
                  onClick={() => handleSort('amount_in')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Amount In</span>
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Amount Out</th>
                <th 
                  className="text-left py-3 px-4 text-gray-400 font-medium text-sm cursor-pointer hover:text-purple-400"
                  onClick={() => handleSort('price_impact')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Price Impact</span>
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">DEX</th>
                <th 
                  className="text-left py-3 px-4 text-gray-400 font-medium text-sm cursor-pointer hover:text-purple-400"
                  onClick={() => handleSort('volume_24h')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Volume 24h</span>
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
              </tr>
            </thead>
            <tbody>
              {filteredFlows.map((flow) => (
                <tr 
                  key={flow.id} 
                  className="border-b border-purple-800/10 hover:bg-purple-500/5 transition-colors cursor-pointer"
                  onClick={() => setSelectedFlow(flow)}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-semibold">{flow.token_in}</span>
                      <ArrowRightLeft className="w-4 h-4 text-purple-400" />
                      <span className="text-white font-semibold">{flow.token_out}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-300">{flow.amount_in.toLocaleString()} {flow.token_in}</span>
                      <CopyButton text={flow.amount_in.toString()} />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-300">{flow.amount_out.toLocaleString()} {flow.token_out}</span>
                      <CopyButton text={flow.amount_out.toString()} />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`font-semibold ${getPriceImpactColor(flow.price_impact)}`}>
                      {flow.price_impact.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/50">
                      {flow.dex_name}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-green-400 font-semibold">${(flow.volume_24h / 1000000).toFixed(2)}M</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-400 text-sm">{formatTimestamp(flow.timestamp)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Swap Detail Modal */}
      {selectedFlow && (
        <Modal
          isOpen={!!selectedFlow}
          onClose={() => setSelectedFlow(null)}
          title="Swap Details"
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-center py-6">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-purple-400">{selectedFlow.token_in}</span>
                  </div>
                  <p className="text-white font-bold text-xl">{selectedFlow.amount_in.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">{selectedFlow.token_in}</p>
                </div>
                
                <ArrowRightLeft className="w-8 h-8 text-purple-400" />
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-blue-400">{selectedFlow.token_out}</span>
                  </div>
                  <p className="text-white font-bold text-xl">{selectedFlow.amount_out.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">{selectedFlow.token_out}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">DEX Platform</p>
                <p className="text-white font-semibold text-lg">{selectedFlow.dex_name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Price Impact</p>
                <p className={`font-bold text-lg ${getPriceImpactColor(selectedFlow.price_impact)}`}>
                  {selectedFlow.price_impact.toFixed(4)}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">24h Volume</p>
                <p className="text-green-400 font-bold text-xl">${(selectedFlow.volume_24h / 1000000).toFixed(2)}M</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Timestamp</p>
                <p className="text-white">{formatFullTimestamp(selectedFlow.timestamp)}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
