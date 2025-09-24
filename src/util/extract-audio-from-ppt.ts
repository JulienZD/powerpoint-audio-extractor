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
      .map(async (relFile) => ({
        fileName: relFile,
        doc: await contents.files[relFile].async('text'),
      })),
  );

  const parser = new DOMParser();
  const slideRels = slideRelsData.map((data) => ({
    fileName: data.fileName,
    doc: parser.parseFromString(data.doc, 'application/xml'),
  }));

  const presentationXmlData =
    await contents.files['ppt/presentation.xml'].async('text');
  const presentationRelsData =
    await contents.files['ppt/_rels/presentation.xml.rels'].async('text');

  const presentationXml = parser.parseFromString(
    replacePrefixedIds(presentationXmlData),
    'application/xml',
  );
  const presentationRelsXml = parser.parseFromString(
    presentationRelsData,
    'application/xml',
  );

  const slideNumberMapping = buildSlideNumberMapping(
    presentationXml,
    presentationRelsXml,
  );

  const slideToAudioMap = matchSlideToAudio(
    audioFiles,
    slideRels,
    slideNumberMapping,
  );

  const outputZip = new JsZip();

  const results = await Promise.all(
    slideToAudioMap.map(async ({ originalName, slides, audioFile }, index) => {
      const fileData = await contents.files[originalName].async('blob');

      return {
        fileName: toFileName(index + 1, slides, audioFile),
        fileData,
        slides,
      };
    }),
  );

  for (const { fileName, fileData } of results) {
    outputZip.file(fileName, fileData);
  }

  const outputZipBlob = await outputZip.generateAsync({ type: 'blob' });

  return {
    success: true,
    result: {
      files: results.map(({ fileName: name, fileData: audioFile, slides }) => ({
        name,
        audioFile,
        slides,
      })),
      zipBlob: outputZipBlob,
    },
  } as const;
}

function matchSlideToAudio(
  audioFiles: readonly string[],
  slideRels: ReadonlyArray<{ fileName: string; doc: Document }>,
  slideNumberMapping: Record<string, number>,
) {
  const normalizedAudioFiles = audioFiles.map((f) =>
    f.replace(/^ppt\/media\//, ''),
  );

  const results: {
    originalName: string;
    audioFile: string;
    slides: number[];
  }[] = [];

  slideRels.forEach(({ fileName, doc }) => {
    const relationships = Array.from(doc.getElementsByTagName('Relationship'));

    // slide file is in the corresponding rel filename
    // e.g. "ppt/slides/_rels/slide5.xml.rels" → "slide5.xml"
    const slideFile = fileName
      .split('/')
      .pop()! // "slide5.xml.rels"
      .replace('.rels', ''); // "slide5.xml"

    const slideNumber = slideNumberMapping[slideFile];
    if (!slideNumber) return;

    relationships.forEach((rel) => {
      if (!rel.getAttribute('Type')?.endsWith('/relationships/media')) return;

      const target = rel.getAttribute('Target');
      if (!target) return;

      const foundAudio = normalizedAudioFiles.find((audio) =>
        target.includes(audio),
      );
      if (!foundAudio) return;

      const nonNormalizedFoundAudio = `ppt/media/${foundAudio}`;

      let entry = results.find((r) => r.audioFile === foundAudio);
      if (!entry) {
        entry = {
          originalName: nonNormalizedFoundAudio,
          audioFile: foundAudio,
          slides: [],
        };
        results.push(entry);
      }

      entry.slides.push(slideNumber);
    });
  });

  return results.sort((a, b) => {
    const bySlide = a.slides[0] - b.slides[0];
    if (bySlide !== 0) {
      return bySlide;
    }

    // Multiple audio files on the same slide, sort by file name
    // Don't sort by strings, as "audio10.mp3" would come before "audio9.mp3"

    const aMatch = a.audioFile.match(/(\d+)/);
    const bMatch = b.audioFile.match(/(\d+)/);

    if (aMatch && bMatch) {
      return Number.parseInt(aMatch[1], 10) - Number.parseInt(bMatch[1], 10);
    }

    return a.audioFile.localeCompare(b.audioFile);
  });
}

function buildSlideNumberMapping(
  presentationXml: Document,
  presentationRelsXml: Document,
): Record<string, number> {
  // 1. Build map from r:id → target slide file
  const rels: Record<string, string> = {};
  Array.from(presentationRelsXml.getElementsByTagName('Relationship')).forEach(
    (rel) => {
      const id = rel.getAttribute('Id');
      const target = rel.getAttribute('Target');
      if (id && target && target.includes('slide')) {
        // e.g. "../../slides/slide5.xml" → "slide5.xml"
        rels[id] = target.split('/').pop()!;
      }
    },
  );

  // 2. Walk the <p:sldIdLst> in order → this gives actual slide order
  const slideIdList = presentationXml.getElementsByTagName('p:sldId');
  const mapping: Record<string, number> = {};

  for (let i = 0; i < slideIdList.length; i++) {
    const sldIdEl = slideIdList[i];

    const rId = sldIdEl.getAttribute('r_id');
    if (!rId) continue;

    const slideFile = rels[rId];
    if (!slideFile) continue;

    // index is zero-based, so +1 gives the user-facing slide number
    mapping[slideFile] = i + 1;
  }

  return mapping;
}

/**
 * Replaces attribute prefixes in the given XML string, as browser XML parsers will strip the prefix.
 */
function replacePrefixedIds(xml: string): string {
  return xml.replaceAll('r:id=', 'r_id=');
}

function toFileName(index: number, slides: number[], audioFile: string) {
  return `${index.toString().padStart(3, '0')} - slide_${slides.join('-')} - ${audioFile}`;
}
