# Sécurité — site GEO2E2

**Date de l'audit :** 7 novembre 2026  
**Périmètre :** l'intégralité du site statique `site-geo2e2-bumigeme` — 5 pages HTML, feuilles CSS, JavaScript, images, fichiers de configuration serveur.  
**Hors périmètre :** hébergement, DNS, certificats TLS, messagerie Gmail, postes des visiteurs.

---

## 1. Synthèse

Le site est un site vitrine **statique** : aucun serveur applicatif, aucune base de données, aucun compte utilisateur, aucun cookie, aucun outil d'analyse. Cette architecture réduit fortement la surface d'attaque (pas d'injection SQL, pas de session, pas de CSRF côté serveur, pas de RCE applicative).

**Aucune vulnérabilité critique ou haute n'a été détectée.** Les points perfectibles relevés sont principalement des durcissements de déploiement et de confidentialité ; ils ont été corrigés ou atténués.

| # | Constat | Gravité | État |
|---|---------|---------|------|
| 1 | Absence d'en-têtes de sécurité HTTP et de CSP | Moyenne | Corrigé (`_headers`, `.htaccess`, balises `<meta>`) |
| 2 | Script inline sans CSP (boot JS) | Moyenne | Corrigé (script supprimé, CSP `script-src 'self'`) |
| 3 | Listage des répertoires activé sur le serveur de prévisualisation | Moyenne (déploiement) | Corrigé (`Options -Indexes`) et vérifié (403) |
| 4 | Dépendance à Google Fonts (tiers, vie privée, chaîne d'approvisionnement) | Moyenne | Atténué par CSP ; auto-hébergement recommandé |
| 5 | Formulaire de contact en `mailto:` (pas de backend) | Faible | Accepté et documenté ; limites de longueur ajoutées |
| 6 | Adresse email exposée en clair dans le HTML | Faible | Risque accepté (collecte de spam possible) |
| 7 | Clickjacking non bloqué | Faible | Corrigé (`frame-ancestors 'none'`, `X-Frame-Options: DENY`) |
| 8 | Reniflage MIME | Faible | Corrigé (`nosniff`) |
| 9 | Fuite de référent vers des sites tiers | Faible | Corrigé (`strict-origin-when-cross-origin`) |
| 10 | Permissions navigateur non restreintes | Faible | Corrigé (`Permissions-Policy`) |
| 11 | HTTPS/HSTS non applicable en local | Déploiement | Configuration HSTS fournie ; à activer sur l'hébergement HTTPS |
| 12 | Permissions de fichiers hétérogènes (700) | Faible | Corrigé (644 fichiers / 755 dossiers) |
| 13 | Absence de SRI sur la CSS Google Fonts | Faible | Non applicable à la CSS dynamique de Google ; CSP limite l'origine |
| 14 | Absence de `robots.txt` | Faible (SEO) | Corrigé |

---

## 2. Points forts confirmés

- **Aucun code serveur** : pas de PHP, Node, Python ou base de données exposée.
- **Aucun secret** : recherche d'API keys, mots de passe, jetons et clés privées → aucun résultat.
- **Aucun cookie, aucun analytics, aucun traceur**, aucun script publicitaire.
- **Pas de sink d'injection DOM** : aucun `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval`, `document.write` ni `new Function` dans le JavaScript.
- **Données du formulaire correctement encodées** : `encodeURIComponent()` pour le corps du `mailto:` et `textContent` pour les messages de statut.
- **Lien externe** (Google Maps) en HTTPS avec `rel="noopener noreferrer"`.
- **Aucun contenu mixte** : aucune ressource chargée en `http://`.
- **Images sans métadonnées EXIF/GPS** : pas de fuite de localisation ou d'auteur.
- **Politique CSP stricte** : `default-src 'none'`, `object-src 'none'`, `base-uri 'self'`, `connect-src 'self'`.
- **Site entièrement statique** : un fichier compromis ne donne pas d'accès serveur.

---

## 3. Détail des contrôles et preuves

### 3.1 En-têtes HTTP

Le serveur de développement Python ne renvoyait initialement aucun en-tête de sécurité. La configuration de production a été ajoutée dans `_headers` (Netlify, Cloudflare Pages) et `.htaccess` (Apache).

Résultat mesuré avec un serveur appliquant `_headers` :

```
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com;
  font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; form-action 'self' mailto:;
  base-uri 'self'; object-src 'none'; frame-src 'none'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 3.2 CSP réellement appliquée

Un script inline injecté dans la page est bloqué par le navigateur :

```
Executing inline script violates the following Content Security Policy directive 'script-src 'self''.
The action has been blocked.
```

Les ressources légitimes (CSS local, JS local, Google Fonts, images) continuent de se charger ; aucune erreur console sur les 5 pages.

### 3.3 Listage de répertoires

Avant correction, `GET /img/`, `/css/` et `/js/` renvoyaient un index HTML. Après ajout de `Options -Indexes` :

```
GET /img/  →  HTTP 403
```

### 3.4 Formulaire de contact

- `action="mailto:geoexplorer.e2@gmail.com"`, aucun envoi vers un serveur tiers.
- `maxlength` ajoutés : nom 100, email 254, sujet 150, message 5000.
- Validation HTML (`required`, `type=email`) et validation JS avant ouverture de la messagerie.
- Aucune donnée stockée par le site ; le message part depuis le client mail du visiteur.
- Limite : un `mailto:` dépend du client mail et peut être bloqué ; aucune protection anti-spam serveur n'est possible sans backend.

### 3.5 JavaScript

`js/main.js` ne manipule que des classes, des attributs ARIA et `textContent`. Aucune donnée utilisateur n'est interpolée dans du HTML.

### 3.6 Images et métadonnées

`file` et `sips` confirment des JPEG standards, sans EXIF/GPS. Aucun fichier `.bak`, `.env`, `.git`, archive ou sauvegarde dans le dossier publié.

---

## 4. Correctifs appliqués

1. **CSP** dans les 5 pages via `<meta http-equiv="Content-Security-Policy">` + en-tête HTTP dans `_headers` et `.htaccess`.
2. **Suppression du script inline** de démarrage : la classe `js` est désormais statique et une feuille `css/noscript.css` rétablit l'affichage si JavaScript est désactivé.
3. **Suppression de tous les attributs `style="..."`** (remplacés par des classes CSS) : aucun style inline dans le HTML, et les délais d'animation sont appliqués par classes (`reveal-delay-*`) et non par le CSSOM, ce qui permet une CSP sans `unsafe-inline`.
4. **En-têtes de sécurité** : nosniff, DENY, Referrer-Policy, Permissions-Policy, COOP, CORP, HSTS.
5. **Blocage du listage** de répertoires (`Options -Indexes`).
6. **Limites de longueur** sur les champs du formulaire.
7. **Permissions de fichiers** normalisées en 644 (fichiers) / 755 (dossiers).
8. **`robots.txt`** ajouté.

---

## 5. Risques résiduels et recommandations

| Priorité | Recommandation |
|----------|----------------|
| Haute (déploiement) | Servir le site **exclusivement en HTTPS** avec redirection HTTP→HTTPS et vérifier la présence effective des en-têtes (`curl -I`). |
| Moyenne | **Auto-héberger les polices** (Manrope, Newsreader) pour supprimer la dépendance à Google, améliorer la confidentialité et permettre une CSP `style-src 'self'` / `font-src 'self'` encore plus stricte. |
| Moyenne | Si un formulaire fiable est nécessaire, utiliser un **backend de formulaires** (Netlify Forms, Formspree…) avec limitation de débit, honeypot et mention de confidentialité, plutôt que `mailto:`. |
| Faible | Réduire la collecte d'emails par les robots spammeurs (obfuscation légère ou formulaire), sans dégrader l'accessibilité. |
| Faible | Activer un **endpoint de reporting CSP** (`report-to`) pour détecter toute régression. |
| Faible | Ajouter un `security.txt` et une page de politique de confidentialité si des données visiteurs sont un jour collectées. |
| Faible | Mettre en place un **WAF/CDN** (Cloudflare) et des sauvegardes versionnées du site. |
| Info | `frame-ancestors` n'est pas pris en charge dans une balise `<meta>` : il est bien présent dans les en-têtes HTTP fournis. |

---

## 6. Checklist de mise en production

- [ ] Déployer sur un hébergement **HTTPS** (certificat valide, redirection 301 depuis HTTP).
- [ ] Vérifier les en-têtes : `curl -I https://domaine/` (CSP, HSTS, nosniff, DENY, Referrer-Policy…).
- [ ] Vérifier que le listage de répertoires est désactivé (`/img/` → 403 ou 404).
- [ ] Vérifier l'absence de fichiers sensibles (`.git`, `.env`, sauvegardes).
- [ ] Tester le site avec JavaScript désactivé (contenu visible via `noscript.css`).
- [ ] Tester le formulaire sur mobile et sur les principaux clients mail.
- [ ] Contrôler la CSP dans la console navigateur (aucune violation).
- [ ] Programmer la revue des dépendances (aucune bibliothèque JS pour l'instant).
- [ ] Sauvegarder le site et documenter le processus de restauration.

---

## 7. Commandes de vérification

```bash
# En-têtes de production
curl -sSI https://domaine/ | grep -Ei 'content-security|x-content|x-frame|referrer|permissions|strict-transport'

# Absence de secrets / mixed content / sinks
grep -RInE '(api[_-]?key|secret|password|token|BEGIN .*PRIVATE KEY)' .
grep -Rn 'http://' *.html css/*.css js/*.js
grep -RnE 'innerHTML|outerHTML|eval\(|document\.write' js/*.js

# Liens externes sécurisés
grep -Rn 'target="_blank"' *.html

# Listage de répertoires
curl -s -o /dev/null -w '%{http_code}\n' https://domaine/img/
```

---

**Contact sécurité :** geoexplorer.e2@gmail.com
