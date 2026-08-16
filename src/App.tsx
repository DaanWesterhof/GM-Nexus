import { useEffect, useState } from "react";
import "./App.css";
import { initializeDatabase } from "./services/database";

import { AppProvider } from "./store/AppContext";
import AppContent from "./AppContent";

function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeDatabase()
      .then(() => setDbInitialized(true))
      .catch((err) => {
        console.error("Database initialization failed:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Failed to initialize database: ${errorMessage}. Please check if the application has correct permissions.`);
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500 p-6 rounded-lg max-w-md w-full">
          <h1 className="text-xl font-bold mb-4 text-red-400">Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!dbInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Initializing GM Nexus...</p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
