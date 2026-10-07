# Terravolt

Jeu de gestion en bac à sable dans le navigateur. Bâtis un groupe dans l'agriculture, l'électricité, la pêche et l'eau sur un territoire en isométrique.

- Saisons, météo, marchés qui fluctuent
- Trésorerie réaliste : délais de paiement, TVA trimestrielle, impôt sur les sociétés, prêts, découvert
- Équipes, moral, recherche sans plafond
- Holding, filiales, dividendes et synergies entre secteurs
- Sauvegarde automatique dans le navigateur

## Lancer en local

Aucune dépendance, aucun build. Ouvre `index.html` dans un navigateur, ou :

```bash
npx serve .
```

## Déployer sur Vercel

Importe le dépôt dans Vercel, preset **Other**, sans commande de build ni dossier de sortie. Le site est statique.

## Structure

- `index.html` : la page
- `style.css` : les styles
- `engine.js` : la simulation (aucune dépendance au DOM)
- `ui.js` : rendu de la carte, panneaux et boucle de jeu
