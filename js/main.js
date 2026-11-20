/* ==========================================================================
   GEO2E2 — Interactions légères (menu, apparitions, formulaire)
   ========================================================================== */

(function () {
  "use strict";

  const header = document.querySelector(".site-header");
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.getElementById("primary-nav");

  /* Libellés localisés (français par défaut, anglais via data-*) */
  const labelOpen =
    (navToggle && navToggle.getAttribute("data-label-open")) || "Ouvrir le menu";
  const labelClose =
    (navToggle && navToggle.getAttribute("data-label-close")) || "Fermer le menu";

  /* --- En-tête : ombre au défilement ------------------------------------- */
  const onScrollHeader = function () {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* --- Menu mobile -------------------------------------------------------- */
  const closeNav = function () {
    if (!siteNav || !navToggle) return;
    siteNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", labelOpen);
  };

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      const isOpen = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? labelClose : labelOpen);
    });

    siteNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNav();
    });

    document.addEventListener("click", function (event) {
      if (!siteNav.classList.contains("is-open")) return;
      if (siteNav.contains(event.target) || navToggle.contains(event.target)) return;
      closeNav();
    });
  }

  /* --- Apparition douce des sections ------------------------------------- */
  const revealItems = document.querySelectorAll(".reveal");

  const revealAll = function () {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  };

  if ("IntersectionObserver" in window && revealItems.length) {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealItems.forEach(function (item, index) {
      // Décalage d'apparition via une classe (aucun style inline, CSP stricte).
      const delay = Math.min(index % 4, 3);
      if (delay > 0) item.classList.add("reveal-delay-" + delay);
      revealObserver.observe(item);
    });

    // Filet de sécurité : le contenu reste visible même si l'observateur
    // ne se déclenche pas (aperçu intégré, onglet en arrière-plan…).
    window.setTimeout(revealAll, 2200);
  } else {
    revealAll();
  }

  /* --- Navigation interne de la page Services ---------------------------- */
  const servicesNav = document.querySelector(".services-nav");
  const serviceSections = Array.prototype.slice.call(
    document.querySelectorAll(".service-detail")
  );

  if (servicesNav && serviceSections.length) {
    const links = Array.prototype.slice.call(
      servicesNav.querySelectorAll('a[href^="#"]')
    );

    const setActive = function (id) {
      links.forEach(function (link) {
        link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
      });
    };

    const updateActiveFromScroll = function () {
      let current = serviceSections[0].id;
      serviceSections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= 150) {
          current = section.id;
        }
      });
      setActive(current);
    };

    if (links.length) {
      setActive(serviceSections[0].id);
      links.forEach(function (link) {
        link.addEventListener("click", function () {
          setActive(link.getAttribute("href").slice(1));
        });
      });
    }

    window.addEventListener("scroll", updateActiveFromScroll, { passive: true });
    updateActiveFromScroll();
  }

  /* --- Formulaire de contact (mailto, sans backend) ---------------------- */
  const contactForm = document.querySelector("[data-contact-form]");

  if (contactForm) {
    const status = contactForm.querySelector(".form-status");
    const statusMessage =
      contactForm.getAttribute("data-status-message") ||
      "Votre messagerie s'ouvre avec le message prérempli. Vous pouvez aussi nous écrire directement à geoexplorer.e2@gmail.com.";
    const subjectPrefix =
      contactForm.getAttribute("data-mail-subject") || "Site GEO2E2 — ";
    const defaultSubject =
      contactForm.getAttribute("data-default-subject") || "Demande de contact";
    const fieldName = contactForm.getAttribute("data-field-name") || "Nom :";
    const fieldEmail = contactForm.getAttribute("data-field-email") || "Email :";
    const fieldSubject =
      contactForm.getAttribute("data-field-subject") || "Sujet :";

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      const data = new FormData(contactForm);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const subject = String(data.get("subject") || "").trim();
      const message = String(data.get("message") || "").trim();

      const mailSubject = subjectPrefix + (subject || defaultSubject);
      const mailBody =
        fieldName +
        " " +
        name +
        "\n" +
        fieldEmail +
        " " +
        email +
        "\n" +
        fieldSubject +
        " " +
        subject +
        "\n\n" +
        message;

      const mailto =
        "mailto:geoexplorer.e2@gmail.com?subject=" +
        encodeURIComponent(mailSubject) +
        "&body=" +
        encodeURIComponent(mailBody);

      if (status) {
        status.textContent = statusMessage;
        status.classList.add("is-visible");
      }

      window.location.href = mailto;
    });
  }

  /* --- Année automatique -------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });
})();
