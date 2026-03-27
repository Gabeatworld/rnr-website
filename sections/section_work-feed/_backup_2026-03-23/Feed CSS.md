
<style>
/* ===================================================
   FEED BACKGROUNDS — Sticky container approach
   JS extracts backgrounds from .feed-project (where
   GSAP transforms break position:fixed) into a single
   sticky container at the section level.
   =================================================== */
.feed-section {
  position: relative;
}

/* JS-created container that holds all backgrounds */
.feed-bg-sticky {
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
  margin-top: -50vh;    /* start higher so bg is at viewport top during fade-in */
  margin-bottom: -50vh; /* compensate so content below isn't pushed */
}

.feed-bg-sticky .feed-background {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
}

.feed-bg-sticky .feed-background-content {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.feed-bg-sticky .feed-background-image {
  width: 100%;
  height: 130%; /* extra for parallax travel */
  object-fit: cover;
  position: absolute;
  top: -15%;
  left: 0;
  will-change: transform;
}

/* ===================================================
   FEED TITLES — Only active project visible
   Prevents stacking of multiple titles at once
   =================================================== */
.feed-project .feed-info {
  transition: visibility 0s 0.05s;
}

.feed-project:not(.is-active) .feed-info {
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

.feed-project.is-active .feed-info {
  visibility: visible !important;
}

/* ===================================================
   MOBILE / TABLET OVERRIDES
   =================================================== */
@media (max-width: 1200px) {
  .feed-project {
    flex-direction: column;
    align-items: center;
    padding: 0px 0px 160px;
  }

  .feed-project-slider {
    width: 100%;
    height: auto !important;
  }

  .feed-info {
    align-items: center !important;
    text-align: center !important;
    flex-direction: column;
    position: relative !important;
    top: 0px;
  }
}

/* Undo the native Webflow tablet styles so they don't double-fire */
@media (max-width: 991px) {
  .feed-project {
    flex-direction: column; /* already handled, just keep consistent */
  }
}
</style>
