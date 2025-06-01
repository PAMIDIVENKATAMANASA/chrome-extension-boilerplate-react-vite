'use client';

import '@src/Popup.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { Download, Image, Table } from 'lucide-react';
import { useState } from 'react';

const Popup = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [status, setStatus] = useState('');

  const showError = (msg: string) => {
    console.error(msg);
    setStatus(msg);
    setIsDownloading(false);
    setTimeout(() => setStatus(''), 3000);
  };

  const downloadImages = async () => {
    if (!chrome?.tabs || !chrome?.scripting || !chrome?.downloads) {
      showError('Chrome APIs not available.');
      return;
    }

    setIsDownloading(true);
    setStatus('Scanning for images...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab found');

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () =>
          Array.from(document.querySelectorAll('img'))
            .map(img => ({
              src: img.src,
              alt: img.alt || 'image',
              width: img.naturalWidth,
              height: img.naturalHeight,
            }))
            .filter(img => img.src.startsWith('http') && img.width > 50 && img.height > 50),
      });

      const images = results[0]?.result || [];
      if (images.length === 0) {
        showError('No images found on this page');
        return;
      }

      setStatus(`Found ${images.length} images. Downloading...`);

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const url = new URL(image.src);
        const filename = `image_${i + 1}_${url.pathname.split('/').pop() || 'image.jpg'}`;
        await chrome.downloads.download({
          url: image.src,
          filename: `webpage_images/${filename}`,
          saveAs: false,
        });
      }

      setStatus(`Successfully downloaded ${images.length} images!`);
    } catch {
      showError('Error downloading images. Please try again.');
    } finally {
      setIsDownloading(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const downloadTables = async () => {
    if (!chrome?.tabs || !chrome?.scripting || !chrome?.downloads) {
      showError('Chrome APIs not available.');
      return;
    }

    setIsDownloading(true);
    setStatus('Scanning for tables...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab found');

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const tables = Array.from(document.querySelectorAll('table'));
          return tables
            .map((table, index) => {
              const rows = Array.from(table.querySelectorAll('tr'));
              const csv = rows
                .map(row => {
                  const cells = Array.from(row.querySelectorAll('td, th'));
                  return cells
                    .map(cell => {
                      const text = (cell.textContent || '').trim();
                      return text.includes(',') || text.includes('"') ? `"${text.replace(/"/g, '""')}"` : text;
                    })
                    .join(',');
                })
                .join('\n');

              return { index: index + 1, csv, rowCount: rows.length };
            })
            .filter(t => t.rowCount > 0);
        },
      });

      const tables = results[0]?.result || [];
      if (tables.length === 0) {
        showError('No tables found on this page');
        return;
      }

      setStatus(`Found ${tables.length} tables. Downloading...`);

      for (const table of tables) {
        const blob = new Blob([table.csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        await chrome.downloads.download({
          url,
          filename: `webpage_tables/table_${table.index}.csv`,
          saveAs: false,
        });

        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }

      setStatus(`Successfully downloaded ${tables.length} tables!`);
    } catch {
      showError('Error downloading tables. Please try again.');
    } finally {
      setIsDownloading(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h1 className="popup-title">
          <Download className="popup-icon" />
          Page Downloader
        </h1>
      </div>

      <div className="popup-content">
        <button className="download-button images-button" onClick={downloadImages} disabled={isDownloading}>
          <Image className="button-icon" />
          <span>Download All Images</span>
        </button>

        <button className="download-button tables-button" onClick={downloadTables} disabled={isDownloading}>
          <Table className="button-icon" />
          <span>Download All Tables</span>
        </button>

        {status && <div className={`status-message ${isDownloading ? 'loading' : 'success'}`}>{status}</div>}
      </div>
    </div>
  );
};

const ErrorFallback = () => (
  <div className="error-fallback">
    <p>Something went wrong. Please try again later.</p>
  </div>
);

export default withErrorBoundary(withSuspense(Popup, <div>Loading...</div>), ErrorFallback);
