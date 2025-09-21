
import React, { useState, useEffect } from 'react';
import FaceComparisonTab from './components/tabs/FaceComparisonTab';
import AgeEstimationTab from './components/tabs/AgeEstimationTab';
import OcrTab from './components/tabs/OcrTab';
import RealTimeTab from './components/tabs/RealTimeTab';
import RealTimeVerificationTab from './components/tabs/RealTimeVerificationTab';
import { IconFace, IconAge, IconOcr, IconCamera, IconShieldCheck } from './components/ui/Icons';
import { loadModels } from './services/analysisService';
import Spinner from './components/ui/Spinner';

type Tab = 'compare' | 'age' | 'ocr' | 'realtime' | 'verify';

const TABS = {
  compare: {
    label: 'Face Comparison',
    icon: IconFace,
    component: FaceComparisonTab,
  },
  age: {
    label: 'Age Estimation',
    icon: IconAge,
    component: AgeEstimationTab,
  },
  ocr: {
    label: 'OCR Extraction',
    icon: IconOcr,
    component: OcrTab,
  },
  realtime: {
    label: 'Real-Time',
    icon: IconCamera,
    component: RealTimeTab,
  },
  verify: {
    label: 'ID Verification',
    icon: IconShieldCheck,
    component: RealTimeVerificationTab,
  },
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('compare');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading Core AI Models...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApi = async () => {
      try {
        await loadModels(setLoadingMessage);
        setModelsLoaded(true);
      } catch (err) {
        setError('Failed to load AI models. Please refresh the page.');
        console.error(err);
      }
    };
    initializeApi();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-red-400">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Initialization Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!modelsLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sky-400 font-semibold">{loadingMessage}</p>
          <p className="text-sm text-slate-400">This may take a moment...</p>
        </div>
      </div>
    );
  }

  const ActiveComponent = TABS[activeTab].component;

  return (
    <div className="flex flex-col h-screen font-sans bg-slate-900 text-slate-200">
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-sky-400">AI Vision Suite</h1>
            <nav className="flex space-x-1 sm:space-x-2">
              {(Object.keys(TABS) as Tab[]).map((tabKey) => {
                const tab = TABS[tabKey];
                const isActive = activeTab === tabKey;
                return (
                  <button
                    key={tabKey}
                    onClick={() => setActiveTab(tabKey)}
                    className={`flex items-center px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-md'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                     title={tab.label}
                  >
                    <tab.icon className="w-5 h-5 mr-0 sm:mr-2" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
      
      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <ActiveComponent modelsLoaded={modelsLoaded} />
        </div>
      </main>

      <footer className="bg-slate-800/50 border-t border-slate-700 text-center p-2 text-xs text-slate-500">
        <p>AI Vision Suite &copy; 2024. All Rights Reserved. Powered by face-api.js and Tesseract.js.</p>
      </footer>
    </div>
  );
};

export default App;