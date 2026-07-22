# Learning Portfolio Site

This context defines the project language for Daffa Ghiffary Kusuma's public learning portfolio. It exists so future work keeps the site's positioning, portfolio evidence, and artifact terminology consistent.

## Language

**Learning Portfolio Site**:
The public portfolio website for Daffa Ghiffary Kusuma, focused on learning design, training programs, facilitation, coaching, analytics, and related work samples. It is used to support job applications, professional credibility, and client-facing review of selected artifacts.
_Avoid_: Personal website, generic portfolio, marketing site

**Portfolio Item**:
A distinct work sample shown on the **Learning Portfolio Site**, usually representing a training program, learning material, deck, workbook, evaluation dashboard, case study, publication, or related evidence of capability.
_Avoid_: Project, card, asset, sample

**Portfolio Item Source**:
The structured source data used to render visible **Portfolio Item** listings and generate portfolio metadata. The **Portfolio Item Source** is the source of truth for titles, descriptions, Practice Areas, tags, thumbnails, Artifact Preview links, and discussion links.
_Avoid_: Scraped HTML, generated catalog, card markup

**Portfolio Item Source Validation**:
The pre-generation module that verifies the **Portfolio Item Source** schema and declared count, identity and page-path uniqueness, known **Practice Areas**, required **Case Study** and **Artifact** fields, replacement references, and **Proof Point** references, then applies normalized **Proof Points** before generated files can be written.
_Avoid_: JSON check, source lint, generator guard

**Validated Portfolio Item Source**:
The canonical **Portfolio Item** representation produced by **Portfolio Item Source Validation** after **Case Study** expansion, normalization, featured ordering, and **Proof Point** application, together with the **Case Study Publication** facts computed during validation. The **Portfolio Evidence Workflow** and evidence checks consume these facts without repeating **Case Study Publication**, **Portfolio Item**, or **Proof Point** normalization.
_Avoid_: Expanded source, ordered items, normalized catalog input

**Artifact**:
A concrete deliverable or source file that provides evidence for a **Portfolio Item**, such as a PDF, slide deck, workbook, document, dashboard, template, or generated preview. Thumbnails, stylesheets, and other supporting site assets are not **Artifacts**.
_Avoid_: Asset, attachment, file, material

**Product Thumbnail**:
A designed 16:9 cover image that identifies a **Portfolio Item** or included **Artifact** with readable title text and a visual motif related to the work. It is a supporting site asset, not an **Artifact**, and should not be a generic textless illustration or mockup.
_Avoid_: Generic thumbnail, cover image, project image

**Evidence Photograph**:
An authentic photograph from the represented work, such as a workshop, facilitation session, event, participant activity, or group photo. An **Evidence Photograph** may be used instead of a **Product Thumbnail** and is not required to contain overlaid title text.
_Avoid_: Generated photoshoot, stock photo, photo-style thumbnail

**Artifact Preview**:
A browser-readable representation of an **Artifact** used inside the **Learning Portfolio Site** so visitors can inspect the work without downloading or opening the original source file.
_Avoid_: Viewer, generated page, preview file, embedded document

**Artifact Preview Experience**:
The browser module that opens **Artifact Preview** content for **Portfolio Item** and **Case Study** pages, including trigger lookup, modal state, hash behavior, focus return, iframe policy application, and page-specific adapters.
_Avoid_: PDF modal helper, click handler, preview utility

**Shipped Artifact Policy**:
The validation and build policy module that defines which **Artifacts**, data files, routed pages, platform files, and root assets are allowed to ship in the production **Learning Portfolio Site**, including deny rules for editable Office sources and production probe requirements.
_Avoid_: Shipping helper, manifest utility, file list

**Case Study**:
A narrative page or section that explains a selected **Portfolio Item** in context, including audience, challenge, approach, evidence, and impact. A **Case Study** is deeper than a normal **Portfolio Item** listing and should not be used for every item.
_Avoid_: Project page, story, article, detailed card

**Case Study Publication**:
The generation module that turns **Case Study** source data into expanded **Portfolio Items**, routed page identities, generated index and detail pages, and nested **Artifact** metadata through one interface. **Portfolio Item Source Validation**, the **Portfolio Evidence Workflow**, and the **Shipped Artifact Policy** consume these publication facts instead of rebuilding Case Study rules.
_Avoid_: Case Study Model, Case Study renderer, case helper, grouped project logic

**Case Study Page Identity**:
The shared module interface that identifies a generated **Case Study** page, its routed page path, and the navigation page it belongs to. **Case Study Publication** produces it, **Generated Site Chrome** serializes it, and browser and shipping adapters consume it.
_Avoid_: Filename list, route flag, page-type helper

**Generated Site Chrome**:
The generation module that renders shared navigation, stylesheet links, footer markup, and HTML escaping used by generated pages.
_Avoid_: Header helper, layout utility, shared HTML bits

**Learning Portfolio Site Validation**:
The pre-publication module that verifies source pages, styles, links, fragments, external hosts, browser security policy, Publication data, Portfolio Evidence, and Shipped Artifact probes, then returns structured failures and validation counts. Command-line execution is an adapter to this module.
_Avoid_: Validation script, lint command, static checks

**Production Site Inventory Facts**:
The post-build module facts for shipped paths, sizes, extensions, compressed HTML/JavaScript/CSS size, and initial **Artifact Preview** iframe sources. Performance-budget checks consume these facts without repeating production file reads or HTML parsing.
_Avoid_: Dist walker, build file list, budget file helper

**Reviewer**:
A recruiter, hiring manager, potential client, collaborator, or evaluator who visits the **Learning Portfolio Site** to judge credibility, capability, and fit from visible evidence.
_Avoid_: Visitor, user, audience, customer

**Practice Area**:
A recurring capability domain represented by the **Learning Portfolio Site**, such as learning design, training facilitation, coaching, PowerPoint/deck production, evaluation, or learning analytics. In public copy, a **Practice Area** may be described as expertise, but the glossary uses **Practice Area** for categorization.
_Avoid_: Service, category, skill, offering

**Engagement Type**:
A way a **Reviewer** may ask Daffa to apply a **Practice Area**, such as a training engagement, learning-materials engagement, coaching engagement, or analytics/dashboard engagement. The **Learning Portfolio Site** supports both job-application review and freelance-client review.
_Avoid_: Product, package, service card, offer

**Engagement Inquiry Journey**:
The browser module that carries a **Reviewer** from an **Engagement Type** or **Portfolio Item** inquiry into contact context, including query interpretation, form capture, temporary storage, redirect, restoration, channel links, and contact-form aliases through one interface.
_Avoid_: Contact prefill helper, form redirect script, inquiry utility

**Proof Point**:
A concrete evidence element used to support credibility on the **Learning Portfolio Site**, such as a metric, credential, testimonial, artifact, publication, client context, or documented outcome. A claim is not a **Proof Point** unless the site can show or cite evidence for it.
_Avoid_: Claim, highlight, stat, badge

**Publication**:
A written external or on-site article linked from the **Learning Portfolio Site** to demonstrate thinking, communication, or subject-matter perspective. A **Publication** may support a **Practice Area**, but it is not automatically an **Artifact** unless it is also presented as a deliverable.
_Avoid_: Blog post, article, writing sample, content

**Publication Source Facts**:
The module that normalizes structured **Publication** data and owns trusted Medium URL and publication-image host rules. Browser rendering and **Learning Portfolio Site Validation** consume the same facts through separate adapters.
_Avoid_: Blog URL helper, Medium allowlist, post sanitizer

**Learning Program**:
A structured learning experience designed for a defined audience and outcome, such as a training class, workshop series, bootcamp, coaching journey, or blended learning initiative.
_Avoid_: Course, training, class, module

**Learning Material**:
An **Artifact** used to support a **Learning Program**, such as a participant module, facilitator guide, workbook, worksheet, template, job aid, slide deck, or handout.
_Avoid_: Material, handout, module, resource

**Diagnostic Artifact**:
An **Artifact** that captures or analyzes needs before a **Learning Program** is designed or delivered, such as a needs analysis sheet, discovery notes template, baseline assessment, stakeholder interview guide, or capability gap analysis.
_Avoid_: Evaluation artifact, intake form, prep sheet, spreadsheet

**Evaluation Artifact**:
An **Artifact** that captures, analyzes, or presents evidence after or during a **Learning Program**, such as a reaction dashboard, assessment workbook, scorecard, observation rubric, or evaluation report.
_Avoid_: Dashboard, spreadsheet, analytics file, report

**Outcome Evidence**:
A **Proof Point** that describes what changed, what was produced, or what was achieved through a **Learning Program**, **Artifact**, or **Engagement Type**.
_Avoid_: Impact, result, metric, achievement

**Portfolio Evidence Workflow**:
The generation module that consumes the **Validated Portfolio Item Source**, renders visible **Portfolio Item** listings, builds structured portfolio metadata and AI-readable context, includes generated **Case Study** pages, and returns one complete output set for a command adapter to write together. Partial generation is not a supported workflow.
_Avoid_: Portfolio Evidence Pipeline, generation command, build script, output helper, partial generator

**Portfolio Context Inference**:
The generation module that turns a normalized **Portfolio Item** and its **Proof Points** into AI-readable context, including inferred audience, tools, scale signals, non-proof AI hints, direct **Outcome Evidence**, and CV bullet text.
_Avoid_: Catalog helper, keyword utility, AI metadata script

**Portfolio Owner**:
Daffa Ghiffary Kusuma, the person whose learning, facilitation, coaching, analytics, and artifact-production work is represented on the **Learning Portfolio Site**.
_Avoid_: Brand, author, creator, site owner

## Example Dialogue

Dev: Should this new workbook be added as a **Portfolio Item**?

Domain expert: Only if it represents a distinct work sample. If it only supports an existing **Portfolio Item**, treat it as an **Artifact**.

Dev: It was used before the training to identify participant needs.

Domain expert: Then call it a **Diagnostic Artifact**, not an **Evaluation Artifact**.

Dev: Can its listing use a generic illustration with no words?

Domain expert: No. Use a title-bearing **Product Thumbnail**, unless an authentic **Evidence Photograph** from the work is available.

Dev: Can we say it proves impact?

Domain expert: Only call it **Outcome Evidence** when there is a supported metric, output, or documented change. Otherwise describe it as an **Artifact**.
