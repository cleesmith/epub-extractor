'use client';

import { useState, useRef } from 'react';

interface EpubMetadata {
  title?: string;
  creator?: string;
  identifier?: string;
  publisher?: string;
  generator?: string;
  generatorVersion?: string;
  rights?: string;
  language?: string;
  modified?: string;
}

interface ExtractResult {
  success: boolean;
  message: string;
  outputDir?: string;
  filesExtracted?: string[];
  error?: string;
  metadata?: EpubMetadata;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      setResult({ success: false, message: 'Please select an .epub file' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('epub', selectedFile);

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      const data: ExtractResult = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to connect to server',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>EPUB Extractor: &nbsp;<b>UNZIP</b> <i>some_ebook</i>.epub to ~/Documents/<i>some_ebook</i></h1>

      <div style={styles.panels}>
        {/* Left Panel - Controls */}
        <div style={styles.leftPanel}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".epub"
            style={{ display: 'none' }}
            disabled={loading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            style={{
              ...styles.browseButton,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Browse
          </button>
          <span style={styles.fileLabel}>
            {selectedFile ? selectedFile.name : 'No file selected'}
          </span>
          <button
            onClick={handleExtract}
            disabled={loading || !selectedFile}
            style={{
              ...styles.button,
              opacity: loading || !selectedFile ? 0.6 : 1,
              cursor: loading || !selectedFile ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Extracting...' : 'Extract'}
          </button>

          {result && (
            <div style={{
              ...styles.statusBox,
              borderColor: result.success ? '#4ade80' : '#f87171',
            }}>
              <p style={{
                ...styles.resultMessage,
                color: result.success ? '#4ade80' : '#f87171',
              }}>
                {result.success ? '✓' : '✗'} {result.message}
              </p>
              {result.outputDir && (
                <p style={styles.outputDir}>Output: {result.outputDir}</p>
              )}
              {result.error && (
                <p style={styles.error}>Error: {result.error}</p>
              )}
            </div>
          )}

          {result?.metadata && Object.keys(result.metadata).some(k => result.metadata?.[k as keyof EpubMetadata]) && (
            <div style={styles.metadataBox}>
              <p style={styles.metadataHeader}>Metadata</p>
              {result.metadata.title && (
                <p style={styles.metadataItem}><span style={styles.metadataLabel}>Title:</span> {result.metadata.title}</p>
              )}
              {result.metadata.creator && (
                <p style={styles.metadataItem}><span style={styles.metadataLabel}>Creator:</span> {result.metadata.creator}</p>
              )}
              {result.metadata.identifier && (
                <p style={styles.metadataItem}><span style={styles.metadataLabel}>Identifier:</span> {result.metadata.identifier}</p>
              )}
              {result.metadata.publisher && (
                <p style={styles.metadataItem}><span style={styles.metadataLabel}>Publisher:</span> {result.metadata.publisher}</p>
              )}
              {result.metadata.generator && (
                <p style={styles.metadataItem}>
                  <span style={styles.metadataLabel}>Generator:</span> {result.metadata.generator}
                  {result.metadata.generatorVersion && ` v${result.metadata.generatorVersion}`}
                </p>
              )}
              {result.metadata.language && (
                <p style={styles.metadataItem}><span style={styles.metadataLabel}>Language:</span> {result.metadata.language}</p>
              )}
              {result.metadata.modified && (
                <p style={styles.metadataItem}><span style={styles.metadataLabel}>Modified:</span> {result.metadata.modified}</p>
              )}
              {result.metadata.rights && (
                <p style={styles.metadataItem}><span style={styles.metadataLabel}>Rights:</span> {result.metadata.rights}</p>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - File List */}
        <div style={styles.rightPanel}>
          {result?.filesExtracted && result.filesExtracted.length > 0 ? (
            <>
              <p style={styles.fileListHeader}>
                Extracted {result.filesExtracted.length} files:
              </p>
              <div style={styles.fileListScroll}>
                {result.filesExtracted.map((file, index) => {
                  const url = `/api/file?dir=${encodeURIComponent(result.outputDir!)}&file=${encodeURIComponent(file)}`;
                  return (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.fileLink}
                    >
                      {file}
                    </a>
                  );
                })}
              </div>
            </>
          ) : (
            <p style={styles.placeholder}>Select and extract an epub to see files here</p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    color: '#eaeaea',
    padding: '15px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 'normal',
    textAlign: 'center',
    marginBottom: '15px',
    color: '#a0a0a0',
  },
  panels: {
    display: 'flex',
    gap: '20px',
    height: 'calc(100vh - 80px)',
  },
  leftPanel: {
    width: '300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#2a2a4a',
    borderRadius: '8px',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
  },
  browseButton: {
    padding: '12px 20px',
    fontSize: '1rem',
    fontWeight: 'bold',
    backgroundColor: '#3a3a5a',
    border: '1px solid #4a4a6a',
    borderRadius: '8px',
    color: '#ffffff',
  },
  fileLabel: {
    fontSize: '0.9rem',
    color: '#a0a0a0',
    padding: '8px 0',
    wordBreak: 'break-all',
  },
  button: {
    padding: '12px 20px',
    fontSize: '1rem',
    fontWeight: 'bold',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
  },
  statusBox: {
    marginTop: '10px',
    padding: '12px',
    backgroundColor: '#2a2a4a',
    borderRadius: '8px',
    border: '1px solid',
  },
  resultMessage: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    margin: '0 0 5px 0',
  },
  outputDir: {
    fontSize: '0.8rem',
    color: '#a0a0a0',
    margin: '0',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
  },
  error: {
    fontSize: '0.8rem',
    color: '#f87171',
    margin: '0',
  },
  fileListHeader: {
    fontSize: '0.9rem',
    color: '#a0a0a0',
    marginBottom: '10px',
  },
  fileListScroll: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#1a1a2e',
    borderRadius: '6px',
    padding: '10px',
  },
  fileLink: {
    display: 'block',
    fontSize: '0.85rem',
    fontFamily: 'monospace',
    color: '#60a5fa',
    padding: '3px 0',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  placeholder: {
    color: '#606080',
    fontSize: '0.9rem',
    textAlign: 'center',
    marginTop: '40px',
  },
  metadataBox: {
    marginTop: '10px',
    padding: '12px',
    backgroundColor: '#2a2a4a',
    borderRadius: '8px',
    border: '1px solid #3a3a5a',
  },
  metadataHeader: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#a0a0a0',
    margin: '0 0 8px 0',
  },
  metadataItem: {
    fontSize: '0.8rem',
    color: '#c0c0c0',
    margin: '0 0 4px 0',
    lineHeight: '1.4',
  },
  metadataLabel: {
    color: '#808090',
  },
};
