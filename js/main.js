/* ==========================================================================
   Portfolio Nicola Strohm : interactions
   Aucune dépendance externe. Chaque fonctionnalité est isolée dans sa propre
   fonction, appelée au chargement de la page (voir init() en bas du fichier).
   ========================================================================== */

"use strict";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Le CSS masque les éléments animés seulement quand le JS tourne */
document.documentElement.classList.remove("no-js");

/* --------------------------------------------------------------------------
   Navigation : fond flouté au défilement, menu mobile, lien actif
   -------------------------------------------------------------------------- */
function initNav() {
  const nav = document.getElementById("nav");
  const burger = document.getElementById("nav-burger");
  const links = document.querySelectorAll(".nav__link");

  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 10);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const closeMenu = () => {
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Ouvrir le menu");
  };

  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  });
  links.forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());

  // Surligne la section en cours de lecture
  const sections = [...links].map((l) => document.querySelector(l.getAttribute("href")));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === `#${entry.target.id}`));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => s && observer.observe(s));
}

/* --------------------------------------------------------------------------
   Découpe des titres en mots, pour les faire apparaître un par un.
   - Hero : animation au chargement, dernier mot en couleur, une phrase par ligne.
   - Titres de section : animation déclenchée quand le bloc devient visible (CSS).
   -------------------------------------------------------------------------- */
function splitWords(el, { accentLast = false, breakOnPeriod = false } = {}) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = "";
  words.forEach((word, i) => {
    const span = document.createElement("span");
    span.className = "word";
    if (accentLast && i === words.length - 1) span.classList.add("word--accent");
    span.style.setProperty("--i", i); // utilisé par le CSS pour décaler chaque mot
    span.textContent = word;
    el.append(span);
    if (i < words.length - 1) {
      el.append(breakOnPeriod && word.endsWith(".") ? document.createElement("br") : " ");
    }
  });
}

function initSplitTitles() {
  document.querySelectorAll("[data-split]").forEach((el) => splitWords(el, { accentLast: true, breakOnPeriod: true }));
  if (prefersReducedMotion) return;
  document.querySelectorAll(".section__title, .contact__title").forEach((el) => splitWords(el));
}

/* --------------------------------------------------------------------------
   Apparition au défilement, avec un léger décalage entre éléments voisins
   -------------------------------------------------------------------------- */
function initReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  if (prefersReducedMotion) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  // Décalage en cascade pour les éléments frères (cartes, défis, frise…)
  items.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute("data-reveal"));
    const index = siblings.indexOf(el);
    if (siblings.length > 1) el.style.setProperty("--delay", `${Math.min(index, 5) * 0.08}s`);
  });

  // On ne « débranche » plus l'observateur après la 1re apparition :
  // l'élément perd sa classe quand il sort de l'écran, et rejoue l'animation
  // à chaque fois qu'il revient (en descendant comme en remontant).
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting));
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );
  items.forEach((el) => observer.observe(el));
}

/* --------------------------------------------------------------------------
   Compteurs animés (chiffres clés du homelab)
   -------------------------------------------------------------------------- */
function initCounters() {
  const counters = document.querySelectorAll("[data-count]");
  if (prefersReducedMotion) return;

  const animate = (el) => {
    const target = Number(el.dataset.count);
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) animate(entry.target);
        else entry.target.textContent = "0";   // remis à zéro hors écran pour rejouer
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach((el) => {
    el.textContent = "0";
    observer.observe(el);
  });
}

/* --------------------------------------------------------------------------
   Schéma du homelab : met en valeur les éléments de l'étape lue
   Chaque élément du SVG porte data-steps="1 2…" ; chaque étape porte data-step.
   -------------------------------------------------------------------------- */
function initStory() {
  const diagram = document.getElementById("diagram");
  const steps = document.querySelectorAll(".step");
  if (!diagram || !steps.length) return;

  const parts = diagram.querySelectorAll("[data-steps]");

  const activate = (step) => {
    diagram.classList.add("has-step");
    parts.forEach((p) => p.classList.toggle("is-active", p.dataset.steps.split(" ").includes(step)));
    steps.forEach((s) => s.classList.toggle("is-active", s.dataset.step === step));
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => entry.isIntersecting && activate(entry.target.dataset.step));
    },
    { rootMargin: "-45% 0px -45% 0px" }
  );
  steps.forEach((s) => observer.observe(s));

  // Quand on quitte la zone des étapes, le schéma redevient entièrement visible
  const story = document.querySelector(".story");
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) {
      diagram.classList.remove("has-step");
      steps.forEach((s) => s.classList.remove("is-active"));
    }
  }).observe(story);
}

/* --------------------------------------------------------------------------
   Effets liés au défilement : barre de progression, zoom des images,
   parallaxe des téléphones. Un seul écouteur, calculs dans requestAnimationFrame.
   -------------------------------------------------------------------------- */
function initScrollEffects() {
  const bar = document.querySelector(".progress__bar");
  const scaled = document.querySelectorAll("[data-scale]");
  const parallax = document.querySelectorAll("[data-parallax]");
  const hero = document.getElementById("hero-content");
  let ticking = false;

  const update = () => {
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;

    if (!prefersReducedMotion) {
      // Étape 1 : on LIT toutes les positions d'abord…
      // (alterner lecture et écriture force le navigateur à recalculer la page à chaque
      //  élément : c'est le « forced reflow » signalé par Lighthouse)
      const scaledTops = [...scaled].map((el) => el.getBoundingClientRect().top);
      const parallaxRects = [...parallax].map((el) => el.getBoundingClientRect());

      // Étape 2 : … puis on ÉCRIT tous les styles d'un coup.
      // L'image grandit de 0,9 à 1 en entrant dans l'écran
      scaled.forEach((el, i) => {
        const progress = Math.min(Math.max((vh - scaledTops[i]) / (vh * 0.8), 0), 1);
        el.style.setProperty("--scale", (0.9 + progress * 0.1).toFixed(4));
      });
      // Les téléphones se déplacent (et s'inclinent légèrement) à des vitesses différentes.
      // distance = écart entre le centre du téléphone et le centre de l'écran.
      parallax.forEach((el, i) => {
        const rect = parallaxRects[i];
        const distance = rect.top + rect.height / 2 - vh / 2;
        const speed = Number(el.dataset.parallax);
        el.style.setProperty("--parallax", `${(distance * speed * 1.6).toFixed(1)}px`);
        el.style.setProperty("--tilt", `${(distance * speed * 0.012).toFixed(2)}deg`);
      });
      // Hero : 0 en haut de page, 1 quand on a défilé d'un écran entier
      if (hero) {
        const p = Math.min(window.scrollY / vh, 1);
        hero.style.setProperty("--hero-p", p.toFixed(3));
      }
    }
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  };

  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
}

/* --------------------------------------------------------------------------
   Bande défilante en boucle
   Le CSS fait reculer la piste de 50 %. Pour que la boucle soit invisible,
   on duplique ici toutes les images : la 2e série remplace pile la 1re.
   Pour ajouter une photo, il suffit d'ajouter une <figure> dans le HTML.
   -------------------------------------------------------------------------- */
function initMarquee() {
  const track = document.querySelector(".marquee__track");
  if (!track || prefersReducedMotion) return;

  [...track.children].forEach((item) => {
    const clone = item.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");   // les lecteurs d'écran ignorent les doublons
    track.append(clone);
  });

  // Vitesse constante quel que soit le nombre d'images : 40 pixels par seconde
  const setDuration = () => {
    const distance = track.scrollWidth / 2;
    track.style.setProperty("--duration", `${distance / 40}s`);
  };
  setDuration();
  window.addEventListener("resize", setDuration);
}

/* --------------------------------------------------------------------------
   Accordéon « Ce qui ne s'est pas passé comme prévu »
   La balise <details> s'ouvre d'un coup : on intercepte le clic pour animer
   la hauteur nous-mêmes, et on referme la fenêtre déjà ouverte.
   -------------------------------------------------------------------------- */
function initAccordion() {
  const items = document.querySelectorAll(".challenge");
  const duration = prefersReducedMotion ? 0 : 450;
  const easing = "cubic-bezier(0.22, 1, 0.36, 1)";

  const close = (item) => {
    const body = item.querySelector(".challenge__body");
    // On anime de la hauteur actuelle jusqu'à 0, puis on ferme vraiment le <details>
    const anim = body.animate(
      [{ height: `${body.offsetHeight}px`, opacity: 1 }, { height: "0px", opacity: 0 }],
      { duration, easing }
    );
    anim.onfinish = () => item.removeAttribute("open");
  };

  const open = (item) => {
    const body = item.querySelector(".challenge__body");
    item.setAttribute("open", "");           // le contenu existe, on peut mesurer sa hauteur
    const height = body.scrollHeight;
    body.animate(
      [{ height: "0px", opacity: 0 }, { height: `${height}px`, opacity: 1 }],
      { duration, easing }
    );
  };

  items.forEach((item) => {
    item.querySelector("summary").addEventListener("click", (e) => {
      e.preventDefault();                     // on bloque l'ouverture instantanée du navigateur
      if (item.open) {
        close(item);
      } else {
        items.forEach((other) => other !== item && other.open && close(other));
        open(item);
      }
    });
  });
}

/* --------------------------------------------------------------------------
   Visionneuse d'images : un clic sur une capture l'affiche en grand.
   Utilise la balise <dialog>, qui gère nativement la touche Échap et le fond.
   -------------------------------------------------------------------------- */
function initLightbox() {
  const dialog = document.getElementById("lightbox");
  if (!dialog) return;
  const img = dialog.querySelector(".lightbox__img");
  const caption = dialog.querySelector(".lightbox__caption");

  const close = () => {
    if (prefersReducedMotion) return dialog.close();
    dialog.classList.add("is-closing");      // lance l'animation de sortie (CSS)
    setTimeout(() => {
      dialog.classList.remove("is-closing");
      dialog.close();
    }, 280);
  };

  document.querySelectorAll("[data-lightbox]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const thumb = btn.querySelector("img");
      if (!thumb) return;                     // image absente (emplacement « Capture à venir »)
      // data-full = grande version, chargée seulement à l'ouverture de la visionneuse
      img.src = thumb.dataset.full || thumb.currentSrc || thumb.src;
      img.alt = thumb.alt;
      caption.textContent = btn.closest("figure")?.querySelector("figcaption")?.textContent || "";
      dialog.showModal();
    });
  });

  dialog.querySelector(".lightbox__close").addEventListener("click", close);
  // Clic en dehors de l'image = fermer
  dialog.addEventListener("click", (e) => e.target === dialog && close());
  // Échap : on remplace la fermeture brutale par notre animation
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });
}

/* --------------------------------------------------------------------------
   Captures du homelab : affiche un emplacement propre tant que l'image
   n'a pas été ajoutée dans assets/img/homelab/
   -------------------------------------------------------------------------- */
function initImageFallbacks() {
  document.querySelectorAll(".shot img").forEach((img) => {
    const showPlaceholder = () => {
      const placeholder = document.createElement("div");
      placeholder.className = "shot__placeholder";
      placeholder.textContent = "Capture à venir";
      img.replaceWith(placeholder);
    };
    if (img.complete && img.naturalWidth === 0) showPlaceholder();
    else img.addEventListener("error", showPlaceholder, { once: true });
  });
}

/* --------------------------------------------------------------------------
   Divers
   -------------------------------------------------------------------------- */
function initYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
}

function init() {
  initSplitTitles();
  initNav();
  initReveal();
  initCounters();
  initStory();
  initScrollEffects();
  initMarquee();
  initAccordion();
  initLightbox();
  initImageFallbacks();
  initYear();
}

init();
