import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Users, 
  Trash2, 
  RefreshCw,
  User,
  Globe,
  Monitor,
  Shuffle,
  Settings
} from 'lucide-react';

interface Profile {
  id: number;
  name: string;
  fingerprint: any;
  proxyId?: number;
  proxy?: {
    id: number;
    host: string;
    port: number;
    status: string;
  };
  userDataDir: string;
  status: 'inactive' | 'active' | 'error';
  lastUsed?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Proxy {
  id: number;
  host: string;
  port: number;
  status: string;
  isAssigned: boolean;
}

const ProfileManager: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfiles, setSelectedProfiles] = useState<number[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showFingerprintModal, setShowFingerprintModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [newProfile, setNewProfile] = useState({
    name: '',
    proxyId: '',
    notes: '',
  });
  const [bulkSettings, setBulkSettings] = useState({
    count: 5,
    namePrefix: 'Profile',
    assignProxies: false,
  });

  useEffect(() => {
    fetchProfiles();
    fetchProxies();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();
      setProfiles(data);
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProxies = async () => {
    try {
      const response = await fetch('/api/proxy');
      const data = await response.json();
      setProxies(data.filter((p: Proxy) => !p.isAssigned && p.status === 'working'));
    } catch (error) {
      console.error('Failed to fetch proxies:', error);
    }
  };

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProfile,
          proxyId: newProfile.proxyId ? parseInt(newProfile.proxyId) : null,
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewProfile({ name: '', proxyId: '', notes: '' });
        fetchProfiles();
        fetchProxies();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Failed to add profile:', error);
    }
  };

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/profile/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkSettings),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Created ${result.created} profiles. ${result.failed} failed.`);
        setShowBulkModal(false);
        setBulkSettings({ count: 5, namePrefix: 'Profile', assignProxies: false });
        fetchProfiles();
        fetchProxies();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Failed to bulk create profiles:', error);
    }
  };

  const handleRollFingerprint = async (profileId: number) => {
    try {
      const response = await fetch(`/api/profile/${profileId}/roll-fingerprint`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchProfiles();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Failed to roll fingerprint:', error);
    }
  };

  const handleDeleteProfile = async (profileId: number) => {
    if (!window.confirm('Are you sure you want to delete this profile? This will also delete all browser data.')) return;

    try {
      const response = await fetch(`/api/profile/${profileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProfiles();
        fetchProxies();
      }
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  };

  const handleAssignProxy = async (profileId: number, proxyId: number | null) => {
    try {
      const response = await fetch(`/api/profile/${profileId}/assign-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxyId }),
      });

      if (response.ok) {
        fetchProfiles();
        fetchProxies();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Failed to assign proxy:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'inactive':
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
      case 'error':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
    }
  };

  const showFingerprint = (profile: Profile) => {
    setSelectedProfile(profile);
    setShowFingerprintModal(true);
  };

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Manager</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage browser profiles and fingerprints
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Profiles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profiles.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Monitor className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profiles.filter(p => p.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">With Proxy</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profiles.filter(p => p.proxyId).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Proxies</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{proxies.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Profile
        </button>
        <button
          onClick={() => setShowBulkModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Users className="w-4 h-4 mr-2" />
          Bulk Create
        </button>
        <button
          onClick={() => { fetchProfiles(); fetchProxies(); }}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Profile Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <div key={profile.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{profile.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">ID: {profile.id}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(profile.status)}`}>
                {profile.status}
              </span>
            </div>

            {/* Fingerprint Info */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Platform:</span>
                <span className="text-gray-900 dark:text-white">{profile.fingerprint.platform}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Screen:</span>
                <span className="text-gray-900 dark:text-white">
                  {profile.fingerprint.screen?.width}x{profile.fingerprint.screen?.height}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">CPU:</span>
                <span className="text-gray-900 dark:text-white">{profile.fingerprint.cpu}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Memory:</span>
                <span className="text-gray-900 dark:text-white">{profile.fingerprint.memory}</span>
              </div>
            </div>

            {/* Proxy Info */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Proxy:</span>
                <select
                  value={profile.proxyId || ''}
                  onChange={(e) => handleAssignProxy(profile.id, e.target.value ? parseInt(e.target.value) : null)}
                  className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">No Proxy</option>
                  {profile.proxy && (
                    <option value={profile.proxy.id}>
                      {profile.proxy.host}:{profile.proxy.port} (Current)
                    </option>
                  )}
                  {proxies.map((proxy) => (
                    <option key={proxy.id} value={proxy.id}>
                      {proxy.host}:{proxy.port}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Last Used */}
            {profile.lastUsed && (
              <div className="mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Last used: {new Date(profile.lastUsed).toLocaleString()}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={() => showFingerprint(profile)}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  title="View Fingerprint"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRollFingerprint(profile.id)}
                  className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                  title="Roll Fingerprint"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => handleDeleteProfile(profile.id)}
                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                title="Delete Profile"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Profile Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Profile</h3>
            <form onSubmit={handleAddProfile}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Profile Name
                  </label>
                  <input
                    type="text"
                    value={newProfile.name}
                    onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assign Proxy (Optional)
                  </label>
                  <select
                    value={newProfile.proxyId}
                    onChange={(e) => setNewProfile({ ...newProfile, proxyId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">No Proxy</option>
                    {proxies.map((proxy) => (
                      <option key={proxy.id} value={proxy.id}>
                        {proxy.host}:{proxy.port}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={newProfile.notes}
                    onChange={(e) => setNewProfile({ ...newProfile, notes: e.target.value })}
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
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bulk Create Profiles</h3>
            <form onSubmit={handleBulkCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Number of Profiles
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={bulkSettings.count}
                    onChange={(e) => setBulkSettings({ ...bulkSettings, count: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name Prefix
                  </label>
                  <input
                    type="text"
                    value={bulkSettings.namePrefix}
                    onChange={(e) => setBulkSettings({ ...bulkSettings, namePrefix: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="assignProxies"
                    checked={bulkSettings.assignProxies}
                    onChange={(e) => setBulkSettings({ ...bulkSettings, assignProxies: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="assignProxies" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Auto-assign available proxies
                  </label>
                </div>
                {bulkSettings.assignProxies && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {proxies.length} available proxies. Will create up to {Math.min(bulkSettings.count, proxies.length)} profiles with proxies.
                  </p>
                )}
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
                  Create Profiles
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fingerprint Modal */}
      {showFingerprintModal && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Fingerprint Details - {selectedProfile.name}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Platform</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedProfile.fingerprint.platform}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Timezone</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedProfile.fingerprint.timezone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedProfile.fingerprint.language}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CPU Cores</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedProfile.fingerprint.cpu}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Memory</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedProfile.fingerprint.memory}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Screen Resolution</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedProfile.fingerprint.screen?.width}x{selectedProfile.fingerprint.screen?.height}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User Agent</label>
                <p className="text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 p-2 rounded break-all">
                  {selectedProfile.fingerprint.userAgent}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">WebGL Info</label>
                <div className="text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 p-2 rounded">
                  <p>Vendor: {selectedProfile.fingerprint.webGLInfo?.vendor}</p>
                  <p>Renderer: {selectedProfile.fingerprint.webGLInfo?.renderer}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowFingerprintModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleRollFingerprint(selectedProfile.id);
                  setShowFingerprintModal(false);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Roll New Fingerprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileManager;

