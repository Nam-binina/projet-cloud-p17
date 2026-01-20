# projet-cloud-p17

## Authentification Firebase directe
- L'application mobile (Ionic + Vue) utilise Firebase Auth directement côté client (sans passer par une API maison).
- VueFire est installé et initialisé, ce qui expose l'utilisateur courant et simplifie la gestion d'état.

### Configuration
- Dupliquez `mobile-signal/.env.example` en `mobile-signal/.env` et renseignez vos clés Firebase.
- Les clés peuvent aussi être codées en dur (déjà présentes dans `src/main.ts`), mais il est recommandé d'utiliser les variables d'environnement.

### Démarrer en local

```bash
cd mobile-signal
npm install
npm run dev
```

### Connexion
- Sur l'écran `Login`, entrez un email et mot de passe d'un utilisateur existant dans votre projet Firebase.
- En cas de succès, vous êtes redirigé vers `/home`. Les routes protégées redirigent vers `/login` si non authentifié.