import React from 'react';

interface ModelLoadProgress {
  name: string;
  loaded: boolean;
  error?: string;
}

interface EnhancedLoadingScreenProps {
  message: string;
  progress: number;
  models: ModelLoadProgress[];
}

const EnhancedLoadingScreen: React.FC<EnhancedLoadingScreenProps> = ({ 
  message, 
  progress, 
  models 
}) => {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Main Logo/Icon */}
        <div className="mb-8">
          <div className="relative w-24 h-24 mx-auto">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 border-4 border-sky-500/30 rounded-full animate-spin"></div>
            {/* Inner pulsing circle */}
            <div className="absolute inset-2 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full animate-pulse flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
              </svg>
            </div>
            {/* Progress ring */}
            <svg className="absolute inset-0 w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="44"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-slate-700"
              />
              <circle
                cx="48"
                cy="48"
                r="44"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                className="text-sky-400 transition-all duration-500 ease-out"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Main message */}
        <h2 className="text-2xl font-bold text-sky-400 mb-2">AI Vision Suite</h2>
        <p className="text-lg text-slate-300 mb-6">{message}</p>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Loading AI Models</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Model loading status */}
        <div className="space-y-2">
          {models.map((model, index) => (
            <div key={model.name} className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{model.name}</span>
              <div className="flex items-center">
                {model.error ? (
                  <span className="text-red-400 text-xs">❌ Error</span>
                ) : model.loaded ? (
                  <span className="text-green-400 text-xs">✅ Loaded</span>
                ) : (
                  <div className="flex items-center">
                    <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-sky-400 text-xs">Loading...</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Loading tips */}
        <div className="mt-8 p-4 bg-slate-800/50 rounded-lg">
          <p className="text-xs text-slate-400 leading-relaxed">
            💡 <strong>First-time setup:</strong> AI models are being downloaded and cached. 
            This may take a few moments depending on your connection speed. 
            Subsequent loads will be much faster!
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex justify-center space-x-1 mt-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnhancedLoadingScreen;
