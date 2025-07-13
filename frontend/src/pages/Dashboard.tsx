import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  User, 
  Monitor, 
  FileText, 
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useWebSocket } from '../contexts/WebSocketContext';

interface Stats {
  proxies: {
    total: number;
    working: number;
    failed: number;
    untested: number;
    assigned: number;
    available: number;
  };
  profiles: {
    total: number;
    active: number;
    inactive: number;
  };
  browsers: {
    running: number;
    stopped: number;
  };
  scripts: {
    total: number;
    active: number;
    scheduled: number;
  };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    proxies: { total: 0, working: 0, failed: 0, untested: 0, assigned: 0, available: 0 },
    profiles: { total: 0, active: 0, inactive: 0 },
    browsers: { running: 0, stopped: 0 },
    scripts: { total: 0, active: 0, scheduled: 0 },
  });
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (lastMessage) {
      // Refresh stats when receiving real-time updates
      if (['proxy_updated', 'profile_updated', 'browser_updated', 'script_updated'].includes(lastMessage.type)) {
        fetchStats();
      }
    }
  }, [lastMessage]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch proxy stats
      const proxyResponse = await fetch('/api/proxy/stats');
      const proxyStats = await proxyResponse.json();
      
      // Fetch other stats (simplified for demo)
      const profileResponse = await fetch('/api/profile');
      const profiles = await profileResponse.json();
      
      const browserResponse = await fetch('/api/browser/status');
      const browserStatuses = await browserResponse.json();
      
      const scriptResponse = await fetch('/api/script');
      const scripts = await scriptResponse.json();
      
      // Calculate stats
      const profileStats = {
        total: profiles.length,
        active: profiles.filter((p: any) => p.status === 'active').length,
        inactive: profiles.filter((p: any) => p.status === 'inactive').length,
      };
      
      const browserStats = {
        running: Object.values(browserStatuses).filter((status: any) => status.status === 'running').length,
        stopped: Object.values(browserStatuses).filter((status: any) => status.status === 'stopped').length,
      };
      
      const scriptStats = {
        total: scripts.length,
        active: scripts.filter((s: any) => s.isActive).length,
        scheduled: scripts.filter((s: any) => s.schedule).length,
      };
      
      setStats({
        proxies: proxyStats,
        profiles: profileStats,
        browsers: browserStats,
        scripts: scriptStats,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const proxyChartData = [
    { name: 'Working', value: stats.proxies.working, color: '#10b981' },
    { name: 'Failed', value: stats.proxies.failed, color: '#ef4444' },
    { name: 'Untested', value: stats.proxies.untested, color: '#6b7280' },
  ];

  const activityData = [
    { name: 'Mon', proxies: 12, profiles: 8, browsers: 5 },
    { name: 'Tue', proxies: 19, profiles: 12, browsers: 8 },
    { name: 'Wed', proxies: 15, profiles: 10, browsers: 6 },
    { name: 'Thu', proxies: 22, profiles: 15, browsers: 10 },
    { name: 'Fri', proxies: 18, profiles: 13, browsers: 9 },
    { name: 'Sat', proxies: 8, profiles: 5, browsers: 3 },
    { name: 'Sun', proxies: 6, profiles: 4, browsers: 2 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Overview of your automation environment
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Proxy Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Proxies</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.proxies.total}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-green-600 dark:text-green-400">Working: {stats.proxies.working}</span>
              <span className="text-red-600 dark:text-red-400">Failed: {stats.proxies.failed}</span>
            </div>
          </div>
        </div>

        {/* Profile Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <User className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Profiles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.profiles.total}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-green-600 dark:text-green-400">Active: {stats.profiles.active}</span>
              <span className="text-gray-600 dark:text-gray-400">Inactive: {stats.profiles.inactive}</span>
            </div>
          </div>
        </div>

        {/* Browser Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Monitor className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Browsers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.browsers.running}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-green-600 dark:text-green-400">Running: {stats.browsers.running}</span>
              <span className="text-gray-600 dark:text-gray-400">Stopped: {stats.browsers.stopped}</span>
            </div>
          </div>
        </div>

        {/* Script Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Scripts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.scripts.total}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-green-600 dark:text-green-400">Active: {stats.scripts.active}</span>
              <span className="text-blue-600 dark:text-blue-400">Scheduled: {stats.scripts.scheduled}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Proxy Status Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Proxy Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={proxyChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {proxyChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="proxies" fill="#3b82f6" name="Proxies" />
              <Bar dataKey="profiles" fill="#10b981" name="Profiles" />
              <Bar dataKey="browsers" fill="#8b5cf6" name="Browsers" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
            <span className="text-gray-900 dark:text-white">5 new proxies added and tested successfully</span>
            <span className="text-gray-500 dark:text-gray-400 ml-auto text-sm">2 minutes ago</span>
          </div>
          <div className="flex items-center">
            <Activity className="w-5 h-5 text-blue-500 mr-3" />
            <span className="text-gray-900 dark:text-white">Browser session started for Profile #3</span>
            <span className="text-gray-500 dark:text-gray-400 ml-auto text-sm">5 minutes ago</span>
          </div>
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-purple-500 mr-3" />
            <span className="text-gray-900 dark:text-white">Script "Data Collection" executed successfully</span>
            <span className="text-gray-500 dark:text-gray-400 ml-auto text-sm">10 minutes ago</span>
          </div>
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-3" />
            <span className="text-gray-900 dark:text-white">2 proxies failed health check</span>
            <span className="text-gray-500 dark:text-gray-400 ml-auto text-sm">15 minutes ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

