import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePlayerContext } from '../context/PlayerContext';

const BulletScreenMode = () => {
  const { 
    lyrics, 
    currentTime, 
    isPlaying, 
    analyzerNode,
    bulletModeEnabled,
    setBulletModeEnabled
  } = usePlayerContext();

  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [audioIntensity, setAudioIntensity] = useState(0);
  const [bassIntensity, setBassIntensity] = useState(0);
  const [midIntensity, setMidIntensity] = useState(0);
  const [highIntensity, setHighIntensity] = useState(0);

  // New state to manage individual character animation states
  const [charAnimations, setCharAnimations] = useState({});
  const [charColors, setCharColors] = useState({}); // 新增状态存储字符颜色
  const [activeCharIndex, setActiveCharIndex] = useState(-1);

  // Find current lyric based on timestamp
  useEffect(() => {
    if (!lyrics || lyrics.length === 0) {
      setCurrentLyricIndex(-1);
      setActiveCharIndex(-1);
      setCharAnimations({});
      return;
    }
    
    const index = lyrics.findIndex((lyric, idx) => {
      const nextLyric = lyrics[idx + 1];
      return (
        currentTime >= lyric.time &&
        (!nextLyric || currentTime < nextLyric.time)
      );
    });
    
    if (index !== -1 && index !== currentLyricIndex) {
      setCurrentLyricIndex(index);
      setActiveCharIndex(0); // Start animation for the first char of the new lyric
      setCharAnimations({}); // Reset animations for the new lyric line
      setCharColors({}); // Reset colors for the new lyric line
    }
  }, [lyrics, currentTime, currentLyricIndex]);

  // Analyze audio for visualization effects
  useEffect(() => {
    if (!analyzerNode || !isPlaying || !bulletModeEnabled) {
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
      
      // Calculate audio intensity for different frequency ranges
      const bassRange = Math.floor(bufferLength / 8);
      const midRange = Math.floor(bufferLength / 2);
      
      // Bass (low frequencies)
      let bassSum = 0;
      for (let i = 0; i < bassRange; i++) {
        bassSum += dataArray[i];
      }
      const bassAvg = bassSum / bassRange / 255;
      setBassIntensity(bassAvg);
      
      // Mid frequencies
      let midSum = 0;
      for (let i = bassRange; i < midRange; i++) {
        midSum += dataArray[i];
      }
      const midAvg = midSum / (midRange - bassRange) / 255;
      setMidIntensity(midAvg);
      
      // High frequencies
      let highSum = 0;
      for (let i = midRange; i < bufferLength; i++) {
        highSum += dataArray[i];
      }
      const highAvg = highSum / (bufferLength - midRange) / 255;
      setHighIntensity(highAvg);
      
      // Overall intensity
      let totalSum = 0;
      for (let i = 0; i < bufferLength; i++) {
        totalSum += dataArray[i];
      }
      const totalAvg = totalSum / bufferLength / 255;
      setAudioIntensity(totalAvg);
      
      animationRef.current = requestAnimationFrame(analyzeAudio);
    };
    
    analyzeAudio();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyzerNode, isPlaying, bulletModeEnabled]);

  const currentLyric = lyrics[currentLyricIndex]?.text || "";
  const isChineseOrJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(currentLyric);
  
  const textUnits = useMemo(() => isChineseOrJapanese 
    ? currentLyric.split('') 
    : currentLyric.split(/\s+/).filter(unit => unit.trim() !== ''), 
  [currentLyric, isChineseOrJapanese]);

  // Effect to handle character-by-character animation timing
  useEffect(() => {
    if (!bulletModeEnabled || !isPlaying || activeCharIndex === -1 || activeCharIndex >= textUnits.length) {
      return;
    }

    // Duration for each character to be prominent before starting to fade/move
    // This can be adjusted or made dynamic based on lyric length or song tempo
    const charDisplayDuration = 300; // ms, how long each char stays prominent
    const charTransitionDuration = 1500; // ms, how long fade out and move takes

    const timer = setTimeout(() => {
      setCharAnimations(prev => ({
        ...prev,
        [activeCharIndex]: { stage: 'fading', startTime: Date.now() }
      }));
      
      // After a delay for fade/move, mark as 'gone'
      setTimeout(() => {
        setCharAnimations(prev => ({
          ...prev,
          [activeCharIndex]: { stage: 'gone' }
        }));
      }, charTransitionDuration);

      if (activeCharIndex < textUnits.length - 1) {
        setActiveCharIndex(prev => prev + 1);
      } else {
        // Optional: handle end of lyric line (e.g., clear all after a delay)
      }
    }, charDisplayDuration);

    return () => clearTimeout(timer);
  }, [activeCharIndex, textUnits.length, bulletModeEnabled, isPlaying]);

  // Initialize animation for the newly active character
  useEffect(() => {
    if (activeCharIndex !== -1 && activeCharIndex < textUnits.length && !charAnimations[activeCharIndex]) {
      setCharAnimations(prev => {
        // Generate non-overlapping random positions
        // Store occupied slots for fading characters to avoid overlap
        const occupiedSlots = Object.values(prev)
          .filter(anim => anim.stage === 'fading' && anim.randomX !== undefined)
          .map(anim => ({ x: anim.randomX, y: anim.randomY }));

        let newRandomX, newRandomY;
        let attempts = 0;
        const MAX_ATTEMPTS = 50; // Increased attempts for better placement
        const MIN_DISTANCE_VW = 15; // Minimum distance in vw from other fading targets
        const MIN_DISTANCE_VH = 10; // Minimum distance in vh

        do {
          newRandomX = (Math.random() - 0.5) * 80; // Range: -40vw to 40vw
          newRandomY = (Math.random() - 0.5) * 70; // Range: -35vh to 35vh
          attempts++;
          if (attempts > MAX_ATTEMPTS) {
            // Fallback if no good spot found, place it more centrally but still random
            newRandomX = (Math.random() - 0.5) * 20;
            newRandomY = (Math.random() - 0.5) * 20;
            break;
          }
        } while (
          occupiedSlots.some(slot => {
            const dx = Math.abs(newRandomX - slot.x);
            const dy = Math.abs(newRandomY - slot.y);
            // Consider a rectangular area for each character for simplicity
            // This can be refined with actual character dimensions if needed
            return dx < MIN_DISTANCE_VW && dy < MIN_DISTANCE_VH;
          })
        );
        
        return { 
          ...prev,
          [activeCharIndex]: {
            stage: 'entering',
            startTime: Date.now(),
            randomX: newRandomX, // Target X for fading stage
            randomY: newRandomY, // Target Y for fading stage
            randomRotate: (Math.random() - 0.5) * 120, // Increased rotation range
            randomScale: 0.8 + Math.random() * 0.4, // Random scale for fading (0.8 to 1.2)
            entryEffect: Math.floor(Math.random() * 3) // 0: Scale, 1: SlideIn, 2: Pop
          }
        };
      });

      // Assign random color, ensuring it's different from the previous character's color
      setCharColors(prevColors => {
        let newColor;
        const availableColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#2AB7CA', '#F0B67F', '#FE4A49', '#547980', '#8A9B0F', '#CEE741'];
        const lastColor = activeCharIndex > 0 ? prevColors[activeCharIndex - 1] : null;
        do {
          newColor = availableColors[Math.floor(Math.random() * availableColors.length)];
        } while (newColor === lastColor && availableColors.length > 1); // Ensure different color if possible
        return {
          ...prevColors,
          [activeCharIndex]: newColor
        };
      });
    }
  }, [activeCharIndex, textUnits.length]); // Removed charAnimations from dependencies as it's set here and condition !charAnimations[activeCharIndex] handles initialization


  if (!bulletModeEnabled || !lyrics || lyrics.length === 0 || currentLyricIndex === -1) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center overflow-hidden"
      style={{ 
        backdropFilter: `blur(${2 + audioIntensity * 3}px)`,
        perspective: "1000px"
      }}
    >
      <div className="relative w-full h-full">
        {textUnits.map((unit, index) => {
          const animationState = charAnimations[index];
          if (!animationState || animationState.stage === 'gone') return null;

          let dynamicStyle = {};
          const timeSinceStart = animationState.startTime ? Date.now() - animationState.startTime : 0;

          // Base style for all characters
          const baseStyle = {
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            color: charColors[index] || '#FFFFFF', // 应用随机颜色
            fontWeight: 700,
            textAlign: 'center',
            willChange: 'transform, opacity, font-size, z-index',
            // zIndex will be set dynamically based on stage and position
            textShadow: `
              0 0 5px rgba(0, 255, 255, ${0.5 + bassIntensity * 0.5}),
              0 0 10px rgba(0, 255, 255, ${0.3 + bassIntensity * 0.3}),
              0 0 15px rgba(255, 0, 255, ${0.3 + midIntensity * 0.3}),
              0 0 2px #000, 0 0 4px #000
            `,
          };

          if (animationState.stage === 'entering') {
            // Initial prominent display in the center
            const enterProgress = Math.min(timeSinceStart / 300, 1); // 300ms to enter
            dynamicStyle = {
              ...baseStyle,
              // Font size now primarily driven by audioIntensity for entering characters
              fontSize: `${4 + enterProgress * 2 + audioIntensity * 10 + bassIntensity * 3}rem`, 
              opacity: enterProgress * (0.7 + midIntensity * 0.3),
              transform: `translate(-50%, -50%) scale(${0.3 + enterProgress * 0.7 + bassIntensity * 0.3}) rotate(${highIntensity * 10 * (index % 2 === 0 ? 1: -1)}deg)`,
              transition: 'opacity 0.3s ease-out, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), font-size 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              zIndex: 200 + index, // Increment zIndex for each new char to ensure it's on top
            };
            // Apply entry effect based on random value
            switch(animationState.entryEffect) {
              case 1: // SlideIn from random direction
                const slideX = (Math.random() - 0.5) * 50 * (1 - enterProgress);
                const slideY = (Math.random() - 0.5) * 50 * (1 - enterProgress);
                dynamicStyle.transform = `translate(calc(-50% + ${slideX}vw), calc(-50% + ${slideY}vh)) scale(${0.3 + enterProgress * 0.7 + bassIntensity * 0.3}) rotate(${highIntensity * 10 * (index % 2 === 0 ? 1: -1)}deg)`;
                break;
              case 2: // Pop effect
                dynamicStyle.transform = `translate(-50%, -50%) scale(${0.3 + enterProgress * 1.2 + bassIntensity * 0.5}) rotate(${highIntensity * 10 * (index % 2 === 0 ? 1: -1)}deg)`; // Larger pop
                dynamicStyle.transition += ', transform 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)'; // Bouncy transition
                break;
              // case 0 is default scale, already applied
            }

          } else if (animationState.stage === 'fading') {
            // Fading out and moving to a random position
            const fadeProgress = Math.min(timeSinceStart / 1500, 1); // 1500ms to fade and move
            dynamicStyle = {
              ...baseStyle,
              // Fading characters also respond to audio intensity, but less dramatically
              fontSize: `${Math.max(1.5, 8 - fadeProgress * 6 + audioIntensity * 4 + bassIntensity * 2)}rem`, 
              opacity: (1 - fadeProgress) * (0.7 + midIntensity * 0.3),
              transform: `translate(calc(-50% + ${animationState.randomX * fadeProgress}vw), calc(-50% + ${animationState.randomY * fadeProgress}vh)) 
                          scale(${animationState.randomScale * (1 - fadeProgress * 0.5) + bassIntensity * 0.1}) 
                          rotate(${animationState.randomRotate * fadeProgress + highIntensity * 15 * fadeProgress}deg)`,
              transition: 'opacity 1.5s ease-in, transform 1.5s ease-in-out, font-size 1.5s ease-in-out, z-index 0.1s linear',
              zIndex: (() => {
                const currentOffsetX = animationState.randomX * fadeProgress; // vw units
                const currentOffsetY = animationState.randomY * fadeProgress; // vh units (approx)
                // Max possible offset if randomX/Y go up to 45 (approx half screen width/height in vw/vh)
                const maxOffsetMagnitude = Math.sqrt(45**2 + 45**2); 
                const currentOffsetMagnitude = Math.sqrt(currentOffsetX**2 + currentOffsetY**2);
                const normalizedDistance = Math.min(currentOffsetMagnitude / maxOffsetMagnitude, 1); // 0 (center) to 1 (edge)
                return Math.floor(150 - normalizedDistance * 100); // zIndex from 150 (center) down to 50 (edge)
              })(),
            };
          }
          
          return (
            <div 
              key={`${currentLyricIndex}-${index}`}
              style={dynamicStyle}
            >
              {unit}
            </div>
          );
        })}
      </div>

      {/* Close button */}
      <button 
        className="absolute top-4 right-4 z-[60] p-3 rounded-full bg-purple-600/50 hover:bg-purple-600/80 text-white transition-all duration-300"
        onClick={() => setBulletModeEnabled(false)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default BulletScreenMode;