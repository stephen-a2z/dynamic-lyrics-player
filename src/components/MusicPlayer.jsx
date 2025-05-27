import { useState, useEffect, useRef } from 'react';
import { usePlayerContext } from '../context/PlayerContext';

function MusicPlayer() {
  const { 
    audioUrl, 
    isPlaying, 
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    audioRef,
    analyzerNode,
    setAnalyzerNode,
    bulletModeEnabled,
    setBulletModeEnabled
  } = usePlayerContext();
  
  const [volume, setVolume] = useState(0.7);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      // Create audio context and analyzer on first load
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
        
        // Create analyzer node
        const analyzer = audioContextRef.current.createAnalyser();
        analyzer.fftSize = 256;
        analyzer.smoothingTimeConstant = 0.7;
        setAnalyzerNode(analyzer);
        
        // Connect source to analyzer and then to destination
        const source = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceNodeRef.current = source;
        source.connect(analyzer);
        analyzer.connect(audioContextRef.current.destination);
      }

      // Set initial volume
      audioRef.current.volume = volume;
    }
    
    return () => {
      // Cleanup if needed
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
    };
  }, [audioUrl, audioRef]);

  // Toggle play/pause
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Resume or start audio context if it's suspended
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume();
        }
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Handle seeking
  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Format time in MM:SS
  const formatTime = (time) => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle audio loaded metadata
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Handle audio ended
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center h-16">
        {!audioUrl ? (
          <span className="text-blue-300">Upload a music file to start playing</span>
        ) : (
          <div className="flex flex-col w-full">
            <div className="flex justify-between mb-1">
              <span className="text-cyan-300 text-sm">{formatTime(currentTime)}</span>
              <span className="text-blue-300 text-sm">{formatTime(duration)}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max={duration || 0} 
              value={currentTime} 
              onChange={handleSeek}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700"
              style={{
                background: `linear-gradient(to right, #60a5fa ${(currentTime / duration) * 100}%, #1e293b ${(currentTime / duration) * 100}%)`
              }}
            />
          </div>
        )}
      </div>
      
      {/* Audio element */}
      <audio 
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="auto"
      />
      
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {/* Play/Pause Button */}
          <button 
            onClick={togglePlay} 
            disabled={!audioUrl}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              !audioUrl ? 'bg-blue-900/30 text-blue-700' : 'bg-blue-600 hover:bg-blue-500 text-white'
            } transition-all duration-300`}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          
          {/* Bullet Screen Mode Toggle Button */}
          {audioUrl && (
            <button
              onClick={() => setBulletModeEnabled(!bulletModeEnabled)}
              className={`ml-3 px-3 py-2 rounded-md flex items-center ${bulletModeEnabled ? 'bg-purple-600 text-white' : 'bg-blue-700/30 text-blue-300'} hover:bg-blue-700/50 transition-all duration-300`}
              title="Toggle Bullet Screen Mode"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              弹幕轰炸
            </button>
          )}
        </div>
        
        {/* Volume Control */}
        <div className="flex items-center space-x-2 w-32">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume} 
            onChange={handleVolumeChange}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700"
            style={{
              background: `linear-gradient(to right, #60a5fa ${volume * 100}%, #1e293b ${volume * 100}%)`
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default MusicPlayer;