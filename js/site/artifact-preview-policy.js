const PDF_VIEWER_FRAGMENT = 'toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=page-width&statusbar=0&messages=0&pagemode=none';
const OUTSIDE_PREVIEW_LINK_POLICY = Object.freeze({
    target: '_blank',
    rel: 'noopener noreferrer',
    opensOutsidePreviewFrame: true
});

export const ARTIFACT_PREVIEW_TYPES = Object.freeze({
    pdf: Object.freeze({
        datasetKey: 'pdfPath',
        prefix: 'assets/pdf/portfolio/',
        extension: '.pdf',
        frameAttributes: Object.freeze({}),
        urlFragment: PDF_VIEWER_FRAGMENT
    }),
    viewer: Object.freeze({
        datasetKey: 'viewerPath',
        prefix: 'assets/portfolio-viewers/',
        extension: '.html',
        frameAttributes: Object.freeze({
            sandbox: 'allow-same-origin allow-popups allow-popups-to-escape-sandbox'
        }),
        urlFragment: ''
    })
});

const ARTIFACT_PREVIEW_ORDER = Object.freeze(['pdf', 'viewer']);

const toBaseUrl = (baseLocation) => new URL(baseLocation?.href || baseLocation || window.location.href);

export const safeArtifactPreviewPath = (candidatePath, previewType, baseLocation = window.location) => {
    const policy = ARTIFACT_PREVIEW_TYPES[previewType];
    if (!policy || !candidatePath || /[\u0000-\u001f]/.test(candidatePath)) return '';
    if (/%(?:2e|2f|5c)/i.test(candidatePath)) return '';

    try {
        const baseUrl = toBaseUrl(baseLocation);
        const normalizedPath = decodeURI(candidatePath).replace(/\\/g, '/');
        const url = new URL(normalizedPath, baseUrl.href);
        const cleanPath = url.pathname.replace(/^\/+/, '');
        const normalizedPrefix = policy.prefix.replace(/^\/+/, '');

        return url.origin === baseUrl.origin
            && !cleanPath.includes('../')
            && cleanPath.startsWith(normalizedPrefix)
            && cleanPath.endsWith(policy.extension)
            ? url.href
            : '';
    } catch {
        return '';
    }
};

export const resolveArtifactPreview = (candidatePaths, baseLocation = window.location) => {
    for (const previewType of ARTIFACT_PREVIEW_ORDER) {
        const policy = ARTIFACT_PREVIEW_TYPES[previewType];
        const baseUrl = toBaseUrl(baseLocation);
        const url = safeArtifactPreviewPath(candidatePaths?.[policy.datasetKey], previewType, baseLocation);
        if (!url) continue;

        return {
            type: previewType,
            url,
            src: policy.urlFragment ? `${url}#${policy.urlFragment}` : url,
            frameAttributes: { ...policy.frameAttributes },
            linkPolicy: { ...OUTSIDE_PREVIEW_LINK_POLICY },
            navigationPolicy: {
                allowedOrigin: baseUrl.origin,
                allowedPathPrefix: policy.prefix,
                allowedExtension: policy.extension,
                previewFrameNavigation: 'validated-artifact-src-only',
                artifactLinks: 'open-outside-preview-frame'
            }
        };
    }

    return null;
};

export const applyArtifactPreviewFramePolicy = (iframe, preview) => {
    iframe.removeAttribute('sandbox');

    const frameAttributes = preview?.frameAttributes || {};

    for (const [attribute, value] of Object.entries(frameAttributes)) {
        if (value) iframe.setAttribute(attribute, value);
    }
};
