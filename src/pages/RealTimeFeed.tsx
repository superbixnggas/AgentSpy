import { useState, useEffect } from 'react';
import { supabase, EDGE_FUNCTIONS } from '../lib/supabase';
import { Zap, Activity, TrendingUp, Shield, AlertCircle, Play, Pause } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { SearchBar } from '../components/ui/SearchBar';
import { ExportButton } from '../components/ui/ExportButton';

interface FeedEvent {
  id: number;
  event_type: string;
  title: string;
  description: string;
  data: string;
  priority: string;
  timestamp: number;
  created_at: string;
}

export default function RealTimeFeed() {
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ count: 0, whaleEvents: 0, marketFlows: 0, stakingUpdates: 0 });
  const [selectedEvent, setSelectedEvent] = useState<FeedEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10);

  useEffect(() => {
    fetchFeedData();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('real_time_feed')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'real_time_feed' },
        () => {
          fetchFeedData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterEvents();
  }, [feedEvents, searchQuery, filterType, filterPriority]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchFeedData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const fetchFeedData = async () => {
    try {
      const response = await supabase.functions.invoke('aggregate-real-time-feed', {
        body: {}
      });

      if (response.data?.data) {
        const { feed_events, count, sources } = response.data.data;
        setFeedEvents(feed_events);
        setStats({
          count,
          whaleEvents: sources.whale_events,
          marketFlows: sources.market_flows,
          stakingUpdates: sources.staking_updates
        });
      }
    } catch (error) {
      console.error('Error fetching feed data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...feedEvents];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.event_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(event => event.event_type === filterType);
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(event => event.priority === filterPriority);
    }

    setFilteredEvents(filtered);
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'whale_alert':
        return <Activity className="w-5 h-5 text-purple-400" />;
      case 'market_swap':
        return <TrendingUp className="w-5 h-5 text-blue-400" />;
      case 'staking_update':
        return <Shield className="w-5 h-5 text-green-400" />;
      default:
        return <Zap className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="badge-danger">High</span>;
      case 'normal':
        return <span className="badge-info">Normal</span>;
      case 'low':
        return <span className="badge bg-gray-500/20 text-gray-400 border border-gray-500/50">Low</span>;
      default:
        return <span className="badge-info">Normal</span>;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleString('id-ID');
  };

  const formatFullTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('id-ID', {
      dateStyle: 'full',
      timeStyle: 'long'
    });
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
          <h2 className="text-3xl font-bold text-white">Real Time Feed</h2>
          <p className="text-gray-400 mt-1">Update cepat dari semua sumber monitoring</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              autoRefresh
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-gray-400'
            }`}
          >
            {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="text-sm font-medium">{autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}</span>
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card cursor-pointer hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Events</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.count}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div 
          className="stat-card cursor-pointer hover:scale-105 transition-transform"
          onClick={() => setFilterType('whale_alert')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Whale Alerts</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.whaleEvents}</p>
            </div>
            <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-pink-400" />
            </div>
          </div>
        </div>

        <div 
          className="stat-card cursor-pointer hover:scale-105 transition-transform"
          onClick={() => setFilterType('market_swap')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Market Swaps</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.marketFlows}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div 
          className="stat-card cursor-pointer hover:scale-105 transition-transform"
          onClick={() => setFilterType('staking_update')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Staking Updates</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.stakingUpdates}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-400" />
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
            placeholder="Cari events..."
            className="flex-1 max-w-md"
          />
          
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50"
              disabled={!autoRefresh}
            >
              <option value="5">5s</option>
              <option value="10">10s</option>
              <option value="30">30s</option>
              <option value="60">60s</option>
            </select>
            <ExportButton data={filteredEvents} filename="real-time-feed" format="json" />
            <button 
              onClick={fetchFeedData}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="mt-4 pt-4 border-t border-purple-800/30">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-gray-400 text-sm font-medium">Event Type:</span>
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
                onClick={() => setFilterType('whale_alert')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'whale_alert'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                }`}
              >
                Whale Alerts
              </button>
              <button
                onClick={() => setFilterType('market_swap')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'market_swap'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                }`}
              >
                Market Swaps
              </button>
              <button
                onClick={() => setFilterType('staking_update')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'staking_update'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                }`}
              >
                Staking Updates
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm font-medium">Priority:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterPriority('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterPriority === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterPriority('high')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterPriority === 'high'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                }`}
              >
                High
              </button>
              <button
                onClick={() => setFilterPriority('normal')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterPriority === 'normal'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setFilterPriority('low')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterPriority === 'low'
                    ? 'bg-gray-600 text-white'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                }`}
              >
                Low
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Timeline */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            Activity Timeline
            <span className="ml-3 text-sm text-gray-400">({filteredEvents.length} events)</span>
          </h3>
        </div>

        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <div 
              key={event.id} 
              className="flex items-start space-x-4 p-4 bg-slate-800/30 rounded-lg border border-purple-800/20 hover:border-purple-500/50 transition-all cursor-pointer"
              onClick={() => setSelectedEvent(event)}
            >
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                {getEventIcon(event.event_type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-white font-semibold">{event.title}</h4>
                  {getPriorityBadge(event.priority)}
                </div>
                <p className="text-gray-400 text-sm">{event.description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-gray-500">{formatTimestamp(event.timestamp)}</span>
                  <span className="text-xs text-purple-400 capitalize">{event.event_type.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Tidak ada event untuk ditampilkan</p>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title="Event Details"
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center space-x-4 pb-6 border-b border-purple-800/30">
              <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
                {getEventIcon(selectedEvent.event_type)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">{selectedEvent.title}</h3>
                <div className="flex items-center space-x-2">
                  {getPriorityBadge(selectedEvent.priority)}
                  <span className="text-sm text-gray-400 capitalize">{selectedEvent.event_type.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-2">Description</p>
              <p className="text-white">{selectedEvent.description}</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-2">Event Data</p>
              <div className="bg-slate-800/50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-gray-300 text-sm">{selectedEvent.data}</pre>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Event ID</p>
                <p className="text-white font-mono">{selectedEvent.id}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Timestamp</p>
                <p className="text-white">{formatFullTimestamp(selectedEvent.timestamp)}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
