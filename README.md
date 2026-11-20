# GEO2E2 — site bilingue FR/EN

Site vitrine statique pour GEO2E2 (bureau d'études en géosciences, mines, eau et environnement).

**Adresse GitHub Pages :** <https://essahlaouifouad.github.io/geo2e2/>

## Structure

```
index.html                  Accueil — français
services.html               Services — français
outils-methodologies.html   Outils et méthodologies — français
references.html             Références — français
contact.html                Contact — français
en/                         Les 5 mêmes pages, en anglais
css/                        reset.css, style.css, fonts.css, noscript.css
fonts/                      4 fichiers WOFF2 variables auto-hébergés
img/                        Logos, illustrations, favicons, hero sans texte
js/lang.js                  Détection et bascule FR/EN (chargé dans <head>)
js/main.js                  Menu, apparitions, formulaire de contact
.htaccess / _headers        En-têtes de sécurité (Apache / Netlify-Cloudflare)
SECURITY.md                 Audit de sécurité
build.sh                    Versionnage de cache — une seule source de vérité
```

## Langue

- Le sélecteur FR/EN est visible dans le menu.
- Le choix explicite est mémorisé dans `localStorage` sous `geo2e2-lang`.
- Sans choix, l'anglais est utilisé si le navigateur est en anglais, sinon le français.
- `?lang=fr` / `?lang=en` force la langue de la requête **sans** modifier la préférence mémorisée.
- Le script calcule automatiquement la base `/geo2e2/` depuis son propre URL : aucun chemin codé en dur.

## Déployer une modification

```bash
./build.sh                 # met à jour les 60 suffixes ?v=......... en une seule fois
git add -A && git commit -m "..." && git push
```

GitHub Pages publie automatiquement la branche `main` à la racine du dépôt.
Le fichier `.nojekyll` garantit que les fichiers et dossiers commençant par `_` ou `.` sont servis tels quels.

## À savoir

- Le formulaire utilise `mailto:` avec un message d'échec explicite ; un backend reste à brancher si un suivi fiable est nécessaire.
- Le bouton « Fascicule — bientôt disponible » sera remplacé dès réception du PDF.
- Aucun identifiant FTP ne doit jamais être ajouté à ce dépôt.
