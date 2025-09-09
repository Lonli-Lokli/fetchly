import type * as Party from "partykit/server";

// IMPORTANT: Replace with your deployed Next.js app's URL in production
const NEXTJS_HOST = 'http://fetchly.vercel.app/';

export default class DownloadServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onMessage(message: string, sender: Party.Connection) {
    const { type, id, fn } = JSON.parse(message);

    if (type !== "start-download" || !id) {
      sender.send(JSON.stringify({ type: 'error', message: 'ID is missing' }));
      return;
    }

    try {
      // Call our Next.js endpoint to get the file stream
      const streamUrl = `${NEXTJS_HOST}/api/transform/${id}?fn=${fn || ''}&stream=true`;
      const response = await fetch(streamUrl);

      if (!response.ok || !response.body) {
        throw new Error(`Failed to fetch stream from Next.js: ${response.statusText}`);
      }

      // Get filename from the header set by our Next.js route
      const filename = decodeURIComponent(response.headers.get('x-filename') || 'download');
      sender.send(JSON.stringify({ type: 'download-start', filename }));

      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // Forward the binary chunk to the client
        sender.send(value);
      }

      sender.send(JSON.stringify({ type: 'download-complete' }));

    } catch (error) {
      console.error("Download stream error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file stream.';
      sender.send(JSON.stringify({ type: 'error', message: errorMessage }));
    }
  }
}

DownloadServer satisfies Party.Worker;
