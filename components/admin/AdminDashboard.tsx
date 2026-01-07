'use client';

import { useState } from 'react';
import ContentGenerator from './ContentGenerator';
import DraftManager from './DraftManager';
import AdminStats from './AdminStats';
import AdminSettings from './AdminSettings';

interface AdminDashboardProps {
  onLogout: () => void;
}

type Tab = 'generate' | 'drafts' | 'stats' | 'settings';

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('generate');

  const tabs = [
    { id: 'generate' as Tab, label: 'Generate Content', icon: '✨' },
    { id: 'drafts' as Tab, label: 'Drafts', icon: '📝' },
    { id: 'stats' as Tab, label: 'Statistics', icon: '📊' },
    { id: 'settings' as Tab, label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Content Admin</h1>
            <div className="flex items-center gap-4">
              <a
                href="/studio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Open Sanity Studio →
              </a>
              <button
                onClick={onLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'generate' && <ContentGenerator />}
        {activeTab === 'drafts' && <DraftManager />}
        {activeTab === 'stats' && <AdminStats />}
        {activeTab === 'settings' && <AdminSettings />}
      </main>
    </div>
  );
}

