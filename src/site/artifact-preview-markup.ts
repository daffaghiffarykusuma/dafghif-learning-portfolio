// The Artifact Preview Experience's DOM contract. Generation, the Site Page Shell,
// and test fixtures all render the modal from here, so the ids cannot drift.

export const ARTIFACT_PREVIEW_ELEMENT_IDS = Object.freeze({
    modal: 'pdf-modal',
    title: 'pdf-modal-title',
    meta: 'pdf-modal-meta',
    frame: 'pdf-iframe',
    openFull: 'pdf-open-full',
    discuss: 'pdf-discuss'
});

export const ARTIFACT_PREVIEW_TRIGGER_CLASS = 'view-details-button';
export const ARTIFACT_PREVIEW_CLOSE_CLASS = 'close-modal';

const ids = ARTIFACT_PREVIEW_ELEMENT_IDS;

export const renderArtifactPreviewModal = () => `<dialog aria-labelledby="${ids.title}" class="pdf-modal" id="${ids.modal}">
    <div class="pdf-modal-content" role="document">
      <div class="pdf-modal-header">
        <button type="button" class="${ARTIFACT_PREVIEW_CLOSE_CLASS} js-close-modal" aria-label="Close artifact preview"></button>
        <div>
          <h2 id="${ids.title}">Portfolio Item Details</h2>
          <p id="${ids.meta}">Artifact preview</p>
        </div>
      </div>
      <div class="pdf-modal-body">
        <iframe frameborder="0" height="500px" id="${ids.frame}" referrerpolicy="same-origin" src="" title="Artifact preview" width="100%"></iframe>
      </div>
      <div class="pdf-modal-actions">
        <a class="secondary-cta" href="#" id="${ids.openFull}">Open full screen</a>
        <a class="cta-button" href="contact.html" id="${ids.discuss}">Discuss this work</a>
      </div>
    </div>
  </dialog>`;
