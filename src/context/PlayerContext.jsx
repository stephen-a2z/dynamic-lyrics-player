import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { parseLyricsFile } from '../utils/lyricsParser'; // 确保引入

// Create context
const PlayerContext = createContext();

// Custom hook for using the player context
export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
};

// Provider component for player state
export const PlayerProvider = ({ children }) => {
  // Audio state
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Refs
  const audioRef = useRef(null);
  
  // Lyrics state
  const [lyrics, setLyrics] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  
  // Audio analysis
  const [analyzerNode, setAnalyzerNode] = useState(null);
  const [previousAudioData, setPreviousAudioData] = useState(null);
  
  // Reset player state
  const resetPlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setAudioUrl('');
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setLyrics([]);
  };

  // Bullet Screen Mode
  const [bulletModeEnabled, setBulletModeEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 新增加载状态

  // 加载默认播放列表
  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${import.meta.env.BASE_URL}example/playlist.json`); // 确保路径正确
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPlaylist(data);
        if (data.length > 0) {
          // 自动加载第一首歌曲
          await loadTrack(0, data); 
        }
      } catch (error) {
        console.error("Could not fetch playlist:", error);
        setPlaylist([]); // 出错时设置为空播放列表
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylist();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依赖数组确保只在挂载时运行

  // 加载指定索引的曲目
  const loadTrack = async (index, currentPlaylist = playlist) => {
    if (index < 0 || index >= currentPlaylist.length) {
      console.warn(`Attempted to load track with invalid index: ${index}`);
      return;
    }

    const track = currentPlaylist[index];
    if (!track || !track.audio) {
        console.error("Track data is invalid or missing audio URL:", track);
        setLyrics([{ time: 0, text: "Error: Invalid track data." }]);
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    try {
      // 设置音频 URL
      setAudioUrl(`${import.meta.env.BASE_URL}${track.audio.startsWith('/') ? track.audio.substring(1) : track.audio}`);
      setCurrentTrackIndex(index);
      setIsPlaying(false); // 切换歌曲时暂停播放
      setCurrentTime(0); // 重置当前播放时间
      if (audioRef.current) {
        audioRef.current.currentTime = 0; // 确保 audio 元素时间也重置
      }

      // 加载歌词文件
      if (track.lyrics) {
        const lyricsResponse = await fetch(`${import.meta.env.BASE_URL}${track.lyrics.startsWith('/') ? track.lyrics.substring(1) : track.lyrics}`);
        if (!lyricsResponse.ok) {
          throw new Error(`HTTP error! status: ${lyricsResponse.status} for lyrics ${track.lyrics}`);
        }
        const lyricsText = await lyricsResponse.text();
        const parsed = parseLyricsFile(lyricsText, track.lyrics.split('/').pop());
        setLyrics(parsed);
      } else {
        setLyrics([]); // 如果没有歌词文件，则清空歌词
      }
    } catch (error) {
      console.error(`Error loading track ${track.title}:`, error);
      setLyrics([{ time: 0, text: "Error loading lyrics for this song." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    // Audio state
    audioUrl,
    setAudioUrl,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    
    // Refs
    audioRef,
    
    // Lyrics state
    lyrics,
    setLyrics,
    
    // Audio analysis
    analyzerNode,
    setAnalyzerNode,
    previousAudioData,
    setPreviousAudioData,
    
    // Bullet Screen Mode
    bulletModeEnabled,
    setBulletModeEnabled,
    
    // Actions
    resetPlayer,
    // Playlist and track loading
    playlist,
    setPlaylist, // Exposed for FileUploader
    currentTrackIndex,
    setCurrentTrackIndex, // Exposed for FileUploader
    loadTrack,
    isLoading
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};