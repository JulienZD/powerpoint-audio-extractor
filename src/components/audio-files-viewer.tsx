import type { ExtractAudioResult } from '../util/extract-audio-from-ppt';
import { AudioPlayer } from './audio-player';

export const AudioFilesViewer = ({
  result,
}: {
  result: ExtractAudioResult;
}) => {
  return (
    <div className="bg-red-300 rounded shadow p-4">
      <p className="text-sm mb-4 max-w-sm md:max-w-lg">
        Below is a list of extracted audio files. Select one to play it directly
        in the browser. Each file has the slide number it was extracted from in
        the filename.
      </p>

      {result.files.length > 0 && (
        <AudioPlayer
          files={result.files.map(
            (file) => new File([file.audioFile], file.name),
          )}
        />
      )}
    </div>
  );
};
