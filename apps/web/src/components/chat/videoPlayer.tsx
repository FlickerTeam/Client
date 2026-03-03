import './videoPlayer.css';

import { useEffect, useRef, useState } from 'react';

import { useMenuOverlay } from '@/layering/menuOverlayStore';

export const VideoPlayer = ({
  src,
  width,
  height,
}: {
  src: string;
  width: number;
  height: number;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { openContextMenu, closeContextMenu } = useMenuOverlay();
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const lastVolumeRef = useRef(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        void videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (volume > 0) {
        lastVolumeRef.current = volume;
        setVolume(0);
        videoRef.current.volume = 0;
      } else {
        const restoredVolume = lastVolumeRef.current > 0 ? lastVolumeRef.current : 0.5;
        setVolume(restoredVolume);
        videoRef.current.volume = restoredVolume;
      }
    }
  };

  const handleScrub = (
    e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (!progressBarRef.current || !videoRef.current || duration === 0) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    let clickX: number;

    if ('clientX' in e) {
      clickX = e.clientX - rect.left;
    } else {
      if (e.key === 'Home') {
        clickX = 0;
      } else if (e.key === 'End') {
        clickX = rect.width;
      } else return;
    }

    const newTime = (clickX / rect.width) * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins)}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (currentTime / duration) * 100 || 0;
  const filename = src.split('/').pop()?.split('?')[0] ?? 'Video';

  const handleVideoPlayerContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();

    openContextMenu(
      e.clientX,
      e.clientY,
      <div className='context-menu-out guild-context-menu'>
        <button type='button' className='button' onClick={toggleMute}>
          {volume === 0 ? 'Unmute' : 'Mute'}
        </button>
        <hr />
        <button
          type='button'
          className='button'
          onClick={() => {
            closeContextMenu();
            void navigator.clipboard.writeText(src);
          }}
        >
          Copy Link
        </button>
        <button
          type='button'
          className='button'
          onClick={() => {
            closeContextMenu();
            void navigator.clipboard.writeText(filename);
          }}
        >
          Copy Filename
        </button>
      </div>,
    );
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      void containerRef.current.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.readyState >= 1) {
      setDuration(video.duration);
    }
  }, []);

  const MAX_FILENAME_LENGTH = 40;

  return (
    <div
      className='video-player-container'
      style={{
        width: `${String(width)}px`,
        height: `${String(height)}px`,
        position: 'relative',
        overflow: 'hidden',
      }}
      ref={containerRef}
      onContextMenu={handleVideoPlayerContextMenu}
    >
      <div className='video-details'>
        <div className='video-details-inner'>
          <h1>
            {filename.length > MAX_FILENAME_LENGTH
              ? filename.substring(0, MAX_FILENAME_LENGTH) + '...'
              : filename}
          </h1>
          <button type='button' className='icon-btn' onClick={() => window.open(src)}>
            <span className='material-symbols-rounded'>download</span>
          </button>
        </div>
      </div>
      {}
      <video
        ref={videoRef}
        src={src}
        className='chat-video-element'
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleLoadedMetadata}
        onEnded={handleEnded}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      >
        <track kind='captions' />
      </video>

      {!isPlaying && (
        <button type='button' className='center-play-button' onClick={togglePlay}>
          <span className='material-symbols-rounded'>play_arrow</span>
        </button>
      )}

      <div className='video-controls-toolbar'>
        <div
          className='progress-bar-wrapper'
          onClick={handleScrub}
          onKeyDown={handleScrub}
          ref={progressBarRef}
          role='slider'
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          tabIndex={0}
        >
          <div className='progress-bar-container'>
            <div className='progress-bar-fill' style={{ width: `${String(progress)}%` }} />
          </div>
        </div>

        <div className='toolbar-content'>
          <div className='toolbar-left'>
            <button type='button' className='icon-btn' onClick={togglePlay}>
              <span className='material-symbols-rounded'>{isPlaying ? 'pause' : 'play_arrow'}</span>
            </button>
            <div className='time-display'>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className='toolbar-right'>
            <div className='volume-control-wrapper'>
              <div className='volume-slider-container'>
                <input
                  type='range'
                  min='0'
                  max='1'
                  step='0.05'
                  value={volume}
                  onChange={handleVolumeChange}
                  className='volume-slider'
                  aria-label='Volume'
                />
              </div>
              <button type='button' className='icon-btn' onClick={toggleMute}>
                <span className='material-symbols-rounded'>
                  {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
                </span>
              </button>
            </div>
            <button type='button' className='icon-btn' onClick={handleFullscreen}>
              <span className='material-symbols-rounded'>fullscreen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
