/**
 * Utilities for parsing and synchronizing lyrics files
 */

/**
 * Parse LRC format lyrics file
 * 
 * @param {string} lrcContent - Content of the LRC file
 * @returns {Array} - Array of objects with time (seconds) and text
 */
const parseLRCFormat = (lrcContent) => {
  // Regular expression to match time tags in LRC format [mm:ss.xx]
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2})\]/g;
  
  const lines = lrcContent.split('\n').filter(line => line.trim() !== '');
  const result = [];
  
  lines.forEach(line => {
    // Skip metadata lines that start with [ar], [al], [ti], etc.
    if (/^\[(ar|al|ti|by|offset|re|ve):/i.test(line)) {
      return;
    }
    
    // Extract all time tags from the line
    const timeTags = [];
    let match;
    let text = line;
    
    while ((match = timeRegex.exec(line)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const hundredths = parseInt(match[3], 10);
      const timeInSeconds = minutes * 60 + seconds + hundredths / 100;
      
      timeTags.push({
        time: timeInSeconds,
        index: match.index,
        length: match[0].length
      });
    }
    
    // Extract text part (after all time tags)
    if (timeTags.length > 0) {
      // Sort by position in string
      timeTags.sort((a, b) => a.index - b.index);
      
      // Get text after the last time tag
      const lastTag = timeTags[timeTags.length - 1];
      text = line.substring(lastTag.index + lastTag.length).trim();
      
      // Create an entry for each time tag
      timeTags.forEach(tag => {
        result.push({
          time: tag.time,
          text: text
        });
      });
    }
  });
  
  // Sort by time
  result.sort((a, b) => a.time - b.time);
  
  return result;
};

/**
 * Parse simple text format with timestamps like [MM:SS] or [MM:SS.xx]
 * 
 * @param {string} textContent - Content of the text file
 * @returns {Array} - Array of objects with time (seconds) and text
 */
const parseSimpleTextFormat = (textContent) => {
  // Regular expression to match simple time formats [mm:ss] or [mm:ss.xx]
  const timeRegex = /\[(\d+):(\d+)(?:\.(\d+))?\]/;
  
  const lines = textContent.split('\n').filter(line => line.trim() !== '');
  const result = [];
  
  lines.forEach(line => {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const hundredths = match[3] ? parseInt(match[3], 10) : 0;
      
      const timeInSeconds = minutes * 60 + seconds + hundredths / 100;
      const text = line.substring(match.index + match[0].length).trim();
      
      result.push({
        time: timeInSeconds,
        text: text
      });
    }
  });
  
  // Sort by time
  result.sort((a, b) => a.time - b.time);
  
  return result;
};

/**
 * Parse a lyrics file - detects format based on extension or content
 * 
 * @param {string} fileContent - Content of the lyrics file
 * @param {string} fileName - Name of the file (for extension detection)
 * @returns {Array} - Array of objects with time (seconds) and text
 */
export const parseLyricsFile = (fileContent, fileName) => {
  if (!fileContent) return [];
  
  // Try to detect format based on file extension
  const isLrcFile = fileName.toLowerCase().endsWith('.lrc');
  
  // Count LRC time tags to determine format
  const lrcTimeTagCount = (fileContent.match(/\[\d{2}:\d{2}\.\d{2}\]/g) || []).length;
  
  // Count simple time tags
  const simpleTimeTagCount = (fileContent.match(/\[\d+:\d+(?:\.\d+)?\]/g) || []).length;
  
  // Determine the format to use
  let parsedLyrics = [];
  
  if (isLrcFile || lrcTimeTagCount > simpleTimeTagCount) {
    parsedLyrics = parseLRCFormat(fileContent);
  } else {
    parsedLyrics = parseSimpleTextFormat(fileContent);
  }
  
  // If no valid lyrics found, create a simple placeholder lyric
  if (parsedLyrics.length === 0) {
    parsedLyrics = [{ time: 0, text: "No synchronized lyrics available" }];
  }
  
  return parsedLyrics;
};

/**
 * Generate time-synchronized lyrics for a text without timestamps
 * 
 * @param {string} plainText - Plain lyrics text without timestamps
 * @param {number} duration - Audio duration in seconds
 * @returns {Array} - Array of objects with time (seconds) and text
 */
export const generateTimedLyrics = (plainText, duration) => {
  if (!plainText || duration <= 0) return [];
  
  const lines = plainText.split('\n').filter(line => line.trim() !== '');
  const result = [];
  
  // Distribute lines evenly across the duration
  const timeStep = duration / (lines.length + 1);
  
  lines.forEach((line, index) => {
    result.push({
      time: timeStep * (index + 1),
      text: line.trim()
    });
  });
  
  return result;
};