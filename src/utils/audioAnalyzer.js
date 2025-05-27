/**
 * Audio analysis utilities for visualization and effects
 */

/**
 * Get the average frequency value from a frequency data array
 * 
 * @param {Uint8Array} dataArray - Audio frequency data array
 * @returns {number} - Average value between 0-255
 */
export const getAverageFrequency = (dataArray) => {
  if (!dataArray || dataArray.length === 0) return 0;
  
  const sum = dataArray.reduce((acc, value) => acc + value, 0);
  return sum / dataArray.length || 0;
};

/**
 * Get the top N peak frequencies from a frequency data array
 * 
 * @param {Uint8Array} dataArray - Audio frequency data array
 * @param {number} count - Number of peaks to detect
 * @returns {number[]} - Array of indices with peak values
 */
export const getPeaks = (dataArray, count = 3) => {
  if (!dataArray || dataArray.length === 0) return [];
  
  // Create array of [index, value] pairs
  const indexedData = dataArray.map((value, index) => [index, value]);
  
  // Sort by value descending
  indexedData.sort((a, b) => b[1] - a[1]);
  
  // Extract top N indices
  const topIndices = indexedData.slice(0, count).map(pair => pair[0]);
  
  return topIndices;
};

/**
 * Analyze the rhythm profile of the audio
 * 
 * @param {Uint8Array} dataArray - Audio frequency data array
 * @returns {Object} - Rhythm analysis results
 */
export const analyzeRhythm = (dataArray) => {
  if (!dataArray || dataArray.length === 0) {
    return {
      bassIntensity: 0,
      midIntensity: 0,
      trebleIntensity: 0,
      overall: 0
    };
  }
  
  const bufferLength = dataArray.length;
  
  // Divide frequency spectrum into bass, mid, and treble ranges
  const bassRange = Math.floor(bufferLength / 5); // Lower fifth - bass
  const midRange = Math.floor(bufferLength / 2); // Middle - vocals/mids
  
  // Calculate intensities for different frequency ranges
  const bassValues = dataArray.slice(0, bassRange);
  const midValues = dataArray.slice(bassRange, midRange);
  const trebleValues = dataArray.slice(midRange);
  
  const bassIntensity = getAverageFrequency(bassValues) / 255;
  const midIntensity = getAverageFrequency(midValues) / 255;
  const trebleIntensity = getAverageFrequency(trebleValues) / 255;
  const overall = getAverageFrequency(dataArray) / 255;
  
  return {
    bassIntensity,
    midIntensity,
    trebleIntensity,
    overall
  };
};

/**
 * Detect energy change in audio for beat detection
 * 
 * @param {Uint8Array} currentData - Current audio data
 * @param {Uint8Array} previousData - Previous frame's audio data
 * @param {number} threshold - Energy change threshold (0-1)
 * @returns {boolean} - True if beat detected
 */
export const detectBeat = (currentData, previousData, threshold = 0.15) => {
  if (!currentData || !previousData || currentData.length !== previousData.length) {
    return false;
  }
  
  // Focus on bass frequencies for beat detection
  const bassRange = Math.floor(currentData.length / 5);
  const currentBass = currentData.slice(0, bassRange);
  const previousBass = previousData.slice(0, bassRange);
  
  // Calculate energy change
  let energyChange = 0;
  for (let i = 0; i < bassRange; i++) {
    energyChange += Math.abs(currentBass[i] - previousBass[i]);
  }
  
  energyChange = energyChange / (bassRange * 255); // Normalize to 0-1
  
  return energyChange > threshold;
};