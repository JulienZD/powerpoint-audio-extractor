import { Settings } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from './settings/settings.provider';
import { SettingsConfigurator } from './settings/settings-configurator';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

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
        <div className="flex flex-col gap-1 overflow-y-auto max-h-80 border-accent pr-4 text-nowrap align-start justify-start">
          {files.map((file) => (
            <button
              key={file.name}
              onClick={() => setCurrentFile(file)}
              className={`p-2 rounded hover:bg-accent/70 ${
                currentFile === file ? 'bg-accent' : ''
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
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2">
        <Checkbox
          checked={autoPlay}
          onCheckedChange={(checked) => {
            setAutoPlay(checked === true);
          }}
        />
        <span className="text-sm">Auto-play Next</span>
      </label>

      <Popover>
        <PopoverTrigger className="text-sm inline-flex items-center gap-1">
          <Settings size={16} />
          Settings
        </PopoverTrigger>
        <PopoverContent>
          <SettingsConfigurator />
        </PopoverContent>
      </Popover>
    </div>
  );
};

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

  const { settings } = useSettings();

  const PLAYBACK_RATES = settings?.playbackSpeeds;

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

  if (!PLAYBACK_RATES) {
    return null;
  }

  return (
    <div>
      <div>{file.name}</div>
      <audio key={fileURL} ref={audioRef} src={fileURL} controls />
      <div className="mt-2 flex flex-wrap max-w-80 gap-2">
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
  return (
    <Button
      onClick={() => onClick(rate)}
      className="w-10 text-sm rounded"
      variant={selected ? 'default' : 'secondary'}
    >
      {rate}x
    </Button>
  );
};
