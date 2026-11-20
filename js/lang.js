/* ==========================================================================
   GEO2E2 — Choix de langue et détection de la langue du système
   - Mémorise uniquement le choix explicite (clic sur FR / EN) dans localStorage
   - Redirige vers l'anglais si le navigateur/système est en anglais
   - ?lang=fr ou ?lang=en force la requête en cours SANS écrire de préférence :
     le paramètre est propagé lors de la redirection pour éviter un rebond,
     mais il ne devient jamais un choix mémorisé. Un lien partagé ne change
     donc pas la langue future du visiteur.
   ========================================================================== */

(function () {
  "use strict";

  var STORAGE_KEY = "geo2e2-lang";
  var params = new URLSearchParams(window.location.search);
  var forced = params.get("lang");
  var stored = null;

  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    stored = null;
  }

  if (forced === "fr" || forced === "en") {
    // Force l'affichage de cette requête uniquement. Aucune écriture ici :
    // seul un clic explicite sur le sélecteur FR/EN persiste dans localStorage.
    stored = forced;
  }

  // Le paramètre suit la redirection, sinon la page d'arrivée reprendrait la
  // langue du système et renverrait immédiatement vers la page d'origine.
  var forcedQuery = forced === "fr" || forced === "en" ? "?lang=" + forced : "";

  var path = window.location.pathname;
  var inEnglish = /\/en(\/|$)/.test(path);
  var script = document.currentScript;
  var base = "";

  if (script && script.src) {
    base = script.src.replace(/\/js\/lang\.js.*$/, "");
  }

  var file = path.split("/").pop() || "index.html";

  var englishFiles = {
    "": "index.html",
    "index.html": "index.html",
    "services.html": "services.html",
    "outils-methodologies.html": "tools-methodology.html",
    "references.html": "references.html",
    "contact.html": "contact.html"
  };

  var frenchFiles = {
    "": "index.html",
    "index.html": "index.html",
    "services.html": "services.html",
    "tools-methodology.html": "outils-methodologies.html",
    "references.html": "references.html",
    "contact.html": "contact.html"
  };

  var language =
    (navigator.languages && navigator.languages[0]) ||
    navigator.language ||
    "";
  var prefersEnglish = /^en(-|_|$)/i.test(language);

  function goTo(url) {
    window.location.replace(url);
  }

  if (!inEnglish) {
    if (stored === "en" || (!stored && prefersEnglish)) {
      var englishTarget = englishFiles[file];
      if (englishTarget) {
        goTo(base + "/en/" + englishTarget + forcedQuery + window.location.hash);
      }
    }
  } else if (stored === "fr") {
    var frenchTarget = frenchFiles[file];
    if (frenchTarget) {
      goTo(base + "/" + frenchTarget + forcedQuery + window.location.hash);
    }
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest
      ? event.target.closest("[data-lang-switch]")
      : null;
    if (!link) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        link.getAttribute("data-lang-switch")
      );
    } catch (error) {
      /* stockage indisponible : le lien fonctionne quand même */
    }
  });
})();
