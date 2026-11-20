# Sécurité — site GEO2E2

**Date de l'audit :** 20 novembre 2026  
**Périmètre :** l'intégralité du site statique `site-geo2e2-bumigeme` — **10 pages HTML (5 FR, 5 EN)**, feuilles CSS, JavaScript, polices auto-hébergées, images, fichiers de configuration serveur.  
**Hors périmètre :** hébergement, DNS, certificats TLS, messagerie Gmail, postes des visiteurs.

> Ce document a été corrigé le 20/11/2026 : la version précédente annonçait à tort « 5 pages HTML » alors que le site en compte 10, et datait l'audit du 7 novembre. Un audit qui se trompe sur son propre périmètre n'a pas de valeur.

---

## 1. Synthèse

Le site est un site vitrine **statique** : aucun serveur applicatif, aucune base de données, aucun compte utilisateur, aucun cookie, aucun outil d'analyse. Cette architecture réduit fortement la surface d'attaque (pas d'injection SQL, pas de session, pas de CSRF côté serveur, pas de RCE applicative).

**Aucune vulnérabilité critique ou haute n'a été détectée.** Les points perfectibles relevés sont principalement des durcissements de déploiement et de confidentialité ; ils ont été corrigés ou explicitement documentés.

| # | Constat | Gravité | État |
|---|---------|---------|------|
| 1 | Absence d'en-têtes de sécurité HTTP et de CSP | Moyenne | Corrigé (`_headers`, `.htaccess`, balises `<meta>` sur 10 pages) |
| 2 | Script inline sans CSP (boot JS) | Moyenne | Corrigé (script supprimé, CSP `script-src 'self'`) |
| 3 | Listage des répertoires activé sur le serveur de prévisualisation | Moyenne (déploiement) | Corrigé (`Options -Indexes`) et vérifié (403) |
| 4 | Dépendance à Google Fonts (tiers, vie privée, chaîne d'approvisionnement) | Moyenne | **Corrigé** : 4 fichiers WOFF2 variables auto-hébergés, CSP `font-src 'self'` |
| 5 | Formulaire de contact en `mailto:` (pas de backend) | Faible | Accepté et documenté ; **message d'échec explicite ajouté** |
| 6 | Adresse email exposée en clair dans le HTML | Faible | Risque accepté (collecte de spam possible) |
| 7 | Clickjacking non bloqué | Faible | Corrigé (`frame-ancestors 'none'`, `X-Frame-Options: DENY`) |
| 8 | Reniflage MIME | Faible | Corrigé (`nosniff`) |
| 9 | Fuite de référent vers des sites tiers | Faible | Corrigé (`strict-origin-when-cross-origin`) |
| 10 | Permissions navigateur non restreintes | Faible | Corrigé (`Permissions-Policy`) |
| 11 | HTTPS/HSTS non applicable en local | Déploiement | **Toujours en attente** : certificat invalide sur l'hébergement ; aucune URL `https://` écrite tant que le service n'est pas réel |
| 12 | Permissions de fichiers hétérogènes (700) | Faible | Corrigé (644 fichiers / 755 dossiers) |
| 13 | Absence de SRI sur la CSS Google Fonts | Faible | **Devenu sans objet** : plus aucune ressource tiers |
| 14 | Absence de `robots.txt` | Faible (SEO) | Corrigé |
| 15 | Aucun historique de versions, rollback impossible après FTP | Moyenne (exploitation) | **Corrigé** : dépôt Git initial + tag `avant-remédiation` |
| 16 | Versionnage de cache tapé à la main 60 fois | Faible (exploitation) | **Corrigé** : `build.sh`, une seule source de vérité |
| 17 | Favicon générique `logo.jpeg`, sans icône iOS dédié | Faible | **Corrigé** : `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` |

---

## 2. Points forts confirmés

- **Aucun code serveur** : pas de PHP, Node, Python ou base de données exposée.
- **Aucun secret** : recherche d'API keys, mots de passe, jetons et clés privées → aucun résultat. Les identifiants FTP sont conservés hors du dossier publié et ne figurent dans aucun fichier du site.
- **Aucun cookie, aucun analytics, aucun traceur**, aucun script publicitaire.
- **Zéro origine tierce** : ni police, ni script, ni image, ni feuille de style distante. La CSP peut être stricte sans exception.
- **Pas de sink d'injection DOM** : aucun `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval`, `document.write` ni `new Function` dans le JavaScript.
- **Données du formulaire correctement encodées** : `encodeURIComponent()` pour le corps du `mailto:` et `textContent` pour les messages de statut.
- **Lien externe** (Google Maps) en HTTPS avec `rel="noopener noreferrer"`.
- **Aucun contenu mixte** : aucune ressource chargée en `http://`. Les URL `http://` présentes dans les balises `canonical`/`hreflang` ne chargent rien et restent cohérentes avec le service réellement fourni.
- **Images sans métadonnées EXIF/GPS** : pas de fuite de localisation ou d'auteur.
- **Politique CSP stricte** : `default-src 'none'`, `style-src 'self'`, `font-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `connect-src 'self'`.
- **Site entièrement statique** : un fichier compromis ne donne pas d'accès serveur.

---

## 3. Détail des contrôles et preuves

### 3.1 En-têtes HTTP

La configuration de production est ajoutée dans `_headers` (Netlify, Cloudflare Pages) et `.htaccess` (Apache).

```
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self';
  img-src 'self' data:; connect-src 'self'; form-action 'self' mailto:; base-uri 'self';
  object-src 'none'; frame-src 'none'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
Cross-Origin-Resource-Policy: same-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains   [uniquement si HTTPS valide]
```

**Important** : ces fichiers décrivent la configuration souhaitée. Sur l'hébergement actuel, seul le serveur d'origine décide des en-têtes réellement renvoyés ; la vérification doit être faite avec `curl -I` sur l'URL publique, pas en lisant `_headers`.

**Constat mesuré le 20/11/2026 après déploiement** : l'en-tête HTTP `Content-Security-Policy` renvoyé par AwardSpace mentionne encore `https://fonts.googleapis.com` et `https://fonts.gstatic.com`. L'hébergeur n'applique donc pas (ou pas encore) la version durcie de `.htaccess`. Ce n'est pas un risque exploitable : la balise `<meta http-equiv="Content-Security-Policy">`, strictement plus restrictive (`style-src 'self'; font-src 'self'`), est présente sur les 10 pages et le navigateur applique l'intersection des deux politiques — aucune origine tierce n'est chargée, vérifié dans la console et dans le réseau. La documentation reste néanmoins explicite sur cet écart plutôt que de prétendre que l'en-tête est conforme.

### 3.2 CSP réellement appliquée

Un script inline injecté dans la page est bloqué par le navigateur :

```
Executing inline script violates the following Content Security Policy directive 'script-src 'self''.
The action has been blocked.
```

Les ressources légitimes (CSS local, JS local, polices locales, images) continuent de se charger ; aucune erreur console sur les 10 pages.

### 3.3 Listage de répertoires

Avant correction, `GET /img/`, `/css/` et `/js/` renvoyaient un index HTML. Après ajout de `Options -Indexes` :

```
GET /img/  →  HTTP 403
```

### 3.4 Formulaire de contact

- `action="mailto:geoexplorer.e2@gmail.com"`, aucun envoi vers un serveur tiers.
- `maxlength` : nom 100, email 254, sujet 150, message 5000.
- Validation HTML (`required`, `type=email`) et validation JS avant ouverture de la messagerie.
- **Fallback explicite** : si le client mail ne s'ouvre pas, un message indique à l'utilisateur d'écrire directement à l'adresse affichée. Le formulaire ne reste plus silencieux.
- Aucune donnée stockée par le site ; le message part depuis le client mail du visiteur.
- Limite résiduelle : un `mailto:` dépend du client mail et peut être bloqué ; aucune protection anti-spam serveur n'est possible sans backend.

### 3.5 JavaScript

`js/main.js` ne manipule que des classes, des attributs ARIA et `textContent`. Aucune donnée utilisateur n'est interpolée dans du HTML.

`js/lang.js` n'écrit dans `localStorage` que sur un **clic explicite** sur le sélecteur FR/EN. Le paramètre `?lang=` force la requête en cours et est propagé lors de la redirection, sans jamais devenir une préférence permanente : un lien partagé ne modifie pas la langue du visiteur.

### 3.6 Images et métadonnées

`file` et `sips` confirment des JPEG standards, sans EXIF/GPS. L'image de fond `hero-background-clean.jpg` est un recadrage vérifié par OCR : elle ne contient aucun texte, ce qui évite la duplication d'information et les doublons entre le visuel et le DOM.

### 3.7 Dépôt et restauration

Le dossier de travail est un dépôt Git avec un commit initial et le tag `avant-remédiation`. **Le dossier `.git` ne doit jamais être transféré vers l'hébergement** ; `.htaccess` le refuse déjà, mais l'exclusion est aussi appliquée lors du déploiement.

### 3.8 Hébergement GitHub Pages

Le site est publié sur `https://essahlaouifouad.github.io/geo2e2/` depuis la branche `main`. GitHub Pages sert le HTTPS avec un certificat valide, ce qui lève le blocage historique lié au certificat auto-signé de l'hébergement d'origine. Le fichier `.nojekyll` empêche toute transformation Jekyll. Les 40 URL absolues (canonicals, hreflang, x-default) pointent désormais vers cette adresse, et un `sitemap.xml` avec alternates de langue est fourni.

**Attention** : GitHub Pages ne lit le `robots.txt` qu'à la racine du domaine (`https://essahlaouifouad.github.io/robots.txt`). Celui du dépôt est donc principalement documentaire ; le `sitemap.xml` peut être soumis directement dans Google Search Console.

---

## 4. Correctifs appliqués

1. **CSP durcie** sur les 10 pages via `<meta http-equiv="Content-Security-Policy">` + en-tête HTTP dans `_headers` et `.htaccess` : suppression de `fonts.googleapis.com` et `fonts.gstatic.com`.
2. **Polices auto-hébergées** : `css/fonts.css` + 4 WOFF2 variables (latin, latin-ext), 258 Ko au total.
3. **Suppression du script inline** de démarrage : la classe `js` est statique et `css/noscript.css` rétablit l'affichage si JavaScript est désactivé.
4. **Suppression de tous les attributs `style="..."`** : aucun style inline dans le HTML, délais d'animation appliqués par classes.
5. **En-têtes de sécurité** : nosniff, DENY, Referrer-Policy, Permissions-Policy, COOP, CORP, HSTS conditionnel.
6. **Blocage du listage** de répertoires (`Options -Indexes`).
7. **Limites de longueur** sur les champs du formulaire + message d'échec explicite.
8. **Permissions de fichiers** normalisées en 644 (fichiers) / 755 (dossiers).
9. **`robots.txt`** ajouté.
10. **Favicons dédiés** et `apple-touch-icon`.
11. **Git + tag de restauration**, `build.sh` pour un versionnage de cache unique.

---

## 5. Risques résiduels et recommandations

| Priorité | Recommandation |
|----------|----------------|
| Haute (déploiement) | **Résolu sur GitHub Pages** (HTTPS valide). Reste à faire sur l'hébergement d'origine s'il est conservé : redirection 301 vers GitHub Pages. Ne jamais écrire d'URL `https://` pour un service qui ne le fournit pas réellement. |
| Moyenne | Remplacer `mailto:` par un **backend de formulaire** (Formspree, Netlify Forms…) avec limitation de débit, honeypot et politique de confidentialité, dès validation par le client. |
| Faible | Réduire la collecte d'emails par les robots spammeurs (obfuscation légère), sans dégrader l'accessibilité. |
| Faible | Activer un **endpoint de reporting CSP** (`report-to`) pour détecter toute régression. |
| Faible | Ajouter un `security.txt` et une page de politique de confidentialité si des données visiteurs sont un jour collectées. |
| Faible | Mettre en place un **WAF/CDN** et des sauvegardes versionnées du site. |
| Info | `frame-ancestors` n'est pas pris en charge dans une balise `<meta>` : il est bien présent dans les en-têtes HTTP fournis. |
| Info | Le serveur d'hébergement bloque les requêtes d'images sans en-tête `Referer` (403). Les balises `og:image` ont donc été retirées plutôt que de livrer une vignette sociale vide. |

---

## 6. Checklist de mise en production

- [x] Déployer les fichiers modifiés sans transférer `.git`, `.gitignore` ni `build.sh`.
- [x] Passer en **HTTPS** via GitHub Pages (`https://essahlaouifouad.github.io/geo2e2/`) : certificat valide, canonicals, hreflang et sitemap mis à jour en conséquence.
- [ ] Si le site reste aussi servi depuis l'hébergement d'origine, y appliquer une redirection 301 vers GitHub Pages pour éviter le contenu dupliqué.
- [ ] Vérifier les en-têtes réels : `curl -sSI https://essahlaouifouad.github.io/geo2e2/ | grep -Ei 'content-security|x-frame|referrer|permissions'`.
- [x] Vérifier que le listage de répertoires est désactivé (`/img/` → 403).
- [x] Vérifier l'absence de fichiers sensibles dans le dossier publié.
- [x] Tester le site avec JavaScript désactivé (contenu visible via `noscript.css`).
- [x] Tester le formulaire sur mobile et sur les principaux clients mail.
- [x] Contrôler la CSP dans la console navigateur (aucune violation).
- [x] Programmer la revue des dépendances (aucune bibliothèque JS, aucune ressource tierce).
- [x] Sauvegarder le site et documenter le processus de restauration (Git + tag).

---

## 7. Commandes de vérification

```bash
# Un seul numéro de version de cache
./build.sh >/dev/null && grep -rho 'v=[0-9]\{8\}' --include='*.html' . | sort | uniq -c

# Aucune origine tierce
grep -RIn 'fonts.googleapis\|fonts.gstatic' --include='*.html' --include='*.css' . || echo OK

# Aucun texte de marque FR sur les pages EN
grep -rn 'GEOEXPLORER GÉORESOURCES' en/ || echo OK

# Aucun contenu dans l'image de fond
grep -rn 'hero-background.*alt="[^"]' index.html en/index.html || echo OK

# Absence de secrets / mixed content / sinks
grep -RInE '(api[_-]?key|secret|password|token|BEGIN .*PRIVATE KEY)' .
grep -Rn 'http://' *.html css/*.css js/*.js
grep -RnE 'innerHTML|outerHTML|eval\(|document\.write' js/*.js

# En-têtes de production
curl -sSI https://essahlaouifouad.github.io/geo2e2/ | grep -Ei 'content-security|x-content|x-frame|referrer|permissions'
```

---

**Contact sécurité :** geoexplorer.e2@gmail.com
