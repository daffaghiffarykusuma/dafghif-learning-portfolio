import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const portfolioPath = 'portfolio.html';
const outputPath = 'assets/data/portfolio-ai-context.json';

const html = await readFile(portfolioPath, 'utf8');

const decodeHtml = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const stripHtml = (value) => decodeHtml(value.replace(/<[^>]+>/g, ''));

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeText = (value) =>
  value
    .replace(/â€|â€œ/g, '-')
    .replace(/â€”|â€“/g, '-')
    .replace(/\s+-\s+/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();

const categoryProfiles = {
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
      'Produced an earlier portfolio project that demonstrates applied program, people, or learning operations capability.',
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

const inferTools = (project) => {
  const source = project.source.toLowerCase();
  const text = `${project.title} ${project.description} ${project.category}`.toLowerCase();
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

const inferAudience = (project) => {
  const text = `${project.title} ${project.description}`.toLowerCase();
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

const inferScale = (project) => {
  const text = `${project.title} ${project.description}`;
  const matches = [...text.matchAll(/\b\d{1,3}(?:,\d{3})?\+?\b/g)].map((match) => match[0]);
  return matches.length ? matches : [];
};

const inferImpact = (project) => {
  const text = `${project.title} ${project.description}`.toLowerCase();
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

const makeCvBullet = (project, profile, impact) =>
  `${profile.cvVerb} ${project.title} as a ${project.category.toLowerCase()} project, creating practical context for ${project.audience} and supporting this outcome: ${impact}`;

const cardPattern =
  /<div class="card project"(?<attrs>[^>]*)>(?<body>[\s\S]*?)(?=\n\s*<div class="card project"|\n\s*<\/div>\s*<!-- End of combined projects-grid -->|\n\s*<\/div>\s*<!-- PDF Modal)/g;

const projects = [...html.matchAll(cardPattern)].filter((match) => !match.groups.attrs.includes('project-placeholder')).map((match) => {
  const attrs = match.groups.attrs;
  const body = match.groups.body;
  const title = normalizeText(stripHtml((body.match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || ''));
  const category = normalizeText(
    stripHtml((body.match(/project-category-label[\s\S]*?>(?:<a[^>]*>)?([\s\S]*?)(?:<\/a>)?<\/span>/) || [])[1] || '')
  );
  const description = normalizeText(stripHtml((body.match(/<p>([\s\S]*?)<\/p>/) || [])[1] || ''));
  const tags = ((attrs.match(/data-category="([^"]+)"/) || [])[1] || '').split(/\s+/).filter(Boolean);
  const source = ((body.match(/data-viewer="([^"]+)"/) || body.match(/data-pdf="([^"]+)"/) || [])[1] || '').trim();
  const profile = categoryProfiles[category] || categoryProfiles['Learning Materials'];
  const audience = inferAudience({ title, description, category });
  const tools = inferTools({ title, description, category, source });
  const scaleSignals = inferScale({ title, description });
  const impact = inferImpact({ title, description });
  const baseProject = { title, category, audience };

  return {
    id: slugify(title),
    title,
    category,
    tags,
    publicDescription: description,
    sourceArtifact: source,
    aiContext: {
      evidenceLevel: 'inferred from public portfolio card',
      role: profile.defaultRole,
      audience,
      deliverables: profile.defaultDeliverables,
      skills: [...new Set([...profile.defaultSkills, ...tags.map((tag) => tag.replace(/-/g, ' '))])],
      tools,
      scaleSignals,
      impact,
      cvBullet: makeCvBullet(baseProject, profile, impact)
    }
  };
});

const data = {
  schemaVersion: 1,
  generatedFrom: portfolioPath,
  generatedAt: new Date().toISOString(),
  owner: 'Daffa Ghiffary Kusuma',
  positioning:
    'Learning Designer and Program Manager focused on competency-based training, learning assets, evaluation systems, mentoring, and learning analytics.',
  usage:
    'Use this file as AI-readable context for tailored CVs, cover letters, recruiter summaries, and project matching when the original portfolio artifacts are unavailable.',
  evidenceNote:
    'Project titles, categories, descriptions, tags, and source artifact paths are extracted from portfolio.html. Role, audience, deliverables, skills, tools, impact, and CV bullets are inferred from those public snippets and should be refined when exact project details are available.',
  projectCount: projects.length,
  categoryProfiles,
  projects
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

console.log(`Generated ${projects.length} project records at ${outputPath}`);
