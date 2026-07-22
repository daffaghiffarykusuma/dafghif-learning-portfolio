const PDF_VIEWER_FRAGMENT = 'toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=page-width&statusbar=0&messages=0&pagemode=none';
type ArtifactPreviewType = 'pdf' | 'viewer';
type ArtifactPreviewDatasetKey = 'pdfPath' | 'viewerPath';
type ArtifactPreviewBaseLocation = string | URL | Location | null | undefined;

type ArtifactPreviewPolicy = Readonly<{
    datasetKey: ArtifactPreviewDatasetKey;
    prefix: string;
    extension: string;
    frameAttributes: Readonly<Record<string, string>>;
    urlFragment: string;
}>;

export type ArtifactPreview = {
    type: ArtifactPreviewType;
    url: string;
    src: string;
    frameAttributes: Record<string, string>;
    linkPolicy: {
        target: string;
        rel: string;
        opensOutsidePreviewFrame: boolean;
    };
    navigationPolicy: {
        allowedOrigin: string;
        allowedPathPrefix: string;
        allowedExtension: string;
        previewFrameNavigation: string;
        artifactLinks: string;
    };
};

export type ArtifactPreviewContract = ArtifactPreview & {
    triggerAttributes: Partial<Record<'data-pdf' | 'data-viewer', string>>;
};

const OUTSIDE_PREVIEW_LINK_POLICY = Object.freeze({
    target: '_blank',
    rel: 'noopener noreferrer',
    opensOutsidePreviewFrame: true
});

export const ARTIFACT_PREVIEW_TYPES: Readonly<Record<ArtifactPreviewType, ArtifactPreviewPolicy>> = Object.freeze({
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

const ARTIFACT_PREVIEW_ORDER: readonly ArtifactPreviewType[] = Object.freeze(['pdf', 'viewer']);

const defaultBaseLocation = () => globalThis.window?.location || 'http://127.0.0.1/';
const toBaseUrl = (baseLocation: ArtifactPreviewBaseLocation) => {
    const resolvedLocation = baseLocation || defaultBaseLocation();
    return new URL(typeof resolvedLocation === 'string' ? resolvedLocation : resolvedLocation.href);
};

export const artifactPreviewTypeForSource = (sourceType: unknown = ''): ArtifactPreviewType | '' => {
    if (sourceType === 'pdf') return 'pdf';
    if (sourceType === 'html-viewer' || sourceType === 'viewer') return 'viewer';
    return '';
};

export const createArtifactPreviewContract = ({
    sourceArtifact = '',
    sourceType = ''
}: { sourceArtifact?: string; sourceType?: string } = {}, baseLocation: ArtifactPreviewBaseLocation = defaultBaseLocation()): ArtifactPreviewContract | null => {
    const previewType = artifactPreviewTypeForSource(sourceType);
    if (!previewType) return null;

    const triggerAttributes = previewType === 'pdf'
        ? { 'data-pdf': sourceArtifact }
        : { 'data-viewer': sourceArtifact };
    const preview = resolveArtifactPreview(
        previewType === 'pdf'
            ? { pdfPath: sourceArtifact }
            : { viewerPath: sourceArtifact },
        baseLocation
    );

    return preview ? {
        ...preview,
        triggerAttributes
    } : null;
};

export const safeArtifactPreviewPath = (candidatePath: string | null | undefined, previewType: string, baseLocation: ArtifactPreviewBaseLocation = defaultBaseLocation()) => {
    if (previewType !== 'pdf' && previewType !== 'viewer') return '';
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

export const resolveArtifactPreview = (candidatePaths: Partial<Record<ArtifactPreviewDatasetKey, string>> = {}, baseLocation: ArtifactPreviewBaseLocation = defaultBaseLocation()): ArtifactPreview | null => {
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

export const applyArtifactPreviewFramePolicy = (iframe: HTMLIFrameElement, preview: Pick<ArtifactPreview, 'frameAttributes'> | null | undefined) => {
    iframe.removeAttribute('sandbox');

    const frameAttributes = preview?.frameAttributes || {};

    for (const [attribute, value] of Object.entries(frameAttributes)) {
        if (value) iframe.setAttribute(attribute, value);
    }
};
