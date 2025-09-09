'use client';

import { useEffect, useState } from 'react';
import usePartySocket from 'partysocket/react';

type DownloadState = {
  id: string;
  fn: string;
  filename: string;
  status: 'idle' | 'connecting' | 'downloading' | 'complete' | 'error';
  error?: string;
  receivedBytes: number;
};

export function WebsocketDownloader() {
  const [download, setDownload] = useState<DownloadState | null>(null);
  // Ensure chunks are stored in a type compatible with the Blob constructor
  const [chunks, setChunks] = useState<BlobPart[]>([]);

  // Listen for the global event to start a download
  useEffect(() => {
    const handleStartDownload = (event: CustomEvent) => {
      const { id, fn } = event.detail;
      setDownload({
        id,
        fn,
        filename: 'starting...',
        status: 'connecting',
        receivedBytes: 0,
      });
      setChunks([]); // Reset chunks for new download
    };

    window.addEventListener('start-websocket-download', handleStartDownload as EventListener);
    return () => {
      window.removeEventListener('start-websocket-download', handleStartDownload as EventListener);
    };
  }, []);

  // usePartySocket hook to manage the WebSocket connection
  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || '127.0.0.1:1999',
    room: 'index',
    // The socket will only connect when this component is rendered (i.e., when `download` is not null)
    onOpen: () => {
      // When the connection opens, send the start message
      if (download) {
        socket.send(JSON.stringify({ type: 'start-download', id: download.id, fn: download.fn }));
      }
    },
    onMessage: (event: MessageEvent) => {
      if (event.data instanceof ArrayBuffer) {
        // Handle binary chunk
        const chunk = new Uint8Array(event.data);
        setChunks(prev => [...prev, chunk]);
        setDownload(prev => prev ? { ...prev, receivedBytes: prev.receivedBytes + chunk.byteLength } : null);
      } else {
        // Handle JSON message
        try {
          const message = JSON.parse(event.data);
          switch (message.type) {
            case 'download-start':
              setDownload(prev => prev ? { ...prev, status: 'downloading', filename: message.filename } : null);
              break;
            case 'download-complete':
              setDownload(prev => prev ? { ...prev, status: 'complete' } : null);
              break;
            case 'error':
              setDownload(prev => prev ? { ...prev, status: 'error', error: message.message } : null);
              break;
          }
        } catch (e) {
          console.error("Failed to parse server message", e);
        }
      }
    },
    onError: (err) => {
      setDownload(prev => prev ? { ...prev, status: 'error', error: 'WebSocket connection failed.' } : null);
    }
  });

  // This effect runs when the download is complete to save the file
  useEffect(() => {
    if (download?.status === 'complete' && chunks.length > 0) {
      const fileBlob = new Blob(chunks);
      const url = URL.createObjectURL(fileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = download.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Reset the component state after a short delay
      setTimeout(() => setDownload(null), 3000);
    }
  }, [download, chunks]);

  // The component only renders when a download is active
  if (!download) return null;

  return (
    <div className="fixed bottom-4 right-4 w-72 bg-white p-4 rounded-lg shadow-xl border border-gray-200 z-50">
      <p className="text-sm font-semibold truncate" title={download.filename}>{download.filename}</p>
      {download.status === 'connecting' && <p className="text-xs text-gray-500">Connecting...</p>}
      {download.status === 'downloading' && (
        <div>
          <p className="text-xs text-blue-500">Downloading...</p>
          <p className="text-xs text-gray-600">({(download.receivedBytes / 1024 / 1024).toFixed(2)} MB)</p>
        </div>
      )}
      {download.status === 'complete' && <p className="text-xs text-green-500">Download finished!</p>}
      {download.status === 'error' && <p className="text-xs text-red-500">Error: {download.error}</p>}
      <button onClick={() => setDownload(null)} className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 text-lg leading-none p-1">&times;</button>
    </div>
  );
}
