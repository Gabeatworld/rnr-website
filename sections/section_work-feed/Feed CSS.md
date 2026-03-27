
<style>
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
