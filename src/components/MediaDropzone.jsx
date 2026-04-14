import React, { useId, useRef, useState } from 'react';
import { Upload } from 'lucide-react';

const MediaDropzone = ({ onUpload, accept = 'image/*,video/*', maxFiles = 5 }) => {
  const reactId = useId();
  const inputId = `${reactId}-file`;
  const inputRef = useRef(null);
  const [hover, setHover] = useState(false);

  const handleFiles = (fileList) => {
    if (!fileList || !onUpload) return;
    const files = Array.from(fileList).slice(0, maxFiles);
    onUpload(files);
  };

  return (
    <div className="bm-stack-sm">
      <label htmlFor={inputId} className="bm-form-label">
        Evidence (Photo/Video)
      </label>
      <div
        className="bm-dropzone"
        data-hover={hover ? 'true' : undefined}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => { e.preventDefault(); setHover(true); }}
        onDragLeave={() => setHover(false)}
        onDrop={(e) => {
          e.preventDefault();
          setHover(false);
          handleFiles(e.dataTransfer?.files);
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload evidence. Press Enter to open file picker, or drag files here."
      >
        <div style={{ textAlign: 'center' }}>
          <Upload size={24} aria-hidden="true" style={{ marginBottom: 8, color: 'var(--color-text-dim)' }} />
          <p style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>
            Tap to upload or drag &amp; drop
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="sr-only"
      />
    </div>
  );
};

export default MediaDropzone;
