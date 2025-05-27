import { useState, useEffect, useRef } from 'react';
import { usePlayerContext } from '../context/PlayerContext';

function LyricsDisplay() {
  const { 
    lyrics, 
    currentTime, 
    isPlaying, 
    analyzerNode 
  } = usePlayerContext();
  
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [audioIntensity, setAudioIntensity] = useState(0);
  const [rhythmFactor, setRhythmFactor] = useState(1);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  
  // Find current lyric based on timestamp
  useEffect(() => {
    if (!lyrics || lyrics.length === 0) return;
    
    const index = lyrics.findIndex((lyric, idx) => {
      const nextLyric = lyrics[idx + 1];
      return (
        currentTime >= lyric.time &&
        (!nextLyric || currentTime < nextLyric.time)
      );
    });
    
    if (index !== -1 && index !== currentLyricIndex) {
      setCurrentLyricIndex(index);
      
      // Scroll to current lyric
      if (containerRef.current) {
        const lyricElement = containerRef.current.querySelector(`[data-index="${index}"]`);
        if (lyricElement) {
          lyricElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }
  }, [lyrics, currentTime, currentLyricIndex]);
  
  // Analyze audio for visualization effects
  useEffect(() => {
    if (!analyzerNode || !isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }
    
    const analyzeAudio = () => {
      const bufferLength = analyzerNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyzerNode.getByteFrequencyData(dataArray);
      
      // Calculate audio intensity for visual effects
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength / 255; // Normalize to 0-1
      
      setAudioIntensity(avg);
      
      // Detect rhythm changes for size pulsing
      const bassIntensity = dataArray.slice(0, Math.floor(bufferLength / 8))
        .reduce((sum, val) => sum + val, 0) / Math.floor(bufferLength / 8) / 255;
        
      setRhythmFactor(1 + bassIntensity * 0.4); // Scale factor for text size
      
      animationRef.current = requestAnimationFrame(analyzeAudio);
    };
    
    analyzeAudio();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyzerNode, isPlaying]);

  // If no lyrics, show upload prompt
  if (!lyrics || lyrics.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-blue-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <p>Upload a lyrics file to see synchronized lyrics</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-3 text-cyan-300">Lyrics</h2>
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-4 px-2 py-4"
      >
        {lyrics.map((lyric, index) => {
          const isActive = index === currentLyricIndex;
          
          // Calculate style based on audio analysis
          let dynamicStyle = {};
          if (isActive) {
            const baseFontSize = 1.2; // Base size in rem
            const sizeMultiplier = isPlaying ? rhythmFactor : 1;
            dynamicStyle = {
              fontSize: `${baseFontSize * sizeMultiplier}rem`,
              opacity: 0.7 + audioIntensity * 0.3,
              textShadow: `0 0 ${10 * audioIntensity}px rgba(96, 165, 250, ${audioIntensity * 0.8})`,
              transform: isPlaying ? `scale(${0.95 + (audioIntensity * 0.1)})` : 'scale(1)',
            };
          }
          
          return (
            <div
              key={index}
              data-index={index}
              className={`transition-all duration-200 ease-in-out ${
                isActive
                  ? 'text-cyan-300 font-medium'
                  : index < currentLyricIndex
                  ? 'text-blue-500/50'
                  : 'text-blue-400/70'
              }`}
              style={dynamicStyle}
            >
              {lyric.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LyricsDisplay;