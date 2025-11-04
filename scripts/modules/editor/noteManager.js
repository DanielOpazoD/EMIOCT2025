export function createNoteManager({
  registry,
  noteTypes,
  scheduleTopicNoteIndicatorRefresh,
  requestAnimationFrame: requestAnimationFrameFn
}) {
  if (!registry) {
    throw new Error('Note manager requires a registry instance');
  }

  if (!noteTypes || !noteTypes.FLOATING || !noteTypes.SUPER) {
    throw new Error('Note manager requires floating and super note type definitions');
  }

  const scheduleTopicIndicator = typeof scheduleTopicNoteIndicatorRefresh === 'function'
    ? scheduleTopicNoteIndicatorRefresh
    : () => {};

  const raf = typeof requestAnimationFrameFn === 'function'
    ? requestAnimationFrameFn
    : (callback) => setTimeout(callback, 16);

  let notesViewController = null;
  let pendingNotesViewUpdate = false;

  function ensureNoteData(noteId, overrides = {}) {
    return registry.ensure(noteId, overrides);
  }

  function updateNoteData(noteId, updates = {}, { silent = false } = {}) {
    return registry.update(noteId, updates, { silent });
  }

  function removeNoteData(noteId) {
    if (!noteId) return;
    registry.remove(noteId);
  }

  function isFloatingFamilyNote(note) {
    if (!note) return false;
    const type = note?.type || noteTypes.FLOATING;
    return type === noteTypes.FLOATING || type === noteTypes.SUPER;
  }

  function scheduleNotesViewRefresh() {
    scheduleTopicIndicator();
    if (!notesViewController) return;
    if (pendingNotesViewUpdate) return;
    pendingNotesViewUpdate = true;
    raf(() => {
      pendingNotesViewUpdate = false;
      notesViewController.notifyNotesUpdated();
    });
  }

  registry.setChangeListener(() => {
    scheduleNotesViewRefresh();
  });

  function setNotesViewController(controller) {
    notesViewController = controller || null;
  }

  function getNotesViewController() {
    return notesViewController;
  }

  return {
    ensureNoteData,
    updateNoteData,
    removeNoteData,
    isFloatingFamilyNote,
    scheduleNotesViewRefresh,
    setNotesViewController,
    getNotesViewController
  };
}
