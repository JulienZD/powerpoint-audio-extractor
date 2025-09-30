import type { ExtractAudioResult } from '../util/extract-audio-from-ppt';
import { AudioPlayer } from './audio-player';

export const AudioFilesViewer = ({
  result,
}: {
  result: ExtractAudioResult;
}) => {
  const slideNumbers = result.files.flatMap((file) => file.slides);

  const hasSlidesWithMultipleAudio =
    new Set(slideNumbers).size !== slideNumbers.length;

  return (
    <div className="bg-card rounded shadow p-4">
      <p className="text-sm mb-4 max-w-sm md:max-w-lg">
        Below is a list of extracted audio files. Select one to play it directly
        in the browser. Each file has the slide number it was extracted from in
        the filename.
      </p>

      {hasSlidesWithMultipleAudio && (
        <p className="text-xs text-muted-foreground text-wrap max-w-sm md:max-w-lg mb-2 bg-muted border border-muted-foreground rounded p-2">
          One or more slides contain multiple audio files, they might not be in
          the correct order. Please check the original PPTX file if you notice
          any discrepancies.
        </p>
      )}

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
