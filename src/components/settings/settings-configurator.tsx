import { Plus, X, XIcon } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { useSettings } from './settings.provider';

export const SettingsConfigurator = () => {
  const { settings, resetSetting, setSettings } = useSettings();

  const [showSpeedInput, setShowSpeedInput] = useState(false);

  return (
    <>
      <div className="flex justify-between items-center">
        <p className="font-semibold leading-none text-sm">Playback Speeds</p>

        <ConfirmReset
          onReset={() => {
            resetSetting('playbackSpeeds');
          }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto p-2">
          {settings.playbackSpeeds.map((speed, index) => (
            <PlaybackSpeedItem
              key={speed}
              speed={speed}
              onRemove={(speedToRemove) => {
                const newSpeeds = settings.playbackSpeeds.filter(
                  (s) => s !== speedToRemove,
                );
                setSettings({ ...settings, playbackSpeeds: newSpeeds });
              }}
            />
          ))}
        </div>

        <Button onClick={() => setShowSpeedInput(true)}>
          <Plus /> Add Speed
        </Button>

        {showSpeedInput && (
          <PlaybackSpeedInput
            onChange={(newSpeed) => {
              if (!settings.playbackSpeeds.includes(newSpeed)) {
                setSettings({
                  ...settings,
                  playbackSpeeds: [...settings.playbackSpeeds, newSpeed].sort(
                    (a, b) => a - b,
                  ),
                });
              }

              setShowSpeedInput(false);
            }}
          />
        )}
      </div>
    </>
  );
};

const PlaybackSpeedItem = ({
  speed,
  onRemove,
}: {
  speed: number;
  onRemove: (speed: number) => void;
}) => {
  return (
    <div className="flex items-center justify-between p-1">
      <span>{speed}x</span>
      <Button variant="ghost" onClick={() => onRemove(speed)}>
        <XIcon size={16} />
      </Button>
    </div>
  );
};

const PlaybackSpeedInput = ({
  onChange,
}: {
  onChange: (newSpeed: number) => void;
}) => {
  const [speedValue, setSpeedValue] = useState<number>(1);

  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Playback Speed</DialogTitle>
        </DialogHeader>
        <Input
          type="number"
          step="0.25"
          min="0.25"
          max="8"
          value={speedValue}
          onChange={(e) => {
            const newSpeed = Number.parseFloat(e.target.value);
            if (!isNaN(newSpeed) && newSpeed > 0) {
              setSpeedValue(newSpeed);
            }
          }}
        />
        <DialogFooter>
          <Button type="button" onClick={() => onChange(speedValue)}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ConfirmReset = ({ onReset }: { onReset: () => void }) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="link">Reset to Default</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-80!">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onReset}>Reset</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
