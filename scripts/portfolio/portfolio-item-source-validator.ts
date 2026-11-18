import {
  createCaseStudyPublication,
  type CaseStudyPublication
} from './case-study-publication.ts';
import {
  PORTFOLIO_ITEM_SCHEMA_VERSION,
  normalizePortfolioItem,
  normalizePortfolioItemProof,
  normalizeText
} from './portfolio-item-catalog.ts';
import { portfolioDiscoveryFilters } from '../../src/portfolio-discovery.ts';
import type { PortfolioItem } from './portfolio-item-catalog.ts';

export type PortfolioItemSourceInput = {
  schemaVersion?: unknown;
  portfolioItemCount?: unknown;
  featuredPortfolioItemIds?: unknown;
  featuredCaseStudyIds?: unknown;
  portfolioItems?: unknown;
  caseStudies?: unknown;
  authoredCaseStudies?: unknown;
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
};

export type ValidatedPortfolioItemSource = {
  failures: string[];
  rawPortfolioItemCount: number;
  caseStudyCount: number;
  generatedPortfolioItemCount: number;
  portfolioItems: PortfolioItem[];
  caseStudyPublication: Pick<
    CaseStudyPublication,
    'pages' | 'artifactMetadataByCaseStudyId' | 'featuredPagePaths'
  >;
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
  'portfolioItemUrl'
];
// Derived through the Engagement Inquiry Journey; a source value would be ignored.
const derivedPortfolioItemFields = ['discussUrl'];

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

const applyProofPoints = (
  portfolioItems: PortfolioItem[],
  proofSource: ProofPointSourceInput
): PortfolioItem[] => {
  const practiceAreaDefaults = asRecord(proofSource.practiceAreaDefaults);
  const itemOverrides = asRecord(proofSource.itemOverrides);
  return portfolioItems.map((portfolioItem) => {
    const defaultProof = normalizePortfolioItemProof(practiceAreaDefaults[portfolioItem.practiceArea]);
    const overrideProof = normalizePortfolioItemProof(itemOverrides[portfolioItem.id]);
    return {
      ...portfolioItem,
      proof: {
        visibleProofLine: overrideProof.visibleProofLine || defaultProof.visibleProofLine,
        workQuality: overrideProof.workQuality.length
          ? overrideProof.workQuality
          : defaultProof.workQuality,
        impact: overrideProof.impact
      }
    };
  });
};

export const validatePortfolioItemSource = ({
  portfolioSource,
  proofSource = {}
}: ValidatePortfolioItemSourceOptions = {}): ValidatedPortfolioItemSource => {
  const source = asRecord(portfolioSource) as PortfolioItemSourceInput;
  const proof = asRecord(proofSource) as ProofPointSourceInput;
  const failures: string[] = [];
  const knownPracticeAreas = new Set(
    portfolioDiscoveryFilters.areas.filter(({ value }) => value !== 'all').map(({ label }) => label)
  );
  const portfolioItems = Array.isArray(source.portfolioItems)
    ? source.portfolioItems.map(asRecord)
    : [];
  // Case Study Publication owns the Case Study part of the schema and reports it.
  const caseStudyPublication = createCaseStudyPublication(source);

  if (source.schemaVersion !== PORTFOLIO_ITEM_SCHEMA_VERSION) {
    failures.push(
      `${sourceFile}: schemaVersion must be ${PORTFOLIO_ITEM_SCHEMA_VERSION}; received ${source.schemaVersion ?? 'missing'}`
    );
  }
  if (!Array.isArray(source.portfolioItems)) {
    failures.push(`${sourceFile}: portfolioItems must be an array`);
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
    for (const field of derivedPortfolioItemFields) {
      if (field in item) failures.push(`${sourceFile}: ${label} ${field} is derived from the title; remove it from the source`);
    }
    if (!Array.isArray(item?.tags) || item.tags.length === 0) {
      failures.push(`${sourceFile}: ${label} must declare at least one tag`);
    }
  });

  failures.push(...caseStudyPublication.failures);

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
    caseStudyCount: Array.isArray(source.caseStudies) ? source.caseStudies.length : 0,
    generatedPortfolioItemCount: generatedItems.length,
    portfolioItems: applyProofPoints(validatedPortfolioItems, proof),
    caseStudyPublication: {
      pages: caseStudyPublication.pages,
      artifactMetadataByCaseStudyId: caseStudyPublication.artifactMetadataByCaseStudyId,
      featuredPagePaths: caseStudyPublication.featuredPagePaths
    }
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
