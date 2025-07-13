import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Play, 
  Square, 
  Edit, 
  Trash2, 
  Clock,
  RefreshCw,
  FileText,
  Calendar,
  BarChart3
} from 'lucide-react';

interface Script {
  id: number;
  name: string;
  description?: string;
  actions: any[];
  schedule?: string;
  isActive: boolean;
  lastRun?: string;
  runCount: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Action {
  type: string;
  selector?: string;
  value?: string;
  options?: any;
  stopOnError?: boolean;
}

const ScriptManager: React.FC = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [scriptForm, setScriptForm] = useState({
    name: '',
    description: '',
    schedule: '',
    actions: [] as Action[],
  });

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      const response = await fetch('/api/script');
      const data = await response.json();
      setScripts(data);
    } catch (error) {
      console.error('Failed to fetch scripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScript = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingScript ? `/api/script/${editingScript.id}` : '/api/script';
      const method = editingScript ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scriptForm),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingScript(null);
        setScriptForm({ name: '', description: '', schedule: '', actions: [] });
        fetchScripts();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Failed to save script:', error);
    }
  };

  const handleEditScript = (script: Script) => {
    setEditingScript(script);
    setScriptForm({
      name: script.name,
      description: script.description || '',
      schedule: script.schedule || '',
      actions: script.actions,
    });
    setShowModal(true);
  };

  const handleDeleteScript = async (scriptId: number) => {
    if (!window.confirm('Are you sure you want to delete this script?')) return;

    try {
      const response = await fetch(`/api/script/${scriptId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchScripts();
      }
    } catch (error) {
      console.error('Failed to delete script:', error);
    }
  };

  const handleToggleScript = async (scriptId: number) => {
    try {
      const response = await fetch(`/api/script/${scriptId}/toggle`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchScripts();
      }
    } catch (error) {
      console.error('Failed to toggle script:', error);
    }
  };

  const handleExecuteScript = async (scriptId: number) => {
    try {
      const response = await fetch(`/api/script/${scriptId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileIds: [] }), // Execute on all active browsers
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Script executed. Results: ${JSON.stringify(result.results, null, 2)}`);
        fetchScripts();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Failed to execute script:', error);
    }
  };

  const handleShowHistory = async (script: Script) => {
    try {
      const response = await fetch(`/api/script/${script.id}/history`);
      const data = await response.json();
      setSelectedScript({ ...script, ...data });
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Failed to fetch script history:', error);
    }
  };

  const addAction = () => {
    setScriptForm({
      ...scriptForm,
      actions: [
        ...scriptForm.actions,
        { type: 'navigate', value: '', stopOnError: true },
      ],
    });
  };

  const updateAction = (index: number, action: Action) => {
    const newActions = [...scriptForm.actions];
    newActions[index] = action;
    setScriptForm({ ...scriptForm, actions: newActions });
  };

  const removeAction = (index: number) => {
    const newActions = scriptForm.actions.filter((_, i) => i !== index);
    setScriptForm({ ...scriptForm, actions: newActions });
  };

  const getActionTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      navigate: 'Navigate to URL',
      click: 'Click Element',
      type: 'Type Text',
      wait: 'Wait',
      waitForSelector: 'Wait for Selector',
      getText: 'Get Text',
      screenshot: 'Take Screenshot',
      evaluate: 'Evaluate JavaScript',
    };
    return labels[type] || type;
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Script Manager</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create and manage automation scripts
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Scripts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{scripts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Play className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {scripts.filter(s => s.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {scripts.filter(s => s.schedule).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Runs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {scripts.reduce((sum, s) => sum + s.runCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Script
        </button>
        <button
          onClick={fetchScripts}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Scripts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scripts.map((script) => (
          <div key={script.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{script.name}</h3>
                {script.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{script.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  script.isActive 
                    ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900'
                    : 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700'
                }`}>
                  {script.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Script Info */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Actions:</span>
                <span className="text-gray-900 dark:text-white">{script.actions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total Runs:</span>
                <span className="text-gray-900 dark:text-white">{script.runCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                <span className="text-gray-900 dark:text-white">
                  {script.runCount > 0 ? `${((script.successCount / script.runCount) * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              {script.schedule && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Schedule:</span>
                  <span className="text-gray-900 dark:text-white font-mono text-xs">{script.schedule}</span>
                </div>
              )}
              {script.lastRun && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Last Run:</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(script.lastRun).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Actions Preview */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Actions:</p>
              <div className="space-y-1">
                {script.actions.slice(0, 3).map((action, index) => (
                  <div key={index} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {index + 1}. {getActionTypeLabel(action.type)}
                    {action.value && `: ${action.value.substring(0, 30)}${action.value.length > 30 ? '...' : ''}`}
                  </div>
                ))}
                {script.actions.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    +{script.actions.length - 3} more actions
                  </div>
                )}
              </div>
            </div>

            {/* Script Actions */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExecuteScript(script.id)}
                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                  title="Execute Script"
                >
                  <Play className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditScript(script)}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  title="Edit Script"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShowHistory(script)}
                  className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                  title="View History"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleToggleScript(script.id)}
                  className={`${
                    script.isActive 
                      ? 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
                      : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                  }`}
                  title={script.isActive ? 'Deactivate' : 'Activate'}
                >
                  {script.isActive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDeleteScript(script.id)}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  title="Delete Script"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Script Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingScript ? 'Edit Script' : 'Create New Script'}
            </h3>
            <form onSubmit={handleSaveScript}>
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Script Name
                    </label>
                    <input
                      type="text"
                      value={scriptForm.name}
                      onChange={(e) => setScriptForm({ ...scriptForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Schedule (Cron Expression)
                    </label>
                    <input
                      type="text"
                      value={scriptForm.schedule}
                      onChange={(e) => setScriptForm({ ...scriptForm, schedule: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0 0 * * * (every hour)"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={scriptForm.description}
                    onChange={(e) => setScriptForm({ ...scriptForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Actions
                    </label>
                    <button
                      type="button"
                      onClick={addAction}
                      className="flex items-center px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Action
                    </button>
                  </div>
                  <div className="space-y-4">
                    {scriptForm.actions.map((action, index) => (
                      <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Action {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAction(index)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Type</label>
                            <select
                              value={action.type}
                              onChange={(e) => updateAction(index, { ...action, type: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="navigate">Navigate</option>
                              <option value="click">Click</option>
                              <option value="type">Type</option>
                              <option value="wait">Wait</option>
                              <option value="waitForSelector">Wait for Selector</option>
                              <option value="getText">Get Text</option>
                              <option value="screenshot">Screenshot</option>
                              <option value="evaluate">Evaluate JS</option>
                            </select>
                          </div>
                          {['click', 'type', 'waitForSelector', 'getText'].includes(action.type) && (
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Selector</label>
                              <input
                                type="text"
                                value={action.selector || ''}
                                onChange={(e) => updateAction(index, { ...action, selector: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="CSS selector"
                              />
                            </div>
                          )}
                          {['navigate', 'type', 'wait', 'evaluate'].includes(action.type) && (
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                {action.type === 'navigate' ? 'URL' : 
                                 action.type === 'type' ? 'Text' :
                                 action.type === 'wait' ? 'Milliseconds' : 'JavaScript'}
                              </label>
                              <input
                                type={action.type === 'wait' ? 'number' : 'text'}
                                value={action.value || ''}
                                onChange={(e) => updateAction(index, { ...action, value: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                          )}
                        </div>
                        <div className="mt-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={action.stopOnError !== false}
                              onChange={(e) => updateAction(index, { ...action, stopOnError: e.target.checked })}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                              Stop script execution on error
                            </span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingScript(null);
                    setScriptForm({ name: '', description: '', schedule: '', actions: [] });
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingScript ? 'Update Script' : 'Create Script'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedScript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Script History - {selectedScript.name}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedScript.successCount}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Successful Runs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{selectedScript.failureCount}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Failed Runs</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{selectedScript.runCount}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Runs</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">
                  {selectedScript.runCount > 0 ? `${((selectedScript.successCount / selectedScript.runCount) * 100).toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
              </div>
              {selectedScript.lastRun && (
                <div className="text-center">
                  <div className="text-sm text-gray-900 dark:text-white">
                    Last run: {new Date(selectedScript.lastRun).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptManager;

