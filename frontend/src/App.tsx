import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ProxyManager from './pages/ProxyManager';
import ProfileManager from './pages/ProfileManager';
import BrowserManager from './pages/BrowserManager';
import ScriptManager from './pages/ScriptManager';
import { ThemeProvider } from './contexts/ThemeContext';
import { WebSocketProvider } from './contexts/WebSocketContext';

function App() {
  return (
    <ThemeProvider>
      <WebSocketProvider>
        <Router>
          <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <Sidebar />
            <main className="flex-1 overflow-hidden">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/proxy" element={<ProxyManager />} />
                <Route path="/profile" element={<ProfileManager />} />
                <Route path="/browser" element={<BrowserManager />} />
                <Route path="/script" element={<ScriptManager />} />
              </Routes>
            </main>
          </div>
        </Router>
      </WebSocketProvider>
    </ThemeProvider>
  );
}

export default App;

