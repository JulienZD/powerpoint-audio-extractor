import { useState } from 'react';
import { AudioFilesViewer } from './components/audio-files-viewer';
import { PowerPointUpload } from './components/powerpoint-upload.tsx';
import { SettingsProvider } from './components/settings/settings.provider';
import { SettingsConfigurator } from './components/settings/settings-configurator';
import { Button } from './components/ui/button';
import type { ExtractAudioResult } from './util/extract-audio-from-ppt';

function App() {
  const [result, setResult] = useState<
    (ExtractAudioResult & { name: string }) | null
  >(null);

  const handleDownload = () => {
    if (!result) {
      return;
    }

    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(result.zipBlob);
    downloadLink.download = `${result.name.replace(/\.pptx?/, '')} audio.zip`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <main className="text-foreground h-full">
      <div className="h-full flex flex-col items-center justify-center">
        <div>
          <h1 className="text-3xl text-center font-bold mb-8">
            Powerpoint Audio Extractor
          </h1>

          {!result ? (
            <div className="flex flex-col gap-y-2">
              <PowerPointUpload onResult={setResult} />

              <p className="text-sm text-center text-secondary-foreground">
                All processing is done locally in your browser. No files are
                sent to any server.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-y-2">
              <p className="font-bold text-center">{result.name}</p>

              <div className="flex justify-between">
                <Button onClick={handleDownload}>Download Audio</Button>

                <Button variant="link" onClick={() => setResult(null)}>
                  Select another file
                </Button>
              </div>

              <SettingsProvider>
                <AudioFilesViewer result={result} />
              </SettingsProvider>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
