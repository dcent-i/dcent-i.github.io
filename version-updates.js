// version-updates.js
// Loads one self-contained summary/article fragment per dataset version.

(() => {
    'use strict';

    function executeVersionUpdateScripts(scope) {
        scope.querySelectorAll('script[data-version-update-script]').forEach(script => {
            const executableScript = document.createElement('script');
            [...script.attributes].forEach(attribute => {
                executableScript.setAttribute(attribute.name, attribute.value);
            });
            executableScript.textContent = script.textContent;
            script.replaceWith(executableScript);
        });
    }

    function loadVersionUpdate(slot) {
        if (slot.dataset.versionUpdateLoaded === 'true') return Promise.resolve();

        const source = slot.dataset.versionUpdateSrc;
        if (!source) return Promise.resolve();
        slot.dataset.versionUpdateLoaded = 'true';

        return fetch(source)
            .then(response => {
                if (!response.ok) throw new Error(`Unable to load ${source} (${response.status})`);
                return response.text();
            })
            .then(html => {
                slot.innerHTML = html;
                if (!slot.querySelector('[data-version-update]')) {
                    throw new Error(`${source} does not contain a data-version-update article`);
                }
                executeVersionUpdateScripts(slot);
                if (typeof renderReferences === 'function') renderReferences(slot);
            })
            .catch(error => {
                slot.innerHTML = '<p class="version-update-load-error">This version update could not be loaded.</p>';
                console.error(error);
            });
    }

    function initialiseVersionUpdates(gallery) {
        if (!gallery || gallery.dataset.versionUpdatesInitialized === 'true') return;
        gallery.dataset.versionUpdatesInitialized = 'true';

        const track = gallery.querySelector('[data-version-updates-track]');
        const dialog = gallery.querySelector('[data-version-update-dialog]');
        const dialogContent = gallery.querySelector('[data-version-update-dialog-content]');
        const closeButton = gallery.querySelector('[data-version-update-close]');
        const slots = [...gallery.querySelectorAll('[data-version-update-src]')];
        let lastTrigger;

        if (!track || !dialog || !dialogContent || !closeButton) return;

        function cardStep() {
            const firstSlot = track.querySelector('.version-update-slot');
            const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
            return firstSlot ? firstSlot.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
        }

        function scrollCards(direction) {
            track.scrollBy({ left: direction * cardStep(), behavior: 'smooth' });
        }

        function cleanUpClosedDialog() {
            dialog.classList.remove('is-visible');
            dialog.classList.remove('is-animating');
            document.body.classList.remove('version-update-modal-open');
            window.dispatchEvent(new CustomEvent('version-update-article-closed', {
                detail: { root: dialogContent }
            }));
            dialogContent.replaceChildren();
            lastTrigger?.focus();
        }

        function closeDialog() {
            if (!dialog.hasAttribute('open')) return;
            if (typeof dialog.close === 'function') dialog.close();
            else {
                dialog.removeAttribute('open');
                cleanUpClosedDialog();
            }
        }

        function openArticle(update, trigger) {
            const article = update.querySelector('[data-version-update-article]');
            if (!article) return;

            const origin = trigger.getBoundingClientRect();
            lastTrigger = trigger;
            dialogContent.replaceChildren(article.cloneNode(true));
            dialogContent.querySelector('[hidden]')?.removeAttribute('hidden');
            document.body.classList.add('version-update-modal-open');
            dialog.classList.remove('is-visible');
            dialog.classList.add('is-animating');
            dialog.style.setProperty('--version-update-origin-top', `${origin.top}px`);
            dialog.style.setProperty('--version-update-origin-left', `${origin.left}px`);
            dialog.style.setProperty('--version-update-origin-width', `${origin.width}px`);
            dialog.style.setProperty('--version-update-origin-height', `${origin.height}px`);
            if (typeof dialog.showModal === 'function') dialog.showModal();
            else dialog.setAttribute('open', '');

            window.dispatchEvent(new CustomEvent('version-update-article-opened', {
                detail: { root: dialogContent }
            }));

            const target = dialog.querySelector('.version-update-dialog-panel').getBoundingClientRect();
            dialog.style.setProperty('--version-update-target-top', `${target.top}px`);
            dialog.style.setProperty('--version-update-target-left', `${target.left}px`);
            dialog.style.setProperty('--version-update-target-width', `${target.width}px`);
            dialog.style.setProperty('--version-update-target-height', `${target.height}px`);

            // Flush the origin frame before expanding it to the article frame.
            dialog.getBoundingClientRect();
            requestAnimationFrame(() => dialog.classList.add('is-visible'));
            closeButton.focus({ preventScroll: true });
        }

        gallery.addEventListener('click', event => {
            const trigger = event.target.closest('[data-version-update-open]');
            if (trigger && gallery.contains(trigger)) {
                openArticle(trigger.closest('[data-version-update]'), trigger);
            }
        });

        closeButton.addEventListener('click', closeDialog);
        dialog.addEventListener('click', event => {
            if (event.target === dialog) closeDialog();
        });
        dialog.addEventListener('cancel', event => {
            event.preventDefault();
            closeDialog();
        });
        dialog.addEventListener('close', cleanUpClosedDialog);
        track.addEventListener('keydown', event => {
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                scrollCards(1);
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                scrollCards(-1);
            }
        });

        Promise.all(slots.map(loadVersionUpdate));
    }

    function initialiseAllVersionUpdates(scope = document) {
        scope.querySelectorAll('[data-version-updates]').forEach(initialiseVersionUpdates);
    }

    document.addEventListener('include-html-loaded', event => {
        if (event.detail?.file === 'sections/reference.html') initialiseAllVersionUpdates(event.target);
    });
    document.addEventListener('DOMContentLoaded', () => initialiseAllVersionUpdates());
})();
