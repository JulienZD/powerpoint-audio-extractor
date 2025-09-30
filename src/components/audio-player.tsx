import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const AudioPlayer = ({ files }: { files: File[] }) => {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);

  const handleAudioFinish = useCallback(() => {
    if (!autoPlay || files.length === 0) return;
    const currentIndex = files.indexOf(currentFile!);
    const nextIndex = (currentIndex + 1) % files.length;
    setCurrentFile(files[nextIndex]);
  }, [autoPlay, currentFile, files]);

  return (
    <div className="flex flex-col gap-4">
      <div className="self-end">
        <AudioControls autoPlay={autoPlay} setAutoPlay={setAutoPlay} />
      </div>

      <div className="flex flex-row gap-4">
        {/* File List */}
        <div className="flex flex-col gap-1 overflow-y-auto max-h-80 border-gray-300 pr-4 text-nowrap">
          {files.map((file) => (
            <button
              key={file.name}
              onClick={() => setCurrentFile(file)}
              className={`p-2 rounded ${
                currentFile === file ? 'bg-gray-200' : ''
              }`}
            >
              {file.name}
            </button>
          ))}
        </div>

        {/* Audio Player */}
        <div className="flex-1 md:min-w-72">
          {currentFile ? (
            <AudioFilePlayer file={currentFile} onFinish={handleAudioFinish} />
          ) : (
            <p>Select a file to play</p>
          )}
        </div>
      </div>
    </div>
  );
};

const AudioControls = ({
  autoPlay,
  setAutoPlay,
}: {
  autoPlay: boolean;
  setAutoPlay: (value: boolean) => void;
}) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={autoPlay}
          onChange={(e) => setAutoPlay(e.target.checked)}
        />
        <span className="text-sm">Auto-play Next</span>
      </label>
    </div>
  );
};

const PLAYBACK_RATES = [1, 1.25, 1.5, 1.75, 2, 2.5] as const;

const AudioFilePlayer = ({
  file,
  onFinish,
}: {
  file: File;
  onFinish: () => void;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  const fileURL = useMemo(() => {
    const url = URL.createObjectURL(file);
    return url;
  }, [file]);

  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.playbackRate = playbackRate;
    audioRef.current.onended = onFinish;

    const playPromise = audioRef.current.play();
    if (playPromise) {
      playPromise.catch(() => {
        // Autoplay might be blocked, ignore
      });
    }
  }, [file, playbackRate, onFinish]);

  return (
    <div>
      <div>{file.name}</div>
      <audio key={fileURL} ref={audioRef} src={fileURL} controls />
      <div className="mt-2 flex gap-2">
        {PLAYBACK_RATES.map((rate) => (
          <PlaybackRateButton
            key={rate}
            rate={rate}
            onClick={(r) => {
              if (audioRef.current) {
                audioRef.current.playbackRate = r;
              }
              setPlaybackRate(r);
            }}
            selected={playbackRate === rate}
          />
        ))}
      </div>
    </div>
  );
};

const PlaybackRateButton = ({
  rate,
  onClick,
  selected,
}: {
  rate: number;
  onClick: (rate: number) => void;
  selected: boolean;
}) => {
  const backgroundColor = selected ? 'bg-pink-700' : 'bg-pink-500';
  return (
    <button
      onClick={() => onClick(rate)}
      className={`p-1 ${backgroundColor} text-white rounded w-10 text-sm`}
    >
      {rate}x
    </button>
  );
};
