// Image Slots: the rendered width of each card image layout, written as `sizes`
// values. Declaring a slot is what opts an <img> into responsive renditions at
// build time (scripts/site/responsive-images.ts). Keep these in step with the
// grid breakpoints in src/styles/site.css; overestimating only costs bytes,
// underestimating renders soft images.
export const IMAGE_SLOT_SIZES = Object.freeze({
  /** `.grid-cols-3` / `.artifact-list`: 3 columns, 2 below 1100px, 1 below 768px. Container max 1240px. */
  threeColumnCard: '(max-width: 767px) 92vw, (max-width: 1100px) 46vw, 400px',
  /** `.case-study-card-grid`: 2 columns, 1 below 768px. */
  twoColumnCard: '(max-width: 767px) 92vw, (max-width: 1340px) 45vw, 600px',
  /** Home `.selected-work-card`: image takes 5/11 of the row, full width below 861px. */
  selectedWork: '(max-width: 860px) 92vw, (max-width: 1340px) 40vw, 520px'
});
