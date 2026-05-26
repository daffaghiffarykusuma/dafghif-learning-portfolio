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

**Artifact**:
A concrete deliverable or source file that provides evidence for a **Portfolio Item**, such as a PDF, slide deck, workbook, document, dashboard, template, or generated preview. Thumbnails, stylesheets, and other supporting site assets are not **Artifacts**.
_Avoid_: Asset, attachment, file, material

**Artifact Preview**:
A browser-readable representation of an **Artifact** used inside the **Learning Portfolio Site** so visitors can inspect the work without downloading or opening the original source file.
_Avoid_: Viewer, generated page, preview file, embedded document

**Case Study**:
A narrative page or section that explains a selected **Portfolio Item** in context, including audience, challenge, approach, evidence, and impact. A **Case Study** is deeper than a normal **Portfolio Item** listing and should not be used for every item.
_Avoid_: Project page, story, article, detailed card

**Case Study Model**:
The generation module that normalizes **Case Study** source data, page paths, featured **Case Study** entries, absorbed **Portfolio Item** IDs, and the **Portfolio Item** representation used by the **Portfolio Evidence Pipeline**.
_Avoid_: Case helper, case data utility, grouped project logic

**Case Study Index Renderer**:
The generation module that renders the **Case Study** listing page and cards from **Case Study Model** data.
_Avoid_: Index helper, page builder, case card utility

**Case Study Page Renderer**:
The generation module that renders a standalone **Case Study** page from **Case Study Model** data, including reviewer context, evidence limits, case flow, included **Artifacts**, and engagement CTA.
_Avoid_: HTML helper, detail page builder, template function

**Generated Site Chrome**:
The generation module that renders shared navigation, stylesheet links, footer markup, and HTML escaping used by generated pages.
_Avoid_: Header helper, layout utility, shared HTML bits

**Reviewer**:
A recruiter, hiring manager, potential client, collaborator, or evaluator who visits the **Learning Portfolio Site** to judge credibility, capability, and fit from visible evidence.
_Avoid_: Visitor, user, audience, customer

**Practice Area**:
A recurring capability domain represented by the **Learning Portfolio Site**, such as learning design, training facilitation, coaching, PowerPoint/deck production, evaluation, or learning analytics. In public copy, a **Practice Area** may be described as expertise, but the glossary uses **Practice Area** for categorization.
_Avoid_: Service, category, skill, offering

**Engagement Type**:
A way a **Reviewer** may ask Daffa to apply a **Practice Area**, such as a training engagement, learning-materials engagement, coaching engagement, or analytics/dashboard engagement. The **Learning Portfolio Site** supports both job-application review and freelance-client review.
_Avoid_: Product, package, service card, offer

**Proof Point**:
A concrete evidence element used to support credibility on the **Learning Portfolio Site**, such as a metric, credential, testimonial, artifact, publication, client context, or documented outcome. A claim is not a **Proof Point** unless the site can show or cite evidence for it.
_Avoid_: Claim, highlight, stat, badge

**Publication**:
A written external or on-site article linked from the **Learning Portfolio Site** to demonstrate thinking, communication, or subject-matter perspective. A **Publication** may support a **Practice Area**, but it is not automatically an **Artifact** unless it is also presented as a deliverable.
_Avoid_: Blog post, article, writing sample, content

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

**Portfolio Evidence Pipeline**:
The generation module that turns the **Portfolio Item Source** and curated **Proof Point** data into visible **Portfolio Item** listings, structured portfolio metadata, and AI-readable portfolio context. It owns Proof Point application so visible copy, metadata, and validation do not drift.
_Avoid_: Proof script, metadata helper, rendering utility

**Portfolio Owner**:
Daffa Ghiffary Kusuma, the person whose learning, facilitation, coaching, analytics, and artifact-production work is represented on the **Learning Portfolio Site**.
_Avoid_: Brand, author, creator, site owner

## Example Dialogue

Dev: Should this new workbook be added as a **Portfolio Item**?

Domain expert: Only if it represents a distinct work sample. If it only supports an existing **Portfolio Item**, treat it as an **Artifact**.

Dev: It was used before the training to identify participant needs.

Domain expert: Then call it a **Diagnostic Artifact**, not an **Evaluation Artifact**.

Dev: Can we say it proves impact?

Domain expert: Only call it **Outcome Evidence** when there is a supported metric, output, or documented change. Otherwise describe it as an **Artifact**.
