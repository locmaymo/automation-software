import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  Monitor, 
  Users, 
  Crown,
  RefreshCw,
  Trash2,
  Settings,
  Globe,
  User
} from 'lucide-react';

interface BrowserSession {
  id: number;
  profileId: number;
  pid?: number;
  wsEndpoint?: string;
  status: 'starting' | 'running' | 'stopped' | 'error';
  startedAt?: string;
  stoppedAt?: string;
  isMaster: boolean;
  currentUrl?: string;
  lastActivity?: string;
  profile: {
    id: number;
    name: string;
    status: string;
  };
  realTimeStatus?: {
    status: string;
    url?: string;
    title?: string;
    isMaster?: boolean;
    isSlave?: boolean;
  };
}

interface Profile {
  id: number;
  name: string;
  status: string;
  proxy?: {
    host: string;
    port: number;
  };
}

const BrowserManager: React.FC = () => {
  const [sessions, setSessions] = useState<BrowserSession[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'master' | 'slaves' | 'specific'>('master');
  const [actionCommand, setActionCommand] = useState({
    action: 'navigate',
    selector: '',
    value: '',
    options: {},
  });

  useEffect(() => {
    fetchSessions();
    fetchProfiles();
    
    // Refresh sessions every 5 seconds
    const interval = setInterval(() => {
      fetchSessions();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/browser/sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();
      setProfiles(data.filter((p: Profile) => p.status !== 'active')); // Only show inactive profiles
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    }
  };

  const handleStartBrowser = async (profileId: number) => {
    try {
      const response = await fetch(`/api/browser/start/${profileId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headless: false }),
      });

      if (response.ok) {
        fetchSessions();
        fetchProfiles();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Failed to start browser:', error);
    }
  };

  const handleStopBrowser = async (profileId: number) => {
    try {
      const response = await fetch(`/api/browser/stop/${profileId}`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchSessions();
        fetchProfiles();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Failed to stop browser:', error);
    }
  };

  const handleBulkStart = async () => {
    if (selectedSessions.length === 0) return;

    try {
      const response = await fetch('/api/browser/start-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profileIds: selectedSessions,
          headless: false 
        }),
      });

      if (response.ok) {
        fetchSessions();
        fetchProfiles();
        setSelectedSessions([]);
      }
    } catch (error) {
      console.error('Failed to bulk start browsers:', error);
    }
  };

  const handleBulkStop = async () => {
    if (selectedSessions.length === 0) return;

    try {
      const response = await fetch('/api/browser/stop-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileIds: selectedSessions }),
      });

      if (response.ok) {
        fetchSessions();
        fetchProfiles();
        setSelectedSessions([]);
      }
    } catch (error) {
      console.error('Failed to bulk stop browsers:', error);
    }
  };

  const handleSetMaster = async (profileId: number) => {
    try {
      const response = await fetch(`/api/browser/set-master/${profileId}`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchSessions();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Failed to set master:', error);
    }
  };

  const handleAddSlave = async (profileId: number) => {
    try {
      const response = await fetch(`/api/browser/add-slave/${profileId}`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchSessions();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Failed to add slave:', error);
    }
  };

  const handleRemoveSlave = async (profileId: number) => {
    try {
      const response = await fetch(`/api/browser/remove-slave/${profileId}`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchSessions();
      }
    } catch (error) {
      console.error('Failed to remove slave:', error);
    }
  };

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let endpoint = '';
      let body: any = {
        action: actionCommand.action,
        args: [],
      };

      // Prepare arguments based on action type
      switch (actionCommand.action) {
        case 'navigate':
          body.args = [actionCommand.value];
          break;
        case 'click':
          body.args = [actionCommand.selector];
          break;
        case 'type':
          body.args = [actionCommand.selector, actionCommand.value];
          break;
        case 'wait':
          body.args = [parseInt(actionCommand.value)];
          break;
        case 'waitForSelector':
          body.args = [actionCommand.selector];
          break;
        case 'getText':
          body.args = [actionCommand.selector];
          break;
        case 'screenshot':
          body.args = [actionCommand.options];
          break;
        case 'evaluate':
          body.args = [actionCommand.value];
          break;
      }

      // Determine endpoint
      switch (actionType) {
        case 'master':
          endpoint = '/api/browser/execute-master';
          break;
        case 'slaves':
          endpoint = '/api/browser/execute-slaves';
          break;
        case 'specific':
          if (selectedSessions.length === 1) {
            endpoint = `/api/browser/execute/${selectedSessions[0]}`;
          } else {
            alert('Please select exactly one session for specific execution');
            return;
          }
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Action executed successfully: ${JSON.stringify(result.result || result.results, null, 2)}`);
        setShowActionModal(false);
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Failed to execute action:', error);
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm('Are you sure you want to stop all browsers? This will close all running sessions.')) return;

    try {
      const response = await fetch('/api/browser/cleanup', {
        method: 'POST',
      });

      if (response.ok) {
        fetchSessions();
        fetchProfiles();
      }
    } catch (error) {
      console.error('Failed to cleanup browsers:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'starting':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
      case 'stopped':
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
      case 'error':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
    }
  };

  const runningSessions = sessions.filter(s => s.realTimeStatus?.status === 'running');
  const masterSession = runningSessions.find(s => s.realTimeStatus?.isMaster);
  const slaveSessions = runningSessions.filter(s => s.realTimeStatus?.isSlave);

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Browser Manager</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage browser sessions and automation
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Monitor className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Running</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{runningSessions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Crown className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Master</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{masterSession ? 1 : 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Slaves</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{slaveSessions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <User className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Profiles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profiles.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={handleBulkStart}
          disabled={selectedSessions.length === 0}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4 mr-2" />
          Start Selected ({selectedSessions.length})
        </button>
        <button
          onClick={handleBulkStop}
          disabled={selectedSessions.length === 0}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Square className="w-4 h-4 mr-2" />
          Stop Selected ({selectedSessions.length})
        </button>
        <button
          onClick={() => setShowActionModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Settings className="w-4 h-4 mr-2" />
          Execute Action
        </button>
        <button
          onClick={handleCleanup}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Cleanup All
        </button>
        <button
          onClick={() => { fetchSessions(); fetchProfiles(); }}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Available Profiles */}
      {profiles.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Available Profiles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile) => (
              <div key={profile.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{profile.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {profile.proxy ? `${profile.proxy.host}:${profile.proxy.port}` : 'No proxy'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartBrowser(profile.id)}
                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Running Sessions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Browser Sessions</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedSessions.length === sessions.length && sessions.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSessions(sessions.map(s => s.profileId));
                        } else {
                          setSelectedSessions([]);
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Profile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Current URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedSessions.includes(session.profileId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSessions([...selectedSessions, session.profileId]);
                          } else {
                            setSelectedSessions(selectedSessions.filter(id => id !== session.profileId));
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {session.profile.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {session.profileId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.realTimeStatus?.status || session.status)}`}>
                        {session.realTimeStatus?.status || session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {session.realTimeStatus?.url ? (
                        <div>
                          <div className="truncate max-w-xs" title={session.realTimeStatus.url}>
                            {session.realTimeStatus.url}
                          </div>
                          {session.realTimeStatus.title && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {session.realTimeStatus.title}
                            </div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {session.realTimeStatus?.isMaster && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900">
                            Master
                          </span>
                        )}
                        {session.realTimeStatus?.isSlave && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900">
                            Slave
                          </span>
                        )}
                        {!session.realTimeStatus?.isMaster && !session.realTimeStatus?.isSlave && session.realTimeStatus?.status === 'running' && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700">
                            Independent
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {session.startedAt ? new Date(session.startedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {session.realTimeStatus?.status === 'running' ? (
                          <>
                            <button
                              onClick={() => handleStopBrowser(session.profileId)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Stop Browser"
                            >
                              <Square className="w-4 h-4" />
                            </button>
                            {!session.realTimeStatus?.isMaster && (
                              <button
                                onClick={() => handleSetMaster(session.profileId)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Set as Master"
                              >
                                <Crown className="w-4 h-4" />
                              </button>
                            )}
                            {!session.realTimeStatus?.isSlave && !session.realTimeStatus?.isMaster && (
                              <button
                                onClick={() => handleAddSlave(session.profileId)}
                                className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                                title="Add as Slave"
                              >
                                <Users className="w-4 h-4" />
                              </button>
                            )}
                            {session.realTimeStatus?.isSlave && (
                              <button
                                onClick={() => handleRemoveSlave(session.profileId)}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                title="Remove from Slaves"
                              >
                                <Users className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => handleStartBrowser(session.profileId)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Start Browser"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Execute Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Execute Action</h3>
            <form onSubmit={handleExecuteAction}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="master">Master Browser</option>
                    <option value="slaves">All Slave Browsers</option>
                    <option value="specific">Specific Browser</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Action
                  </label>
                  <select
                    value={actionCommand.action}
                    onChange={(e) => setActionCommand({ ...actionCommand, action: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="navigate">Navigate to URL</option>
                    <option value="click">Click Element</option>
                    <option value="type">Type Text</option>
                    <option value="wait">Wait (ms)</option>
                    <option value="waitForSelector">Wait for Selector</option>
                    <option value="getText">Get Text</option>
                    <option value="screenshot">Take Screenshot</option>
                    <option value="evaluate">Evaluate JavaScript</option>
                  </select>
                </div>
                {['click', 'type', 'waitForSelector', 'getText'].includes(actionCommand.action) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Selector
                    </label>
                    <input
                      type="text"
                      value={actionCommand.selector}
                      onChange={(e) => setActionCommand({ ...actionCommand, selector: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="CSS selector"
                      required
                    />
                  </div>
                )}
                {['navigate', 'type', 'wait', 'evaluate'].includes(actionCommand.action) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {actionCommand.action === 'navigate' ? 'URL' : 
                       actionCommand.action === 'type' ? 'Text' :
                       actionCommand.action === 'wait' ? 'Milliseconds' : 'JavaScript Code'}
                    </label>
                    <input
                      type={actionCommand.action === 'wait' ? 'number' : 'text'}
                      value={actionCommand.value}
                      onChange={(e) => setActionCommand({ ...actionCommand, value: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Execute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowserManager;

