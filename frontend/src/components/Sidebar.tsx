import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Globe, 
  User, 
  Monitor, 
  FileText, 
  Moon, 
  Sun,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useWebSocket } from '../contexts/WebSocketContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { isConnected, connectionStatus } = useWebSocket();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/proxy', icon: Globe, label: 'Proxy Manager' },
    { path: '/profile', icon: User, label: 'Profile Manager' },
    { path: '/browser', icon: Monitor, label: 'Browser Manager' },
    { path: '/script', icon: FileText, label: 'Script Manager' },
  ];

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'disconnected':
        return 'text-gray-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Automation Suite
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Browser Automation Tool
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {/* Connection Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {isConnected ? (
              <Wifi className={`w-4 h-4 mr-2 ${getConnectionStatusColor()}`} />
            ) : (
              <WifiOff className={`w-4 h-4 mr-2 ${getConnectionStatusColor()}`} />
            )}
            <span className={`text-sm ${getConnectionStatusColor()}`}>
              {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
            </span>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 mr-3" />
              Light Mode
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 mr-3" />
              Dark Mode
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

