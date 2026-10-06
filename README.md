# Manoztralia — concept de refonte

Proposition de refonte de la page d'accueil de [manoztralia.fr](https://www.manoztralia.fr/), l'agence d'éducation française spécialisée sur l'Australie (cours d'anglais, logement, visas).

**Démo en ligne : https://exosuppra.github.io/manoztralia-refonte/**

> Maquette de proposition, non officielle. Les textes, chiffres, avis et liens proviennent du site actuel ; la page est marquée `noindex` pour ne pas concurrencer le site réel dans les moteurs de recherche.

## L'idée : « Embarquement immédiat »

Le site actuel dit « Pars en Australie l'esprit léger, on s'occupe de tout ». La refonte en fait une expérience : on **scrolle comme on voyage**, de Paris à Sydney.

| Moment | Ce qui se passe |
| --- | --- |
| Chargement | Carte d'embarquement `PAR → SYD`, l'avion traverse l'écran pendant que le compteur monte. |
| Hero | Un hublot d'avion dont le store se lève sur l'opéra de Sydney. Au scroll, le hublot s'ouvre jusqu'au plein écran : « On s'occupe de tout. » |
| Le concept | Le pitch « Skyscanner des séjours linguistiques » s'allume mot à mot à la lecture, puis les chiffres clés se comptent. |
| Manon | Portrait détouré fondu dans la section, frise 2015 → aujourd'hui qui se remplit au scroll. |
| Visas | WHV 417 et visa étudiant 500 présentés comme deux cartes d'embarquement (inclinaison 3D au survol, tampon « Visa granted »). |
| Programmes | Les 8 programmes en liste éditoriale, avec une photo qui suit le curseur. |
| Destinations | Défilement horizontal des 8 villes ; une carte de l'Australie tracée en SVG indique la ville affichée. |
| Plan de vol | Les 5 étapes de l'accompagnement le long d'une route en pointillés qu'un avion parcourt au scroll. |
| Services, avis, blog | Cartes à remplissage depuis le curseur, avis Google en double défilement, derniers articles. |
| Quiz | Mini-quiz interactif « Quelle ville est faite pour toi ? » qui mène à la demande de devis. |
| Partout | Curseur personnalisé, boutons magnétiques, bandeaux dont la vitesse suit le scroll, compteur de kilomètres parcourus, heures en direct France / Sydney / Perth. |

## Parti pris design

- **Couleurs** : celles de la marque (bleu nuit `#1C395D`, jaune soleil `#FBB315`, bleu océan `#037090`), complétées d'un sable chaud et d'un corail pour l'outback.
- **Typographies** : Bricolage Grotesque (titres), Instrument Serif italique (accents), DM Sans (texte), DM Mono (détails « billet d'avion »), Caveat (annotations manuscrites, pour garder la proximité de Manon).
- **Ton** : le tutoiement et la première personne du site actuel sont conservés.

## Technique

Site statique, sans étape de build.

- HTML / CSS / JavaScript natifs
- [GSAP 3](https://gsap.com/) + ScrollTrigger pour les animations, [Lenis](https://lenis.darkroom.engineering/) pour le défilement fluide (chargés par CDN)
- Responsive (mobile, tablette, desktop), `prefers-reduced-motion` respecté, contenu lisible sans JavaScript

```
index.html
assets/css/style.css
assets/js/main.js
assets/favicon.svg
```

Pour le lancer en local, servir le dossier avec n'importe quel serveur statique, par exemple :

```bash
npx serve .
```

## Crédits et limites de la maquette

- Logo, portrait de Manon et quelques visuels sont chargés directement depuis manoztralia.fr ; les photos d'Australie viennent d'[Unsplash](https://unsplash.com/). Pour une mise en production, ces fichiers seraient optimisés et hébergés avec le site.
- Tous les boutons renvoient vers les pages et outils existants (Calendly, devis, boutique, partenaires).
- Seule la page d'accueil est maquettée. Les pages intérieures (programmes, visa étudiant, blog, devis) restent à décliner dans le même système.
