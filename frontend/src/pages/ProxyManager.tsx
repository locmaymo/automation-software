import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  TestTube, 
  RefreshCw,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  Filter
} from 'lucide-react';

interface Proxy {
  id: number;
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: string;
  status: 'untested' | 'working' | 'failed';
  speed?: number;
  lastTested?: string;
  isAssigned: boolean;
  assignedTo?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProxyStats {
  total: number;
  working: number;
  failed: number;
  untested: number;
  assigned: number;
  available: number;
}

const ProxyManager: React.FC = () => {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [stats, setStats] = useState<ProxyStats>({
    total: 0,
    working: 0,
    failed: 0,
    untested: 0,
    assigned: 0,
    available: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedProxies, setSelectedProxies] = useState<number[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'working' | 'failed' | 'untested' | 'assigned'>('all');
  const [newProxy, setNewProxy] = useState({
    host: '',
    port: '',
    username: '',
    password: '',
    protocol: 'http',
    notes: '',
  });
  const [bulkProxies, setBulkProxies] = useState('');

  useEffect(() => {
    fetchProxies();
    fetchStats();
  }, []);

  const fetchProxies = async () => {
    try {
      const response = await fetch('/api/proxy');
      const data = await response.json();
      setProxies(data);
    } catch (error) {
      console.error('Failed to fetch proxies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/proxy/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleAddProxy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProxy,
          port: parseInt(newProxy.port),
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewProxy({ host: '', port: '', username: '', password: '', protocol: 'http', notes: '' });
        fetchProxies();
        fetchStats();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Failed to add proxy:', error);
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/proxy/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxyList: bulkProxies }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Added ${result.created} proxies. ${result.duplicates} duplicates, ${result.failed} failed.`);
        setShowBulkModal(false);
        setBulkProxies('');
        fetchProxies();
        fetchStats();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Failed to bulk add proxies:', error);
    }
  };

  const handleTestProxy = async (proxyId: number) => {
    try {
      const response = await fetch(`/api/proxy/${proxyId}/test`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchProxies();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to test proxy:', error);
    }
  };

  const handleBulkTest = async () => {
    if (selectedProxies.length === 0) return;

    try {
      const response = await fetch('/api/proxy/test-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxyIds: selectedProxies }),
      });

      if (response.ok) {
        fetchProxies();
        fetchStats();
        setSelectedProxies([]);
      }
    } catch (error) {
      console.error('Failed to bulk test proxies:', error);
    }
  };

  const handleDeleteProxy = async (proxyId: number) => {
    if (!window.confirm('Are you sure you want to delete this proxy?')) return;

    try {
      const response = await fetch(`/api/proxy/${proxyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProxies();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete proxy:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProxies.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedProxies.length} proxies?`)) return;

    try {
      const response = await fetch('/api/proxy/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxyIds: selectedProxies }),
      });

      if (response.ok) {
        fetchProxies();
        fetchStats();
        setSelectedProxies([]);
      }
    } catch (error) {
      console.error('Failed to bulk delete proxies:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'untested':
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      case 'untested':
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
    }
  };

  const filteredProxies = proxies.filter(proxy => {
    switch (filter) {
      case 'working':
        return proxy.status === 'working';
      case 'failed':
        return proxy.status === 'failed';
      case 'untested':
        return proxy.status === 'untested';
      case 'assigned':
        return proxy.isAssigned;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Proxy Manager</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage and monitor your proxy servers
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{stats.working}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Working</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-600">{stats.untested}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Untested</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Assigned</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.available}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Available</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Proxy
        </button>
        <button
          onClick={() => setShowBulkModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Upload className="w-4 h-4 mr-2" />
          Bulk Add
        </button>
        <button
          onClick={handleBulkTest}
          disabled={selectedProxies.length === 0}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TestTube className="w-4 h-4 mr-2" />
          Test Selected ({selectedProxies.length})
        </button>
        <button
          onClick={handleBulkDelete}
          disabled={selectedProxies.length === 0}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Selected ({selectedProxies.length})
        </button>
        <button
          onClick={() => { fetchProxies(); fetchStats(); }}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Proxies</option>
          <option value="working">Working</option>
          <option value="failed">Failed</option>
          <option value="untested">Untested</option>
          <option value="assigned">Assigned</option>
        </select>
      </div>

      {/* Proxy Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProxies.length === filteredProxies.length && filteredProxies.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProxies(filteredProxies.map(p => p.id));
                      } else {
                        setSelectedProxies([]);
                      }
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Proxy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Speed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Tested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProxies.map((proxy) => (
                <tr key={proxy.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProxies.includes(proxy.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProxies([...selectedProxies, proxy.id]);
                        } else {
                          setSelectedProxies(selectedProxies.filter(id => id !== proxy.id));
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {proxy.host}:{proxy.port}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {proxy.protocol.toUpperCase()}
                          {proxy.username && ' (Auth)'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {getStatusIcon(proxy.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(proxy.status)}`}>
                        {proxy.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {proxy.speed ? `${proxy.speed}ms` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {proxy.lastTested ? new Date(proxy.lastTested).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    {proxy.isAssigned ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900">
                        Profile #{proxy.assignedTo}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700">
                        Available
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTestProxy(proxy.id)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Test Proxy"
                      >
                        <TestTube className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProxy(proxy.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete Proxy"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Proxy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Proxy</h3>
            <form onSubmit={handleAddProxy}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Host
                  </label>
                  <input
                    type="text"
                    value={newProxy.host}
                    onChange={(e) => setNewProxy({ ...newProxy, host: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    value={newProxy.port}
                    onChange={(e) => setNewProxy({ ...newProxy, port: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username (Optional)
                  </label>
                  <input
                    type="text"
                    value={newProxy.username}
                    onChange={(e) => setNewProxy({ ...newProxy, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={newProxy.password}
                    onChange={(e) => setNewProxy({ ...newProxy, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Protocol
                  </label>
                  <select
                    value={newProxy.protocol}
                    onChange={(e) => setNewProxy({ ...newProxy, protocol: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="http">HTTP</option>
                    <option value="https">HTTPS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={newProxy.notes}
                    onChange={(e) => setNewProxy({ ...newProxy, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Add Proxy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bulk Add Proxies</h3>
            <form onSubmit={handleBulkAdd}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Proxy List
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Supported formats: http://user:pass@ip:port, ip:port:user:pass, ip:port (one per line)
                  </p>
                  <textarea
                    value={bulkProxies}
                    onChange={(e) => setBulkProxies(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={10}
                    placeholder="http://user:pass@192.168.1.1:8080&#10;192.168.1.2:8080:user:pass&#10;192.168.1.3:8080"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Add Proxies
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProxyManager;

