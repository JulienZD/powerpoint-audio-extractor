import { useMemo } from 'react';
import { type DropzoneOptions, useDropzone } from 'react-dropzone';

const baseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  borderWidth: 2,
  borderRadius: 2,
  borderColor: '#eeeeee',
  borderStyle: 'dashed',
  outline: 'none',
  transition: 'border .24s ease-in-out',
} as const;

const focusedStyle = {
  borderColor: '#2196f3',
} as const;

const acceptStyle = {
  borderColor: '#00e676',
} as const;

const rejectStyle = {
  borderColor: '#ff1744',
} as const;

export function Dropzone({ options }: { options: DropzoneOptions }) {
  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } =
    useDropzone(options);

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isFocused, isDragAccept, isDragReject],
  );

  return (
    <div>
      <div
        {...getRootProps({
          style,
          className:
            'bg-secondary text-secondary-foreground cursor-pointer',
        })}
      >
        <input {...getInputProps()} />
        <p>Drag and drop a powerpoint here, or click to select one</p>
      </div>
    </div>
  );
}
