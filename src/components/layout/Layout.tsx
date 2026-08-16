import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight text-blue-400">GM NEXUS</h1>
        <nav>
          <ul className="flex space-x-6">
            <li><a href="#" className="hover:text-blue-400 transition-colors">Campaigns</a></li>
            <li><a href="#" className="hover:text-blue-400 transition-colors">Settings</a></li>
          </ul>
        </nav>
      </header>
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
      <footer className="bg-gray-800 border-t border-gray-700 p-2 text-center text-xs text-gray-500">
        GM Nexus Foundation v0.1.0
      </footer>
    </div>
  );
};

export default Layout;
