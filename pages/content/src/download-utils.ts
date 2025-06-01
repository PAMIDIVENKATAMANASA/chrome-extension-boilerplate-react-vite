// Utility functions for downloading files

const downloadFile = (content: string, filename: string, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 100);
};

const downloadImage = (imageUrl: string, filename?: string): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || getFilenameFromUrl(imageUrl) || 'image.jpg';
        a.style.display = 'none';

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(url), 100);
        resolve();
      })
      .catch(reject);
  });

const getFilenameFromUrl = (url: string): string | null =>
  (() => {
    try {
      const pathname = new URL(url).pathname;
      const filename = pathname.split('/').pop();
      return filename && filename.includes('.') ? filename : null;
    } catch {
      return null;
    }
  })();

const sanitizeFilename = (filename: string): string =>
  filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 100);

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ✅ All exports at the end
export { downloadFile, downloadImage, getFilenameFromUrl, sanitizeFilename, formatFileSize };
