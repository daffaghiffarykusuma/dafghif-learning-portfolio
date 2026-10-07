import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

type LoadDocument = (url: string) => Promise<PDFDocumentLoadingTask>;
const loadDocument: LoadDocument = async (url) => {
    const { loadPdfDocument } = await import('./pdf-renderer.ts');
    return loadPdfDocument(url);
};

export function createPdfPagePreview(host: HTMLElement, url: string, load: LoadDocument = loadDocument) {
    const root = host.ownerDocument;
    const reader = root.createElement('section');
    reader.className = 'pdf-page-preview';
    reader.setAttribute('aria-label', 'PDF pages');
    const controls = root.createElement('div');
    controls.className = 'pdf-page-controls';
    const previous = root.createElement('button');
    previous.type = 'button';
    previous.textContent = 'Previous';
    const next = root.createElement('button');
    next.type = 'button';
    next.textContent = 'Next';
    const status = root.createElement('span');
    status.setAttribute('role', 'status');
    status.textContent = 'Loading PDF…';
    const scroll = root.createElement('div');
    scroll.className = 'pdf-page-scroll';
    const canvas = root.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.hidden = true;
    scroll.append(canvas);
    controls.append(previous, status, next);
    reader.append(controls, scroll);
    host.append(reader);

    let disposed = false;
    let loading: PDFDocumentLoadingTask | undefined;
    let pdf: PDFDocumentProxy | undefined;
    let rendering: RenderTask | undefined;
    let pageNumber = 1;
    let busy = true;

    const updateControls = () => {
        previous.disabled = busy || pageNumber <= 1;
        next.disabled = busy || !pdf || pageNumber >= pdf.numPages;
    };
    const showError = () => {
        if (disposed) return;
        busy = false;
        canvas.hidden = true;
        status.textContent = 'Preview unavailable. Use Open full screen to read the PDF.';
        updateControls();
    };
    const renderPage = async () => {
        if (!pdf || disposed) return;
        busy = true;
        updateControls();
        status.textContent = `Loading page ${pageNumber}…`;
        try {
            const page = await pdf.getPage(pageNumber);
            if (disposed) return;
            const original = page.getViewport({ scale: 1 });
            const width = Math.max(1, scroll.clientWidth - 24);
            const ratio = Math.min(root.defaultView?.devicePixelRatio || 1, 2);
            const viewport = page.getViewport({ scale: width / original.width * ratio });
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            canvas.setAttribute('aria-label', `PDF page ${pageNumber} of ${pdf.numPages}`);
            rendering = page.render({ canvas, viewport });
            await rendering.promise;
            if (disposed) return;
            canvas.hidden = false;
            scroll.scrollTop = 0;
            status.textContent = `Page ${pageNumber} of ${pdf.numPages}`;
            page.cleanup();
            busy = false;
            updateControls();
        } catch {
            showError();
        }
    };
    previous.addEventListener('click', () => {
        if (busy || pageNumber <= 1) return;
        pageNumber -= 1;
        void renderPage();
    });
    next.addEventListener('click', () => {
        if (busy || !pdf || pageNumber >= pdf.numPages) return;
        pageNumber += 1;
        void renderPage();
    });
    updateControls();
    void (async () => {
        try {
            // Let a synchronously closed dialog cancel before importing the renderer.
            await Promise.resolve();
            if (disposed) return;
            loading = await load(url);
            if (disposed) {
                void loading.promise.catch(() => {});
                void loading.destroy().catch(() => {});
                return;
            }
            pdf = await loading.promise;
            await renderPage();
        } catch {
            showError();
        }
    })();

    return () => {
        disposed = true;
        rendering?.cancel();
        void loading?.destroy().catch(() => {});
        reader.remove();
    };
}
