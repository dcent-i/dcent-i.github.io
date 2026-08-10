// version-updates.js
// Loads update summaries near the viewport and keeps article resources scoped to the open dialog.

(() => {
    'use strict';

    const CARD_LOAD_MARGIN = '800px 0px';
    const ARTICLE_RESOURCE_MARGIN = '350px 0px';
    const galleries = new Set();

    function deferAttribute(element, attribute) {
        if (!element.hasAttribute(attribute)) return;
        element.dataset[`vu${attribute[0].toUpperCase()}${attribute.slice(1)}`] = element.getAttribute(attribute);
        element.removeAttribute(attribute);
    }

    function deferArticleResources(scope) {
        scope.querySelectorAll('[data-version-update-article] img').forEach(image => {
            deferAttribute(image, 'src');
            deferAttribute(image, 'srcset');
            image.loading = 'lazy';
            image.decoding = 'async';
        });
        scope.querySelectorAll('[data-version-update-article] iframe').forEach(frame => {
            deferAttribute(frame, 'src');
            frame.loading = 'lazy';
        });
        scope.querySelectorAll('[data-version-update-article] video, [data-version-update-article] audio').forEach(media => {
            deferAttribute(media, 'src');
            deferAttribute(media, 'poster');
            if (media.hasAttribute('autoplay')) {
                media.dataset.vuAutoplay = 'true';
                media.removeAttribute('autoplay');
            }
            media.preload = 'none';
            media.querySelectorAll('source').forEach(source => deferAttribute(source, 'src'));
        });
    }

    function restoreAttribute(element, attribute) {
        const key = `vu${attribute[0].toUpperCase()}${attribute.slice(1)}`;
        if (!Object.prototype.hasOwnProperty.call(element.dataset, key)) return false;
        element.setAttribute(attribute, element.dataset[key]);
        delete element.dataset[key];
        return true;
    }

    function primeMediaSource(media) {
        if (media.dataset.vuSourceHydrated === 'true') return;
        media.dataset.vuSourceHydrated = 'true';
        restoreAttribute(media, 'src');
        media.querySelectorAll('source').forEach(source => restoreAttribute(source, 'src'));
        media.preload = media.autoplay ? 'auto' : 'metadata';
        media.load();
        if (media._vuPrimeMedia) {
            media.removeEventListener('pointerdown', media._vuPrimeMedia);
            media.removeEventListener('keydown', media._vuPrimeMediaOnKey);
            media.removeEventListener('play', media._vuPrimeMedia);
            delete media._vuPrimeMedia;
            delete media._vuPrimeMediaOnKey;
        }
    }

    function hydrateResource(element) {
        if (element.dataset.vuHydrated === 'true') return;
        element.dataset.vuHydrated = 'true';

        if (element.matches('img')) {
            restoreAttribute(element, 'srcset');
            restoreAttribute(element, 'src');
            return;
        }
        if (element.matches('iframe')) {
            restoreAttribute(element, 'src');
            return;
        }
        if (element.matches('video, audio')) {
            restoreAttribute(element, 'poster');
            if (element.dataset.vuAutoplay === 'true') {
                element.autoplay = true;
                delete element.dataset.vuAutoplay;
                primeMediaSource(element);
                element.play().catch(() => {});
                return;
            }

            // Controls-only videos fetch their large MP4 only when the visitor interacts.
            const prime = () => primeMediaSource(element);
            const primeOnKey = event => {
                if (event.key === 'Enter' || event.key === ' ') prime();
            };
            element._vuPrimeMedia = prime;
            element._vuPrimeMediaOnKey = primeOnKey;
            element.addEventListener('pointerdown', prime, { once: true });
            element.addEventListener('keydown', primeOnKey);
            element.addEventListener('play', prime, { once: true });
        }
    }

    function startArticleResources(scope, scrollRoot) {
        const resources = [...scope.querySelectorAll('img, iframe, video, audio')];
        if (!resources.length) return () => {};

        let observer;
        if (typeof IntersectionObserver === 'function') {
            observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    observer.unobserve(entry.target);
                    hydrateResource(entry.target);
                });
            }, { root: scrollRoot, rootMargin: ARTICLE_RESOURCE_MARGIN });
            resources.forEach(resource => observer.observe(resource));
        } else {
            resources.forEach(hydrateResource);
        }

        return () => observer?.disconnect();
    }

    function releaseArticleResources(scope) {
        scope.querySelectorAll('video, audio').forEach(media => {
            media.pause();
            if (media._vuPrimeMedia) {
                media.removeEventListener('pointerdown', media._vuPrimeMedia);
                media.removeEventListener('keydown', media._vuPrimeMediaOnKey);
                media.removeEventListener('play', media._vuPrimeMedia);
                delete media._vuPrimeMedia;
                delete media._vuPrimeMediaOnKey;
            }
            media.removeAttribute('autoplay');
            media.removeAttribute('src');
            media.removeAttribute('poster');
            media.querySelectorAll('source').forEach(source => source.removeAttribute('src'));
            media.load();
        });
        scope.querySelectorAll('img').forEach(image => {
            image.removeAttribute('src');
            image.removeAttribute('srcset');
        });
        scope.querySelectorAll('iframe').forEach(frame => frame.removeAttribute('src'));
        scope.querySelectorAll('canvas').forEach(canvas => {
            // Resetting both dimensions releases Safari's native canvas backing stores.
            canvas.width = 0;
            canvas.height = 0;
        });
    }

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

    function loadVersionUpdate(slot, state) {
        if (slot.dataset.versionUpdateState === 'loaded') return Promise.resolve();
        if (slot._versionUpdateLoad) return slot._versionUpdateLoad;

        const source = slot.dataset.versionUpdateSrc;
        if (!source) return Promise.resolve();

        const controller = new AbortController();
        state.controllers.add(controller);
        slot.dataset.versionUpdateState = 'loading';
        slot.setAttribute('aria-busy', 'true');

        const request = fetch(source, { signal: controller.signal })
            .then(response => {
                if (!response.ok) throw new Error(`Unable to load ${source} (${response.status})`);
                return response.text();
            })
            .then(html => {
                const template = document.createElement('template');
                template.innerHTML = html;
                if (!template.content.querySelector('[data-version-update]')) {
                    throw new Error(`${source} does not contain a data-version-update article`);
                }

                // The detached template is inert, so media URLs can be deferred before they enter the live DOM.
                deferArticleResources(template.content);
                slot.replaceChildren(template.content);
                slot.dataset.versionUpdateState = 'loaded';
                executeVersionUpdateScripts(slot);
                if (typeof renderReferences === 'function') renderReferences(slot);
            })
            .catch(error => {
                if (error.name === 'AbortError') {
                    slot.dataset.versionUpdateState = 'idle';
                    return;
                }
                slot.dataset.versionUpdateState = 'error';
                slot.innerHTML = '<p class="version-update-load-error">This version update could not be loaded.</p>';
                console.error(error);
            })
            .finally(() => {
                state.controllers.delete(controller);
                slot.removeAttribute('aria-busy');
                delete slot._versionUpdateLoad;
            });

        slot._versionUpdateLoad = request;
        return request;
    }

    function loadGalleryCards(gallery, state) {
        if (state.cardsRequested) return;
        state.cardsRequested = true;
        state.cardObserver?.disconnect();
        Promise.all(state.slots.map(slot => loadVersionUpdate(slot, state))).then(() => {
            if (state.slots.some(slot => slot.dataset.versionUpdateState === 'idle')) {
                state.cardsRequested = false;
                observeGalleryCards(gallery, state);
            }
        });
    }

    function observeGalleryCards(gallery, state) {
        if (state.cardsRequested) return;
        if (typeof IntersectionObserver !== 'function') {
            loadGalleryCards(gallery, state);
            return;
        }
        state.cardObserver = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) loadGalleryCards(gallery, state);
        }, { rootMargin: CARD_LOAD_MARGIN });
        state.cardObserver.observe(gallery);
    }

    function initialiseVersionUpdates(gallery) {
        if (!gallery || gallery.dataset.versionUpdatesInitialized === 'true') return;
        gallery.dataset.versionUpdatesInitialized = 'true';

        const track = gallery.querySelector('[data-version-updates-track]');
        const dialog = gallery.querySelector('[data-version-update-dialog]');
        const dialogPanel = gallery.querySelector('.version-update-dialog-panel');
        const dialogContent = gallery.querySelector('[data-version-update-dialog-content]');
        const closeButton = gallery.querySelector('[data-version-update-close]');
        const slots = [...gallery.querySelectorAll('[data-version-update-src]')];
        let lastTrigger;
        let stopArticleResources = () => {};
        let dialogCleaned = true;

        if (!track || !dialog || !dialogPanel || !dialogContent || !closeButton) return;

        const state = {
            slots,
            controllers: new Set(),
            cardObserver: undefined,
            cardsRequested: false,
            purge() {
                state.cardObserver?.disconnect();
                state.cardsRequested = false;
                state.controllers.forEach(controller => controller.abort());
                state.controllers.clear();
                if (dialog.hasAttribute('open')) {
                    if (typeof dialog.close === 'function') dialog.close();
                    else dialog.removeAttribute('open');
                    cleanUpClosedDialog(false);
                }
            },
            resume() {
                if (slots.some(slot => slot.dataset.versionUpdateState !== 'loaded')) {
                    state.cardsRequested = false;
                    observeGalleryCards(gallery, state);
                }
            }
        };
        gallery._versionUpdatesState = state;
        galleries.add(gallery);

        function cardStep() {
            const firstSlot = track.querySelector('.version-update-slot');
            const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
            return firstSlot ? firstSlot.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
        }

        function scrollCards(direction) {
            track.scrollBy({ left: direction * cardStep(), behavior: 'smooth' });
        }

        function cleanUpClosedDialog(restoreFocus = true) {
            if (dialogCleaned) return;
            dialogCleaned = true;
            dialog.classList.remove('is-visible', 'is-animating');
            document.body.classList.remove('version-update-modal-open');
            stopArticleResources();
            stopArticleResources = () => {};
            window.dispatchEvent(new CustomEvent('version-update-article-closed', {
                detail: { root: dialogContent }
            }));
            releaseArticleResources(dialogContent);
            dialogContent.replaceChildren();
            if (restoreFocus && lastTrigger?.isConnected) lastTrigger.focus();
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
            const article = update?.querySelector('[data-version-update-article]');
            if (!article) return;

            const origin = trigger.getBoundingClientRect();
            lastTrigger = trigger;
            dialogCleaned = false;
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

            stopArticleResources = startArticleResources(dialogContent, dialogPanel);
            window.dispatchEvent(new CustomEvent('version-update-article-opened', {
                detail: { root: dialogContent, scrollRoot: dialogPanel }
            }));

            const target = dialogPanel.getBoundingClientRect();
            dialog.style.setProperty('--version-update-target-top', `${target.top}px`);
            dialog.style.setProperty('--version-update-target-left', `${target.left}px`);
            dialog.style.setProperty('--version-update-target-width', `${target.width}px`);
            dialog.style.setProperty('--version-update-target-height', `${target.height}px`);

            // Flush the origin frame before expanding it to the article frame.
            dialog.getBoundingClientRect();
            requestAnimationFrame(() => {
                if (dialog.hasAttribute('open')) dialog.classList.add('is-visible');
            });
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
        dialog.addEventListener('close', () => cleanUpClosedDialog());
        track.addEventListener('keydown', event => {
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                scrollCards(1);
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                scrollCards(-1);
            }
        });

        observeGalleryCards(gallery, state);
    }

    function initialiseAllVersionUpdates(scope = document) {
        scope.querySelectorAll('[data-version-updates]').forEach(initialiseVersionUpdates);
    }

    document.addEventListener('include-html-loaded', event => {
        if (event.detail?.file === 'sections/reference.html') initialiseAllVersionUpdates(event.target);
    });
    document.addEventListener('DOMContentLoaded', () => initialiseAllVersionUpdates());
    window.addEventListener('pagehide', () => {
        galleries.forEach(gallery => gallery._versionUpdatesState?.purge());
    });
    window.addEventListener('pageshow', event => {
        if (event.persisted) galleries.forEach(gallery => gallery._versionUpdatesState?.resume());
    });
})();
