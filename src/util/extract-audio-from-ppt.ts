import JsZip from 'jszip';

export type ExtractAudioResult = Extract<
  Awaited<ReturnType<typeof extractAudioFromPowerPoint>>,
  { success: true }
>['result'];

export async function extractAudioFromPowerPoint(
  powerpointBuffer: ArrayBuffer,
) {
  const zip = new JsZip();

  const contents = await zip.loadAsync(powerpointBuffer);

  const audioFiles = Object.keys(contents.files).filter(
    (fileName) =>
      fileName.startsWith('ppt/media/') &&
      /\.(mp3|wav|m4a|wma|aac|flac|ogg)$/i.test(fileName),
  );

  if (audioFiles.length === 0) {
    return {
      success: false,
      error: 'No audio files found in the PowerPoint.',
    } as const;
  }

  // Slide relationships contain the mapping between slides and media files
  const slideRelsData = await Promise.all(
    Object.keys(contents.files)
      .filter(
        (fileName) =>
          fileName.startsWith('ppt/slides/_rels/') &&
          fileName.endsWith('.rels'),
      )
      .map((relFile) => contents.files[relFile].async('text')),
  );

  const slideRels = slideRelsData.map((data) => {
    const parser = new DOMParser();
    return parser.parseFromString(data, 'application/xml');
  });

  const slideToAudioMap = matchSlideToAudio(audioFiles, slideRels);

  const outputZip = new JsZip();

  const results = await Promise.all(
    slideToAudioMap.map(async ({ originalName, slides, audioFile }, index) => {
      const fileData = await contents.files[originalName].async('blob');

      return { fileName: toFileName(index + 1, slides, audioFile), fileData };
    }),
  );

  for (const { fileName, fileData } of results) {
    outputZip.file(fileName, fileData);
  }

  const outputZipBlob = await outputZip.generateAsync({ type: 'blob' });

  return {
    success: true,
    result: {
      files: results.map(({ fileName: name, fileData: audioFile }) => ({
        name,
        audioFile,
      })),
      zipBlob: outputZipBlob,
    },
  } as const;
}

function matchSlideToAudio(audioFiles: string[], slideRels: any[]) {
  return audioFiles.map((audioFile) => {
    const audioFileName = audioFile.replace('ppt/media/', '');
    const matchedSlides = slideRels
      .map((relDoc, index) => {
        const relationships = relDoc.getElementsByTagName('Relationship');
        for (let i = 0; i < relationships.length; i++) {
          const rel = relationships[i];
          const target = rel.getAttribute('Target');
          if (target && target.includes(audioFileName)) {
            return index + 1; // Slide numbers are 1-based
          }
        }
        return null;
      })
      .filter((slideNumber) => slideNumber !== null);

    return {
      originalName: audioFile,
      audioFile: audioFileName,
      slides: matchedSlides as number[],
    };
  });
}

function toFileName(index: number, slides: number[], audioFile: string) {
  return `${index.toString().padStart(3, '0')} - slide_${slides.join('-')} - ${audioFile}`;
}
