import { createCaseStudyPublication } from './case-study-publication.ts';
import {
  PORTFOLIO_ITEM_SCHEMA_VERSION,
  normalizePortfolioItem,
  normalizeText
} from './portfolio-item-catalog.ts';
import { practiceAreaProfiles } from './portfolio-context-inference.ts';
import type { PortfolioItem } from './portfolio-item-catalog.ts';

export type PortfolioItemSourceInput = {
  schemaVersion?: unknown;
  portfolioItemCount?: unknown;
  featuredPortfolioItemIds?: unknown;
  portfolioItems?: unknown;
  caseStudies?: unknown;
  [key: string]: unknown;
};

export type ProofPointSourceInput = {
  practiceAreaDefaults?: unknown;
  itemOverrides?: unknown;
  [key: string]: unknown;
};

export type ValidatePortfolioItemSourceOptions = {
  portfolioSource?: unknown;
  proofSource?: unknown;
  profiles?: Record<string, unknown>;
};

export type ValidatedPortfolioItemSource = {
  failures: string[];
  rawPortfolioItemCount: number;
  caseStudyCount: number;
  generatedPortfolioItemCount: number;
  portfolioItems: PortfolioItem[];
};

type ValidationFailures = { failures: string[] };

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

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

const addDuplicateFailures = ({
  values,
  label,
  failures
}: ValidationFailures & { values: unknown[]; label: string }) => {
  const seen = new Set<string>();
  for (const value of values.map(normalizeText).filter(Boolean)) {
    if (seen.has(value)) failures.push(`${sourceFile}: duplicate ${label} "${value}"`);
    seen.add(value);
  }
};

const validateRequiredFields = ({
  record,
  fields,
  label,
  failures
}: ValidationFailures & {
  record: Record<string, unknown>;
  fields: readonly string[];
  label: string;
}) => {
  for (const field of fields) {
    if (!normalizeText(record?.[field])) {
      failures.push(`${sourceFile}: ${label} is missing ${field}`);
    }
  }
};

const validateImage = ({
  record,
  label,
  failures
}: ValidationFailures & { record: Record<string, unknown>; label: string }) => {
  const image = asRecord(record.image);
  if (!normalizeText(image.src)) {
    failures.push(`${sourceFile}: ${label} is missing image.src`);
  }
  if (!normalizeText(image.alt)) {
    failures.push(`${sourceFile}: ${label} is missing image.alt`);
  }
};

const validatePracticeArea = ({
  practiceArea,
  label,
  knownPracticeAreas,
  failures
}: ValidationFailures & {
  practiceArea: unknown;
  label: string;
  knownPracticeAreas: Set<string>;
}) => {
  const normalizedPracticeArea = normalizeText(practiceArea);
  if (normalizedPracticeArea && !knownPracticeAreas.has(normalizedPracticeArea)) {
    failures.push(`${sourceFile}: ${label} uses unknown Practice Area "${normalizedPracticeArea}"`);
  }
};

const validateRootHtmlPath = ({
  value,
  field,
  label,
  failures
}: ValidationFailures & { value: unknown; field: string; label: string }) => {
  if (normalizeText(value) && !rootHtmlPathPattern.test(normalizeText(value))) {
    failures.push(`${sourceFile}: ${label} ${field} must be a root-level .html path`);
  }
};

const validateProjectHtmlPath = ({
  value,
  field,
  label,
  failures
}: ValidationFailures & { value: unknown; field: string; label: string }) => {
  if (normalizeText(value) && !projectHtmlPathPattern.test(normalizeText(value))) {
    failures.push(`${sourceFile}: ${label} ${field} must be a project-relative .html path`);
  }
};

const prioritizeFeaturedPortfolioItems = (
  portfolioItems: PortfolioItem[],
  featuredIds: unknown[] = []
): PortfolioItem[] => {
  const itemsById = new Map(portfolioItems.map((item) => [item.id, item]));
  const featured = featuredIds
    .map((id) => itemsById.get(normalizeText(id)))
    .filter((item): item is PortfolioItem => Boolean(item));
  const featuredIdSet = new Set(featured.map((item) => item.id));
  return [...featured, ...portfolioItems.filter((item) => !featuredIdSet.has(item.id))];
};

export const validatePortfolioItemSource = ({
  portfolioSource,
  proofSource = {},
  profiles = practiceAreaProfiles
}: ValidatePortfolioItemSourceOptions = {}): ValidatedPortfolioItemSource => {
  const source = asRecord(portfolioSource) as PortfolioItemSourceInput;
  const proof = asRecord(proofSource) as ProofPointSourceInput;
  const failures: string[] = [];
  const knownPracticeAreas = new Set(Object.keys(profiles));
  const portfolioItems = Array.isArray(source.portfolioItems)
    ? source.portfolioItems.map(asRecord)
    : [];
  const caseStudies = Array.isArray(source.caseStudies)
    ? source.caseStudies.map(asRecord)
    : [];
  const caseStudyPublication = createCaseStudyPublication({
    ...source,
    portfolioItems,
    caseStudies
  });

  if (source.schemaVersion !== PORTFOLIO_ITEM_SCHEMA_VERSION) {
    failures.push(
      `${sourceFile}: schemaVersion must be ${PORTFOLIO_ITEM_SCHEMA_VERSION}; received ${source.schemaVersion ?? 'missing'}`
    );
  }
  if (!Array.isArray(source.portfolioItems)) {
    failures.push(`${sourceFile}: portfolioItems must be an array`);
  }
  if (!Array.isArray(source.caseStudies)) {
    failures.push(`${sourceFile}: caseStudies must be an array`);
  }
  if (source.portfolioItemCount !== portfolioItems.length) {
    failures.push(
      `${sourceFile}: portfolioItemCount must equal raw portfolioItems length; declared=${source.portfolioItemCount ?? 'missing'}, actual=${portfolioItems.length}`
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
  const absorbedOwners = new Map<string, string>();
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

    const artifacts = Array.isArray(caseStudy.artifacts)
      ? caseStudy.artifacts.map(asRecord)
      : [];
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
    Array.isArray(source.featuredPortfolioItemIds)
      ? source.featuredPortfolioItemIds
      : []
  );
  const generatedItemIds = new Set(generatedItems.map((item) => normalizeText(item?.id)).filter(Boolean));
  addDuplicateFailures({
    values: generatedItems.map((item) => item?.id),
    label: 'generated Portfolio Item id',
    failures
  });
  if (!Array.isArray(source.featuredPortfolioItemIds)) {
    failures.push(`${sourceFile}: featuredPortfolioItemIds must be an array`);
  } else {
    addDuplicateFailures({
      values: source.featuredPortfolioItemIds,
      label: 'featured Portfolio Item id',
      failures
    });
    for (const featuredId of source.featuredPortfolioItemIds.map(normalizeText).filter(Boolean)) {
      if (!generatedItemIds.has(featuredId)) {
        failures.push(`${sourceFile}: featured Portfolio Item "${featuredId}" does not reference a generated Portfolio Item`);
      }
    }
  }

  const practiceAreaDefaults = proof.practiceAreaDefaults;
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

  const itemOverrides = proof.itemOverrides || {};
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

export const assertValidPortfolioItemSource = (
  options: ValidatePortfolioItemSourceOptions = {}
): ValidatedPortfolioItemSource => {
  const result = validatePortfolioItemSource(options);
  if (result.failures.length > 0) {
    throw new Error(`Portfolio Item Source validation failed:\n- ${result.failures.join('\n- ')}`);
  }
  return result;
};
