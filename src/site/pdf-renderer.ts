import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

export const loadPdfDocument = (url: string) => getDocument({
    url,
    // Keep rendering compatible with the site's self-only script policy.
    useWasm: false
});
