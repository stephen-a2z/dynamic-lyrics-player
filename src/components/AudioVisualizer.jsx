import { useRef, useEffect } from 'react';
import { usePlayerContext } from '../context/PlayerContext';
import { getAverageFrequency, getPeaks } from '../utils/audioAnalyzer';

function AudioVisualizer() {
  const { analyzerNode, isPlaying, audioRef } = usePlayerContext();
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyzerNode) return;

    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };

    // Set initial size
    resize();
    
    // Handle window resize
    window.addEventListener('resize', resize);

    // Animation function to draw the visualizer
    const animate = () => {
      if (!analyzerNode || !isPlaying) return;
      
      // Get frequency data from analyzer
      const bufferLength = analyzerNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyzerNode.getByteFrequencyData(dataArray);
      
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate visual metrics
      const avgFreq = getAverageFrequency(dataArray);
      const peaks = getPeaks(dataArray, 3);
      
      // Determine styles based on audio analysis
      const intensity = avgFreq / 255;
      const barWidth = canvas.width / bufferLength * 2.5;
      const barSpacing = 1;
      const baseColor = [96, 165, 250]; // blue-400
      const peakColor = [139, 92, 246]; // violet-500
      
      // Draw bars
      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        const percent = value / 255;
        const height = percent * canvas.height * 0.9;
        
        // Calculate bar position
        const x = i * (barWidth + barSpacing);
        const y = canvas.height - height;
        
        // Determine if this frequency is a peak
        const isPeak = peaks.includes(i);
        
        // Set gradient color based on frequency value
        const r = isPeak ? peakColor[0] : baseColor[0];
        const g = isPeak ? peakColor[1] : baseColor[1];
        const b = isPeak ? peakColor[2] : baseColor[2];
        
        const alpha = 0.5 + percent * 0.5;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        
        // Draw the bar
        ctx.fillRect(x, y, barWidth, height);
        
        // Add glow effect for peaks
        if (isPeak) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
          ctx.fillRect(x, y, barWidth, height);
          ctx.shadowBlur = 0;
        }
      }
      
      // Draw circular visualization in the center
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(canvas.width, canvas.height) * 0.2;
      
      ctx.beginPath();
      const radius = maxRadius * intensity;
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius
      );
      gradient.addColorStop(0, `rgba(79, 70, 229, ${intensity})`); // indigo-600
      gradient.addColorStop(1, `rgba(16, 185, 129, ${intensity * 0.7})`); // emerald-500
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Add outer glow
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
      ctx.shadowBlur = 20;
      ctx.shadowColor = `rgba(79, 70, 229, ${intensity * 0.5})`;
      ctx.strokeStyle = `rgba(79, 70, 229, ${intensity * 0.3})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation when playing, stop when not playing
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyzerNode, isPlaying, audioRef]);

  useEffect(() => {
    // Manage animation based on playback state
    if (isPlaying) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(function animate() {
        if (!canvasRef.current || !analyzerNode) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Get frequency data from analyzer
        const bufferLength = analyzerNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyzerNode.getByteFrequencyData(dataArray);
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw visualization
        const barWidth = canvas.width / bufferLength * 2.5;
        const barSpacing = 1;
        
        for (let i = 0; i < bufferLength; i++) {
          const value = dataArray[i];
          const percent = value / 255;
          const height = percent * canvas.height * 0.9;
          
          const x = i * (barWidth + barSpacing);
          const y = canvas.height - height;
          
          // Color based on frequency
          const hue = 220 + (i / bufferLength * 60); // Blue to purple spectrum
          ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${0.5 + percent * 0.5})`;
          
          // Draw bar
          ctx.fillRect(x, y, barWidth, height);
        }
        
        // Draw center circle
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const avgFreq = getAverageFrequency(dataArray);
        const intensity = avgFreq / 255;
        const radius = Math.min(canvas.width, canvas.height) * 0.2 * intensity;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, radius
        );
        gradient.addColorStop(0, `rgba(79, 70, 229, ${intensity})`);
        gradient.addColorStop(1, `rgba(16, 185, 129, ${intensity * 0.7})`);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Continue animation
        animationRef.current = requestAnimationFrame(animate);
      });
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, analyzerNode]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full bg-transparent"
    />
  );
}

export default AudioVisualizer;