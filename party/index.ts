import type * as Party from "partykit/server";

export default class DownloadServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onMessage(message: string, sender: Party.Connection) {
    const { type, streamUrl, fileName} = JSON.parse(message);

    if (type !== "start-download" || !streamUrl) {
      sender.send(JSON.stringify({ type: 'error', message: 'streamUrl is missing' }));
      return;
    }

    try {
      // Call our Next.js endpoint to get the file stream
      const response = await fetch(streamUrl);

      if (!response.ok || !response.body) {
        throw new Error(`Failed to fetch stream: ${response.statusText}`);
      }

      sender.send(JSON.stringify({ type: 'download-start', fileName: fileName || 'download'  }));

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
