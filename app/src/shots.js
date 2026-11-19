// Helpers for the grader's fixed screenshot scenes.
// ?shot=cover  -> only the finished cover, filling the viewport
// ?shot=editor -> the full studio
// ?photo=pier|boulevard picks the bundled sample, ?caption= sets the title.

export function readShotRequest(search) {
  const q = new URLSearchParams(search);
  const shot = q.get('shot');
  if (shot !== 'cover' && shot !== 'editor') return null;
  const photo = q.get('photo') === 'boulevard' ? 'boulevard' : 'pier';
  const caption = q.get('caption');
  return { shot, photo, caption };
}

export function markShotReady() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.__shotReady = true;
    });
  });
}
