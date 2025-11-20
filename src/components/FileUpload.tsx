interface FileUploadProps {
  pdfFile: File | null
  totalPages: number
  loading: boolean
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export default function FileUpload({ pdfFile, totalPages, loading, onFileUpload }: FileUploadProps) {
  return (
    <div className="upload-section">
      <div className="upload-area">
        <input
          type="file"
          accept=".pdf"
          onChange={onFileUpload}
          id="pdf-upload"
          className="file-input"
        />
        <label htmlFor="pdf-upload" className="upload-label">
          {loading ? (
            <span>Loading PDF...</span>
          ) : pdfFile ? (
            <div className="file-info">
              <span className="file-name">✓ {pdfFile.name}</span>
              <span className="file-pages">{totalPages} pages</span>
            </div>
          ) : (
            <div>
              <span className="upload-icon">📄</span>
              <span>Click to upload PDF</span>
            </div>
          )}
        </label>
      </div>
    </div>
  )
}
