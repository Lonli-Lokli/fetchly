import { decode } from '@/utils';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string} }
) {
  const { id } = params;

  if (!id) {
    return new NextResponse('ID parameter is required', { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams
  const fn = searchParams.get('fn')
 

  const url = await decode(id);
  const filename = fn ? await decode(fn) : undefined;

  try {
    // Fetch the file
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return new NextResponse(
        `Failed to fetch file: ${response.status} ${response.statusText}`, 
        { status: response.status }
      );
    }

    // Get content info
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');

    // Determine filename
    let downloadFilename = filename;
    if (!downloadFilename) {
      // Try to extract from Content-Disposition header
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match) {
          downloadFilename = match[1].replace(/['"]/g, '');
        }
      } else {
        // Extract from URL path
        const urlPath = new URL(url).pathname;
        downloadFilename = urlPath.split('/').pop() || 'download';
        
        // If no extension, try to guess from content-type
        if (!downloadFilename.includes('.') && contentType) {
          const ext = getExtensionFromContentType(contentType);
          if (ext) {
            downloadFilename += ext;
          }
        }
      }
    }

    // Create response headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    // Optional: Remove the URL from store after first use (one-time links)
    // urlStore.delete(id);

    // Return the streamed response
    return new NextResponse(response.body, {
      status: 200,
      headers
    });
    
  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Failed to download file', { status: 500 });
  }
}

function getExtensionFromContentType(contentType: string): string {
  const mimeToExt: { [key: string]: string } = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'text/plain': '.txt',
    'application/zip': '.zip',
    'application/json': '.json',
    'text/html': '.html',
    'text/css': '.css',
    'application/javascript': '.js',
    'video/mp4': '.mp4',
    'audio/mpeg': '.mp3',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
  };
  
  const baseType = contentType.split(';')[0].toLowerCase();
  return mimeToExt[baseType] || '';
}