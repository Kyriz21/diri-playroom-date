/**
 * Compact, in-flow feedback for arcade games.
 * Unlike the global toast stack, this never floats over the play area.
 */
export function createArcadeFeedback(root, shellSelector) {
  const shell = root.querySelector(shellSelector);
  if (!shell) return { show: () => {}, destroy: () => {} };

  const node = document.createElement('div');
  node.className = 'arcade-inline-feedback';
  node.hidden = true;
  node.setAttribute('role', 'status');
  node.setAttribute('aria-live', 'polite');
  node.setAttribute('aria-atomic', 'true');
  const header = shell.querySelector('header');
  if (header) header.insertAdjacentElement('afterend', node);
  else shell.prepend(node);

  let timer = 0;
  let lastMessage = '';
  let lastShownAt = 0;

  function show(message, type = 'default', options = {}) {
    const text = String(message ?? '').trim();
    if (!text) return;
    const now = Date.now();
    if (text === lastMessage && now - lastShownAt < 700) return;
    lastMessage = text;
    lastShownAt = now;
    window.clearTimeout(timer);
    node.textContent = text;
    node.dataset.type = ['success', 'error', 'default'].includes(type) ? type : 'default';
    node.hidden = false;
    node.classList.remove('is-visible');
    requestAnimationFrame(() => node.classList.add('is-visible'));
    const duration = Number.isFinite(options.duration)
      ? Math.max(700, options.duration)
      : type === 'error' ? 3200 : 1700;
    timer = window.setTimeout(() => {
      node.classList.remove('is-visible');
      window.setTimeout(() => { if (!node.classList.contains('is-visible')) node.hidden = true; }, 180);
    }, duration);
  }

  function destroy() {
    window.clearTimeout(timer);
    node.remove();
  }

  return { show, destroy };
}
