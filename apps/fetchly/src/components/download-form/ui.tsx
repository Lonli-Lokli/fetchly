'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DownloadForm() {
  const router = useRouter();
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [shortUrl] = useState('');
  const [downloadMethod, setDownloadMethod] = useState<'rest' | 'websocket'>('rest');

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fileUrl.trim()) {
      setError('Please enter a file URL');
      return;
    }

    setError('');

    try {
      // First, create a short URL
      const encodeResponse = await fetch('/api/encode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: fileUrl.trim(),
          filename: fileName.trim() || undefined,
        }),
      });

      if (!encodeResponse.ok) {
        throw new Error('Failed to encode URL');
      }

      const { id, fn } = await encodeResponse.json();

      if (downloadMethod === 'rest') {
        router.push(`/api/transform/${id}?fn=${fn}`);
      } else {
        // WebSocket download logic (replace with your actual implementation)
        // Example: open a modal or start Ably/WebSocket download
        window.dispatchEvent(
          new CustomEvent('start-websocket-download', {
            detail: { id: fileUrl.trim(),  fn: fileName?.trim() || undefined }
          })
        );
      }
    } catch (error: any) {
      setError(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleDownload} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="fileUrl"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          File URL *
        </label>
        <input
          type="url"
          id="fileUrl"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          placeholder="https://example.com/file.pdf"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          required
        />
      </div>

      <div>
        <label
          htmlFor="fileName"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Custom filename (optional)
        </label>
        <input
          type="text"
          id="fileName"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="my-document.pdf"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
        />
        <p className="text-xs text-gray-500 mt-1">
          Include the extension you want (e.g., .pdf, .jpg, .zip)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Download method
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="downloadMethod"
              value="rest"
              checked={downloadMethod === 'rest'}
              onChange={() => setDownloadMethod('rest')}
              className="form-radio"
            />
            <span>REST endpoint</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="downloadMethod"
              value="websocket"
              checked={downloadMethod === 'websocket'}
              onChange={() => setDownloadMethod('websocket')}
              className="form-radio"
            />
            <span>WebSockets</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}`}
      >
        {'📥 Download File'}
      </button>

      {shortUrl && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 mb-2">
            ✅ Short download URL generated:
          </p>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={shortUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm bg-white border border-green-300 rounded font-mono"
            />
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(shortUrl)}
              className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </form>
  );
}