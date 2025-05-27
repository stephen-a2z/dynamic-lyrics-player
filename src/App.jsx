import { useState, useEffect } from 'react';
import { PlayerProvider } from './context/PlayerContext';
import MusicPlayer from './components/MusicPlayer';
import FileUploader from './components/FileUploader';
import LyricsDisplay from './components/LyricsDisplay';
import AudioVisualizer from './components/AudioVisualizer';
import BulletScreenMode from './components/BulletScreenMode';

function App() {
  const [showUploader, setShowUploader] = useState(true);

  return (
    <PlayerProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 text-blue-50 flex flex-col">
        <BulletScreenMode />
        {/* Header */}
        <header className="p-4 border-b border-blue-700/30">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-indigo-300">
              Sonic Wave
            </h1>
            <button 
              onClick={() => setShowUploader(!showUploader)}
              className="px-4 py-2 rounded-md bg-blue-700/20 hover:bg-blue-700/30 border border-blue-600/50 backdrop-blur-sm transition-all duration-300"
            >
              {showUploader ? 'Hide Uploader' : 'Upload Music'}
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File uploader section - conditionally displayed */}
          {showUploader && (
            <div className="lg:col-span-1 p-6 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-blue-700/30">
              <FileUploader />
            </div>
          )}

          {/* Player and visualization section */}
          <div className={`${showUploader ? 'lg:col-span-2' : 'lg:col-span-3'} flex flex-col gap-6`}>
            {/* Audio visualizer */}
            <div className="h-48 md:h-64 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-blue-700/30 overflow-hidden">
              <AudioVisualizer />
            </div>
            
            {/* Music player controls */}
            <div className="rounded-xl bg-slate-800/50 backdrop-blur-sm border border-blue-700/30 p-6">
              <MusicPlayer />
            </div>
            
            {/* Lyrics display */}
            <div className="flex-1 min-h-[300px] rounded-xl bg-slate-800/50 backdrop-blur-sm border border-blue-700/30 p-6 overflow-hidden">
              <LyricsDisplay />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 border-t border-blue-700/30 bg-slate-900/80 backdrop-blur-sm">
          <div className="container mx-auto text-center text-sm text-blue-400">
            <p>© 2023 Sonic Wave | Interactive Music Player with Dynamic Lyrics Visualization</p>
          </div>
        </footer>
      </div>
    </PlayerProvider>
  );
}

export default App;