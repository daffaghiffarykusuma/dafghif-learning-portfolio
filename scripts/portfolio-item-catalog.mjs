export const PORTFOLIO_ITEM_SCHEMA_VERSION = 1;

export const normalizeText = (value = '') => String(value).replace(/\s+/g, ' ').trim();

export const slugify = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const practiceAreaProfiles = {
  'Training Needs Analysis': {
    defaultRole:
      'Diagnosed learning and performance gaps, translated findings into training priorities, and prepared design-ready recommendations.',
    defaultDeliverables: ['needs analysis', 'gap diagnosis', 'learning priorities'],
    defaultSkills: ['training needs analysis', 'performance consulting', 'competency mapping', 'learning design'],
    cvVerb: 'Diagnosed'
  },
  'Training Proposal': {
    defaultRole:
      'Converted learning needs into a structured proposal with objectives, program logic, delivery plan, and expected outcomes.',
    defaultDeliverables: ['training proposal', 'program objectives', 'delivery plan'],
    defaultSkills: ['proposal development', 'instructional design', 'curriculum planning', 'stakeholder communication'],
    cvVerb: 'Developed'
  },
  'Instructional Design': {
    defaultRole:
      'Structured learning objectives, session flow, learner activities, practice tasks, and evidence of competency.',
    defaultDeliverables: ['lesson plan', 'learning flow', 'practice activities'],
    defaultSkills: ['instructional design', 'competency-based learning', 'activity design', 'assessment alignment'],
    cvVerb: 'Designed'
  },
  'Curriculum Development': {
    defaultRole:
      'Mapped competencies, learning sequence, program structure, and evidence requirements into a usable curriculum asset.',
    defaultDeliverables: ['curriculum map', 'competency matrix', 'syllabus'],
    defaultSkills: ['curriculum development', 'competency mapping', 'learning architecture', 'program design'],
    cvVerb: 'Built'
  },
  'Learning Materials': {
    defaultRole:
      'Created facilitator-ready learning materials that convert concepts into structured explanations, activities, and learner prompts.',
    defaultDeliverables: ['training deck', 'facilitator material', 'learner activities'],
    defaultSkills: ['learning material development', 'presentation design', 'facilitation design', 'adult learning'],
    cvVerb: 'Created'
  },
  'Assessment & Evaluation': {
    defaultRole:
      'Designed assessment and evaluation tools to measure learner understanding, behavior, quality, or decision readiness.',
    defaultDeliverables: ['assessment tool', 'evaluation form', 'scoring structure'],
    defaultSkills: ['assessment design', 'learning evaluation', 'rubric design', 'measurement'],
    cvVerb: 'Designed'
  },
  'Learning Analytics': {
    defaultRole:
      'Converted learning data, response inputs, or budget assumptions into analysis-ready dashboards and decision tools.',
    defaultDeliverables: ['analysis dashboard', 'calculation model', 'decision report'],
    defaultSkills: ['learning analytics', 'dashboard design', 'Kirkpatrick evaluation', 'spreadsheet modeling'],
    cvVerb: 'Built'
  },
  'L&D Strategy': {
    defaultRole:
      'Framed learning products, business goals, capability priorities, and growth logic into an actionable L&D plan.',
    defaultDeliverables: ['strategy plan', 'business roadmap', 'portfolio positioning'],
    defaultSkills: ['L&D strategy', 'business planning', 'program portfolio design', 'go-to-market planning'],
    cvVerb: 'Framed'
  },
  'Mentoring & Coaching': {
    defaultRole:
      'Structured mentoring activities, reflection prompts, and action planning tools to help learners move from insight to execution.',
    defaultDeliverables: ['mentoring workbook', 'reflection prompts', 'action plan'],
    defaultSkills: ['mentoring design', 'coaching tools', 'workbook design', 'learner reflection'],
    cvVerb: 'Structured'
  },
  'Presentation Design': {
    defaultRole:
      'Organized complex ideas into a clear slide narrative, evidence structure, and presentation-ready flow.',
    defaultDeliverables: ['presentation template', 'slide narrative', 'pitch structure'],
    defaultSkills: ['presentation design', 'storytelling', 'visual communication', 'pitch design'],
    cvVerb: 'Designed'
  },
  'Custom Training & Workshops': {
    defaultRole:
      'Designed and delivered applied training or workshop experiences using practical activities, facilitation, and implementation support.',
    defaultDeliverables: ['workshop design', 'facilitation plan', 'participant activities'],
    defaultSkills: ['training facilitation', 'workshop design', 'experiential learning', 'program delivery'],
    cvVerb: 'Delivered'
  },
  'Review: Legacy Project': {
    defaultRole:
      'Produced an earlier portfolio item that demonstrates applied program, people, or learning operations capability.',
    defaultDeliverables: ['legacy project artifact', 'operational framework', 'implementation support'],
    defaultSkills: ['program design', 'people development', 'operations improvement', 'stakeholder collaboration'],
    cvVerb: 'Created'
  },
  'Mentoring & Speaking': {
    defaultRole:
      'Designed a mentoring or speaking asset that helps learners build confidence, communication, and professional influence.',
    defaultDeliverables: ['speaking material', 'mentoring prompts', 'reflection activities'],
    defaultSkills: ['mentoring', 'public speaking', 'career development', 'storytelling'],
    cvVerb: 'Created'
  }
};

export const getPortfolioItemSourceItems = (portfolioSource) => {
  if (Array.isArray(portfolioSource?.portfolioItems)) return portfolioSource.portfolioItems;
  if (Array.isArray(portfolioSource?.projects)) return portfolioSource.projects;
  return [];
};

export const parsePortfolioItemsFromDocument = (document) =>
  Array.from(document.querySelectorAll('.card.portfolio-item'))
    .filter((card) => !card.classList.contains('portfolio-item-placeholder'))
    .map(parsePortfolioItemCard);

export const parsePortfolioItemCard = (card) => {
  const title = normalizeText(card.querySelector('h3')?.textContent || '');
  const practiceArea = normalizeText(card.querySelector('.portfolio-item-practice-label')?.textContent || '');
  const description = normalizeText(card.querySelector('.card-content p')?.textContent || '');
  const image = card.querySelector('.card-image img');
  const detailsButton = card.querySelector('.view-details-button');
  const discussLink = card.querySelector('.card-actions a[href^="contact.html"]');

  return normalizePortfolioItem({
    id: card.id || card.dataset.portfolioItemId || card.dataset.projectId || '',
    title,
    practiceArea,
    tags: (card.dataset.category || '').split(/\s+/).filter(Boolean),
    description,
    image: {
      src: image?.getAttribute('src') || '',
      alt: image?.getAttribute('alt') || title
    },
    sourceArtifact: detailsButton?.dataset.pdf || detailsButton?.dataset.viewer || '',
    sourceType: detailsButton?.dataset.pdf ? 'pdf' : detailsButton?.dataset.viewer ? 'html-viewer' : '',
    portfolioItemUrl: card.dataset.portfolioItemUrl || card.dataset.projectUrl || (card.id ? `portfolio.html#${card.id}` : ''),
    discussUrl: discussLink?.getAttribute('href') || ''
  });
};

export const normalizePortfolioItem = (sourceItem) => {
  const title = normalizeText(sourceItem.title);
  const practiceArea = normalizeText(sourceItem.practiceArea || sourceItem.category);

  return {
    id: normalizeText(sourceItem.id) || slugify(title),
    title,
    practiceArea,
    tags: Array.isArray(sourceItem.tags) ? sourceItem.tags.map(normalizeText).filter(Boolean) : [],
    description: normalizeText(sourceItem.description || sourceItem.publicDescription),
    image: {
      src: normalizeText(sourceItem.image?.src),
      alt: normalizeText(sourceItem.image?.alt) || title
    },
    sourceArtifact: normalizeText(sourceItem.sourceArtifact || sourceItem.source),
    sourceType: normalizeText(sourceItem.sourceType),
    portfolioItemUrl: normalizeText(sourceItem.portfolioItemUrl || sourceItem.projectUrl),
    discussUrl: normalizeText(sourceItem.discussUrl),
    proof: sourceItem.proof || {
      visibleProofLine: '',
      workQuality: [],
      impact: []
    }
  };
};

export const createPortfolioCatalogData = ({ generatedFrom, portfolioItems, generatedAt = new Date().toISOString() }) => ({
  schemaVersion: PORTFOLIO_ITEM_SCHEMA_VERSION,
  generatedFrom,
  generatedAt,
  portfolioItemCount: portfolioItems.length,
  portfolioItems
});

export const inferTools = (portfolioItem) => {
  const source = (portfolioItem.sourceArtifact || '').toLowerCase();
  const text = `${portfolioItem.title} ${portfolioItem.description} ${portfolioItem.practiceArea}`.toLowerCase();
  const tools = new Set();

  if (source.endsWith('.xlsx') || source.includes('portfolio-viewers') || text.includes('dashboard') || text.includes('calculator')) {
    tools.add('Excel or Google Sheets');
  }
  if (source.endsWith('.pptx') || text.includes('deck') || text.includes('presentation') || text.includes('pitch')) {
    tools.add('PowerPoint or Google Slides');
  }
  if (source.endsWith('.pdf')) {
    tools.add('PDF learning artifact');
  }
  if (text.includes('ai ') || text.includes(' ai') || text.includes('sentiment')) {
    tools.add('AI-enabled analysis concepts');
  }

  return [...tools];
};

export const inferAudience = (portfolioItem) => {
  const text = `${portfolioItem.title} ${portfolioItem.description}`.toLowerCase();
  if (text.includes('smk')) return 'vocational students';
  if (text.includes('msme') || text.includes('umkm')) return 'MSME owners and entrepreneurs';
  if (text.includes('student') || text.includes('graduate') || text.includes('scholarship')) return 'students and early-career talent';
  if (text.includes('manager') || text.includes('supervisor') || text.includes('leader')) return 'managers and team leaders';
  if (text.includes('crew') || text.includes('maritime') || text.includes('onboard')) return 'maritime professionals';
  if (text.includes('entrepreneur') || text.includes('startup') || text.includes('business')) return 'entrepreneurs and startup founders';
  if (text.includes('sales')) return 'sales teams';
  if (text.includes('corporate') || text.includes('workplace') || text.includes('employee')) return 'working professionals';
  return 'learners, teams, or program stakeholders';
};

export const inferScale = (portfolioItem) => {
  const text = `${portfolioItem.title} ${portfolioItem.description}`;
  return [...text.matchAll(/\b\d{1,3}(?:,\d{3})?\+?\b/g)].map((match) => match[0]);
};

export const inferApplicationHint = (portfolioItem) => {
  const text = `${portfolioItem.title} ${portfolioItem.description}`.toLowerCase();
  if (text.includes('needs') || text.includes('gap')) {
    return 'Clarified the real performance gap before investing in training design or delivery.';
  }
  if (text.includes('dashboard') || text.includes('learning data')) {
    return 'Improved visibility into learning data so decisions, remediation, and program improvements could be made faster.';
  }
  if (text.includes('assessment') || text.includes('rubric') || text.includes('post-test') || text.includes('feedback')) {
    return 'Made learning outcomes and participant experience easier to measure, compare, and improve.';
  }
  if (text.includes('proposal') || text.includes('business plan') || text.includes('marketing plan')) {
    return 'Turned learning ideas into a clearer plan for stakeholder alignment, delivery, and business decision-making.';
  }
  if (text.includes('workbook') || text.includes('worksheet') || text.includes('template')) {
    return 'Gave learners and facilitators practical tools for reflection, planning, and follow-through.';
  }
  if (text.includes('bootcamp') || text.includes('program') || text.includes('seminar') || text.includes('workshop')) {
    return 'Supported applied learning through structured activities, facilitation, and practical implementation tasks.';
  }
  return 'Converted a learning topic into a usable artifact that supports understanding, practice, and application.';
};

export const getDirectOutcomeEvidence = (portfolioItem) =>
  (Array.isArray(portfolioItem.proof?.impact) ? portfolioItem.proof.impact : [])
    .filter((entry) => normalizeText(entry.claim) && normalizeText(entry.confidence) === 'direct')
    .map((entry) => ({
      claim: normalizeText(entry.claim),
      sourceBasis: normalizeText(entry.sourceBasis),
      confidence: normalizeText(entry.confidence)
    }));

export const makeCvBullet = (portfolioItem, profile, outcomeEvidence, applicationHint) => {
  const supportedOutcome = outcomeEvidence[0]?.claim;
  const evidenceClause = supportedOutcome
    ? `with supported outcome evidence: ${supportedOutcome}`
    : `with a non-proof AI application hint: ${applicationHint}`;

  return `${profile.cvVerb} ${portfolioItem.title} as a ${portfolioItem.practiceArea.toLowerCase()} portfolio item, creating practical context for ${portfolioItem.audience}, ${evidenceClause}`;
};

export const createAiContextPortfolioItem = (sourceItem) => {
  const item = normalizePortfolioItem(sourceItem);
  const profile = practiceAreaProfiles[item.practiceArea] || practiceAreaProfiles['Learning Materials'];
  const audience = inferAudience(item);
  const tools = inferTools(item);
  const scaleSignals = inferScale(item);
  const outcomeEvidence = getDirectOutcomeEvidence(item);
  const applicationHint = inferApplicationHint(item);
  const baseItem = { title: item.title, practiceArea: item.practiceArea, audience };

  return {
    id: item.id,
    title: item.title,
    practiceArea: item.practiceArea,
    tags: item.tags,
    publicDescription: item.description,
    sourceArtifact: item.sourceArtifact,
    aiContext: {
      evidenceLevel: 'inferred from structured portfolio source',
      role: profile.defaultRole,
      audience,
      deliverables: profile.defaultDeliverables,
      skills: [...new Set([...profile.defaultSkills, ...item.tags.map((tag) => tag.replace(/-/g, ' '))])],
      tools,
      scaleSignals,
      aiHint: {
        evidenceLevel: 'inferred non-proof drafting hint',
        application: applicationHint
      },
      outcomeEvidence,
      proof: item.proof,
      cvBullet: makeCvBullet(baseItem, profile, outcomeEvidence, applicationHint)
    }
  };
};
