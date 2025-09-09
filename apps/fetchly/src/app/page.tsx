import { DownloadForm } from '@/components/download-form';
import { WebsocketDownloader } from '@/components/websocket-downloader';

export default function Index() {
  /*
   * Replace the elements below with your own.
   *
   * Note: The corresponding styles are in the ./index.tailwind file.
   */
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            🔄 File Download Proxy
          </h1>

          <DownloadForm />

          <div className="mt-8 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              How it works:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Enter the URL of the file you want to download</li>
              <li>• Specify a custom filename with extension</li>
              <li>• Choose Transport (REST or WebSockets)</li>
              <li>• The file will be streamed through this server&apos;s domain</li>
              <li>• Useful when direct access to the file URL is blocked</li>
              <li>• Server-side processing with client-side form</li>
            </ul>
          </div>
        </div>
      </div>
      <WebsocketDownloader />
    </div>
  );
}

