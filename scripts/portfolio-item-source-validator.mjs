import { createCaseStudyPublication } from './case-study-publication.mjs';
import {
  PORTFOLIO_ITEM_SCHEMA_VERSION,
  normalizePortfolioItem,
  normalizeText
} from './portfolio-item-catalog.mjs';
import { practiceAreaProfiles } from './portfolio-context-inference.mjs';

const sourceFile = 'assets/data/portfolio-source.json';
const proofFile = 'assets/data/portfolio-proof-points.json';
const requiredPortfolioItemFields = [
  'id',
  'title',
  'practiceArea',
  'description',
  'sourceArtifact',
  'sourceType',
  'portfolioItemUrl',
  'discussUrl'
];
const requiredCaseStudyFields = [
  'id',
  'title',
  'portfolioItemTitle',
  'practiceArea',
  'description',
  'summary',
  'pagePath',
  'outputPath'
];
const requiredArtifactFields = [
  'id',
  'title',
  'description',
  'href',
  'sourceType',
  'practiceArea'
];
const rootHtmlPathPattern = /^[^/\\]+\.html$/i;
const projectHtmlPathPattern = /^(?![A-Za-z]:)(?![/\\])(?!.*(?:^|[/\\])\.\.(?:[/\\]|$)).+\.html$/i;

const addDuplicateFailures = ({ values, label, failures }) => {
  const seen = new Set();
  for (const value of values.map(normalizeText).filter(Boolean)) {
    if (seen.has(value)) failures.push(`${sourceFile}: duplicate ${label} "${value}"`);
    seen.add(value);
  }
};

const validateRequiredFields = ({ record, fields, label, failures }) => {
  for (const field of fields) {
    if (!normalizeText(record?.[field])) {
      failures.push(`${sourceFile}: ${label} is missing ${field}`);
    }
  }
};

const validateImage = ({ record, label, failures }) => {
  if (!normalizeText(record?.image?.src)) {
    failures.push(`${sourceFile}: ${label} is missing image.src`);
  }
  if (!normalizeText(record?.image?.alt)) {
    failures.push(`${sourceFile}: ${label} is missing image.alt`);
  }
};

const validatePracticeArea = ({ practiceArea, label, knownPracticeAreas, failures }) => {
  const normalizedPracticeArea = normalizeText(practiceArea);
  if (normalizedPracticeArea && !knownPracticeAreas.has(normalizedPracticeArea)) {
    failures.push(`${sourceFile}: ${label} uses unknown Practice Area "${normalizedPracticeArea}"`);
  }
};

const validateRootHtmlPath = ({ value, field, label, failures }) => {
  if (normalizeText(value) && !rootHtmlPathPattern.test(normalizeText(value))) {
    failures.push(`${sourceFile}: ${label} ${field} must be a root-level .html path`);
  }
};

const validateProjectHtmlPath = ({ value, field, label, failures }) => {
  if (normalizeText(value) && !projectHtmlPathPattern.test(normalizeText(value))) {
    failures.push(`${sourceFile}: ${label} ${field} must be a project-relative .html path`);
  }
};

const prioritizeFeaturedPortfolioItems = (portfolioItems, featuredIds = []) => {
  const itemsById = new Map(portfolioItems.map((item) => [item.id, item]));
  const featured = featuredIds.map((id) => itemsById.get(normalizeText(id))).filter(Boolean);
  const featuredIdSet = new Set(featured.map((item) => item.id));
  return [...featured, ...portfolioItems.filter((item) => !featuredIdSet.has(item.id))];
};

export const validatePortfolioItemSource = ({
  portfolioSource,
  proofSource = {},
  profiles = practiceAreaProfiles
} = {}) => {
  const failures = [];
  const knownPracticeAreas = new Set(Object.keys(profiles));
  const portfolioItems = Array.isArray(portfolioSource?.portfolioItems)
    ? portfolioSource.portfolioItems
    : [];
  const caseStudies = Array.isArray(portfolioSource?.caseStudies)
    ? portfolioSource.caseStudies
    : [];
  const caseStudyPublication = createCaseStudyPublication({
    ...(portfolioSource || {}),
    portfolioItems,
    caseStudies
  });

  if (portfolioSource?.schemaVersion !== PORTFOLIO_ITEM_SCHEMA_VERSION) {
    failures.push(
      `${sourceFile}: schemaVersion must be ${PORTFOLIO_ITEM_SCHEMA_VERSION}; received ${portfolioSource?.schemaVersion ?? 'missing'}`
    );
  }
  if (!Array.isArray(portfolioSource?.portfolioItems)) {
    failures.push(`${sourceFile}: portfolioItems must be an array`);
  }
  if (!Array.isArray(portfolioSource?.caseStudies)) {
    failures.push(`${sourceFile}: caseStudies must be an array`);
  }
  if (portfolioSource?.portfolioItemCount !== portfolioItems.length) {
    failures.push(
      `${sourceFile}: portfolioItemCount must equal raw portfolioItems length; declared=${portfolioSource?.portfolioItemCount ?? 'missing'}, actual=${portfolioItems.length}`
    );
  }

  addDuplicateFailures({
    values: portfolioItems.map((item) => item?.id),
    label: 'Portfolio Item id',
    failures
  });
  portfolioItems.forEach((item, index) => {
    const id = normalizeText(item?.id) || `record ${index + 1}`;
    const label = `Portfolio Item "${id}"`;
    validateRequiredFields({ record: item, fields: requiredPortfolioItemFields, label, failures });
    validateImage({ record: item, label, failures });
    validatePracticeArea({
      practiceArea: item?.practiceArea,
      label,
      knownPracticeAreas,
      failures
    });
    if (!Array.isArray(item?.tags) || item.tags.length === 0) {
      failures.push(`${sourceFile}: ${label} must declare at least one tag`);
    }
  });

  addDuplicateFailures({
    values: caseStudies.map((caseStudy) => caseStudy?.id),
    label: 'Case Study id',
    failures
  });
  addDuplicateFailures({
    values: caseStudyPublication.pageIdentities.map((identity) => identity.pagePath),
    label: 'Case Study pagePath',
    failures
  });
  addDuplicateFailures({
    values: caseStudies.map((caseStudy) => caseStudy?.outputPath),
    label: 'Case Study outputPath',
    failures
  });

  const rawPortfolioItemIds = new Set(portfolioItems.map((item) => normalizeText(item?.id)).filter(Boolean));
  const absorbedOwners = new Map();
  caseStudies.forEach((caseStudy, index) => {
    const id = normalizeText(caseStudy?.id) || `record ${index + 1}`;
    const label = `Case Study "${id}"`;
    validateRequiredFields({ record: caseStudy, fields: requiredCaseStudyFields, label, failures });
    validateImage({ record: caseStudy, label, failures });
    validatePracticeArea({
      practiceArea: caseStudy?.practiceArea,
      label,
      knownPracticeAreas,
      failures
    });
    validateRootHtmlPath({ value: caseStudy?.pagePath, field: 'pagePath', label, failures });
    validateProjectHtmlPath({ value: caseStudy?.outputPath, field: 'outputPath', label, failures });
    for (const field of ['reviewerContext', 'caseFlow', 'artifacts']) {
      if (!Array.isArray(caseStudy?.[field])) {
        failures.push(`${sourceFile}: ${label} ${field} must be an array`);
      }
    }

    const absorbedIds = Array.isArray(caseStudy?.absorbedPortfolioItemIds)
      ? caseStudy.absorbedPortfolioItemIds.map(normalizeText).filter(Boolean)
      : [];
    for (const absorbedId of absorbedIds) {
      if (!rawPortfolioItemIds.has(absorbedId)) {
        failures.push(`${sourceFile}: ${label} absorbs missing Portfolio Item "${absorbedId}"`);
      }
      const existingOwner = absorbedOwners.get(absorbedId);
      if (existingOwner) {
        failures.push(
          `${sourceFile}: Portfolio Item "${absorbedId}" is absorbed by both Case Study "${existingOwner}" and "${id}"`
        );
      } else {
        absorbedOwners.set(absorbedId, id);
      }
    }

    const artifacts = Array.isArray(caseStudy?.artifacts) ? caseStudy.artifacts : [];
    addDuplicateFailures({
      values: artifacts.map((artifact) => artifact?.id),
      label: `${label} Artifact id`,
      failures
    });
    artifacts.forEach((artifact, artifactIndex) => {
      const artifactId = normalizeText(artifact?.id) || `record ${artifactIndex + 1}`;
      const artifactLabel = `${label} Artifact "${artifactId}"`;
      validateRequiredFields({
        record: artifact,
        fields: requiredArtifactFields,
        label: artifactLabel,
        failures
      });
      validateImage({ record: artifact, label: artifactLabel, failures });
      validatePracticeArea({
        practiceArea: artifact?.practiceArea,
        label: artifactLabel,
        knownPracticeAreas,
        failures
      });
      if (!Array.isArray(artifact?.tags) || artifact.tags.length === 0) {
        failures.push(`${sourceFile}: ${artifactLabel} must declare at least one tag`);
      }
    });
  });

  const generatedItems = caseStudyPublication.portfolioItems;
  const validatedPortfolioItems = prioritizeFeaturedPortfolioItems(
    generatedItems.map(normalizePortfolioItem),
    Array.isArray(portfolioSource?.featuredPortfolioItemIds)
      ? portfolioSource.featuredPortfolioItemIds
      : []
  );
  const generatedItemIds = new Set(generatedItems.map((item) => normalizeText(item?.id)).filter(Boolean));
  addDuplicateFailures({
    values: generatedItems.map((item) => item?.id),
    label: 'generated Portfolio Item id',
    failures
  });
  if (!Array.isArray(portfolioSource?.featuredPortfolioItemIds)) {
    failures.push(`${sourceFile}: featuredPortfolioItemIds must be an array`);
  } else {
    addDuplicateFailures({
      values: portfolioSource.featuredPortfolioItemIds,
      label: 'featured Portfolio Item id',
      failures
    });
    for (const featuredId of portfolioSource.featuredPortfolioItemIds.map(normalizeText).filter(Boolean)) {
      if (!generatedItemIds.has(featuredId)) {
        failures.push(`${sourceFile}: featured Portfolio Item "${featuredId}" does not reference a generated Portfolio Item`);
      }
    }
  }

  const practiceAreaDefaults = proofSource?.practiceAreaDefaults;
  if (!practiceAreaDefaults || typeof practiceAreaDefaults !== 'object' || Array.isArray(practiceAreaDefaults)) {
    failures.push(`${proofFile}: practiceAreaDefaults must be an object`);
  } else {
    for (const practiceArea of Object.keys(practiceAreaDefaults)) {
      validatePracticeArea({
        practiceArea,
        label: `practiceAreaDefault "${practiceArea}"`,
        knownPracticeAreas,
        failures
      });
    }
  }

  const itemOverrides = proofSource?.itemOverrides || {};
  if (typeof itemOverrides !== 'object' || Array.isArray(itemOverrides)) {
    failures.push(`${proofFile}: itemOverrides must be an object`);
  } else {
    for (const itemId of Object.keys(itemOverrides)) {
      if (!generatedItemIds.has(normalizeText(itemId))) {
        failures.push(`${proofFile}: itemOverride "${itemId}" does not reference a generated Portfolio Item`);
      }
    }
  }

  return {
    failures,
    rawPortfolioItemCount: portfolioItems.length,
    caseStudyCount: caseStudies.length,
    generatedPortfolioItemCount: generatedItems.length,
    portfolioItems: validatedPortfolioItems
  };
};

export class PortfolioItemSourceValidationError extends Error {
  constructor(failures) {
    super(`Portfolio Item Source validation failed:\n- ${failures.join('\n- ')}`);
    this.name = 'PortfolioItemSourceValidationError';
    this.failures = failures;
  }
}

export const assertValidPortfolioItemSource = (options = {}) => {
  const result = validatePortfolioItemSource(options);
  if (result.failures.length > 0) {
    throw new PortfolioItemSourceValidationError(result.failures);
  }
  return result;
};
