import React, { useState, useCallback } from 'react';
import { usePlayerContext } from '../context/PlayerContext';
import { parseLyricsFile } from '../utils/lyricsParser';

function FileUploader() {
  const {
    playlist,
    currentTrackIndex,
    loadTrack,
    isLoading,
    setPlaylist, // Exposed from PlayerContext
    setAudioUrl, // Exposed from PlayerContext
    setLyrics,   // Exposed from PlayerContext
    setIsPlaying, // Exposed from PlayerContext
    setCurrentTime, // Exposed from PlayerContext
    setCurrentTrackIndex, // Exposed from PlayerContext
    audioRef,
  } = usePlayerContext();

  const [audioFile, setAudioFile] = useState(null);
  const [lyricsFile, setLyricsFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event, type) => {
    const file = event.target.files[0];
    if (type === 'audio') setAudioFile(file);
    if (type === 'lyrics') setLyricsFile(file);
    setUploadStatus(''); // Clear status on new file selection
  };

  const handleDrop = useCallback((event, type) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    if (type === 'audio') setAudioFile(file);
    if (type === 'lyrics') setLyricsFile(file);
    setUploadStatus(''); // Clear status on new file selection
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const processAndPlayFiles = async () => {
    if (!audioFile) {
      setUploadStatus('Please select an audio file.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Processing files...');

    try {
      const newAudioUrl = URL.createObjectURL(audioFile);
      let parsedLyrics = [];

      if (lyricsFile) {
        const lyricsText = await lyricsFile.text();
        parsedLyrics = parseLyricsFile(lyricsText, lyricsFile.name);
      }

      const newTrack = {
        name: audioFile.name.replace(/\.[^/.]+$/, ""),
        artist: 'Uploaded Track',
        audio: newAudioUrl, 
        lyricsContent: parsedLyrics, 
        isLocal: true 
      };

      const updatedPlaylist = [...playlist, newTrack];
      setPlaylist(updatedPlaylist);
      
      const newTrackInternalIndex = updatedPlaylist.length - 1;
      
      setAudioUrl(newTrack.audio);
      setLyrics(newTrack.lyricsContent);
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.load(); // Important to load the new Object URL
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      }
      setIsPlaying(true);
      setCurrentTrackIndex(newTrackInternalIndex); // Update context's current track index

      setUploadStatus(`Successfully loaded: ${audioFile.name}`);
      setAudioFile(null);
      setLyricsFile(null);
    } catch (error) {
      console.error('Error processing files:', error);
      setUploadStatus(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const playTrackFromPlaylist = (index) => {
    const trackToPlay = playlist[index];
    if (trackToPlay.isLocal) {
      setAudioUrl(trackToPlay.audio);
      setLyrics(trackToPlay.lyricsContent || []);
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.load();
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      }
      setIsPlaying(true);
      setCurrentTrackIndex(index);
    } else {
      loadTrack(index); // This is for tracks from playlist.json
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-cyan-300 mb-3">Upload Files</h2>
        <div className="space-y-4">
          <div 
            onDrop={(e) => handleDrop(e, 'audio')}
            onDragOver={handleDragOver}
            className="p-4 border-2 border-dashed border-blue-600/50 rounded-lg text-center cursor-pointer hover:border-blue-500 transition-colors"
          >
            <input type="file" accept="audio/*" onChange={(e) => handleFileChange(e, 'audio')} className="hidden" id="audio-upload" />
            <label htmlFor="audio-upload" className="cursor-pointer w-full block">
              <p className="text-blue-300">Drag & drop audio file or click to select</p>
              {audioFile && <p className="text-sm text-green-400 mt-1">Selected: {audioFile.name}</p>}
            </label>
          </div>

          <div 
            onDrop={(e) => handleDrop(e, 'lyrics')}
            onDragOver={handleDragOver}
            className="p-4 border-2 border-dashed border-blue-600/50 rounded-lg text-center cursor-pointer hover:border-blue-500 transition-colors"
          >
            <input type="file" accept=".lrc,.txt" onChange={(e) => handleFileChange(e, 'lyrics')} className="hidden" id="lyrics-upload" />
            <label htmlFor="lyrics-upload" className="cursor-pointer w-full block">
              <p className="text-blue-300">Drag & drop lyrics file (.lrc, .txt) or click to select</p>
              {lyricsFile && <p className="text-sm text-green-400 mt-1">Selected: {lyricsFile.name}</p>}
            </label>
          </div>

          <button
            onClick={processAndPlayFiles}
            disabled={!audioFile || isUploading}
            className={`w-full py-2 px-4 rounded-md font-semibold transition-colors duration-200 ${
              !audioFile || isUploading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            {isUploading ? 'Processing...' : 'Load & Play Uploaded Files'}
          </button>
          {uploadStatus && <p className={`text-sm mt-2 ${uploadStatus.startsWith('Error:') ? 'text-red-400' : 'text-green-400'}`}>{uploadStatus}</p>}
          <p className="text-xs text-yellow-300/70 mt-2">
            Note: Uploaded files are for the current session only. They are not saved to the server or the default playlist.json file.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-cyan-300 mb-3">Current Playlist</h2>
        {(isLoading && playlist.length === 0) && <div className="text-cyan-300">Loading default playlist...</div>}
        {(!isLoading && playlist.length === 0 && !audioFile) && <div className="text-cyan-300">No playlist loaded. Upload files or check public/example/playlist.json.</div>}
        
        {playlist.length > 0 && (
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {playlist.map((track, index) => (
              <li key={index + (track.name || track.title)}>
                <button
                  onClick={() => playTrackFromPlaylist(index)}
                  disabled={isLoading && currentTrackIndex !== index} // Disable if loading another track
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-200 ${
                    index === currentTrackIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-900/30 hover:bg-blue-800/50 text-blue-200'
                  } ${(isLoading && currentTrackIndex !== index) ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  <span className="font-medium">{track.name || track.title || `Track ${index + 1}`}</span>
                  <span className="block text-xs text-blue-400">
                    {track.artist || 'Unknown Artist'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default FileUploader;