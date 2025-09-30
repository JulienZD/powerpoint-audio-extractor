import { useCallback, useState } from 'react';
import {
  type ExtractAudioResult,
  extractAudioFromPowerPoint,
} from '../util/extract-audio-from-ppt';
import { Dropzone } from './dropzone';

export const PowerPointUpload = ({
  onResult,
}: {
  onResult: (result: ExtractAudioResult & { name: string }) => void;
}) => {
  const [_audioFiles, _setAudioFiles] = useState<string[]>([]);

  const [uploadError, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    void handleSubmit(file);
  }, []);

  const handleSubmit = async (file: File) => {
    const result = await extractAudioFromPowerPoint(await file.arrayBuffer());

    if (!result.success) {
      setError(result.error);
      return;
    }

    onResult({ ...result.result, name: file.name });

    setError(null);
  };

  return (
    <div className="max-w-xl mx-auto p-4 flex flex-col items-center justify-center h-full">
      <form className="flex flex-col gap-4 rounded p-4 shadow-md bg-card">
        <p className="text-sm text-card-foreground mb-4">
          Upload a file to extract audio. The audio will be processed
          automatically, allowing you to play it here or download it as a ZIP
          file.
        </p>

        <Dropzone
          options={{
            onDrop,
            multiple: false,
            accept: {
              'application/vnd.ms-powerpoint': ['.ppt'],
              'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                ['.pptx'],
            },
          }}
        />

        {uploadError && <p className="text-red-500">{uploadError}</p>}
      </form>
    </div>
  );
};
