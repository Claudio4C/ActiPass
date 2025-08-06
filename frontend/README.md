# 🚀 Frontend – SaaS Assos

Frontend moderne pour le projet **SaaS Assos**, basé sur React, TypeScript, Vite, TailwindCSS et une configuration stricte d'ESLint & Prettier pour garantir un code propre et cohérent.

---

## 📦 Stack utilisée

- ⚛️ [React 19](https://react.dev/)
- ⚡ [Vite](https://vitejs.dev/)
- 🔷 [TypeScript](https://www.typescriptlang.org/)
- 🎨 [TailwindCSS](https://tailwindcss.com/)
- 🧹 [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)
- 🛡️ [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/okonet/lint-staged) (hooks Git)

---

## 🧪 Scripts disponibles

```bash
# Lancer le serveur de dev avec HMR
npm run dev

# Build de production
npm run build

# Linting (ESLint)
npm run lint

# Lint + auto-fix
npm run lint:fix

# Formater le code (Prettier)
npm run format

# Vérifier que le format est bon
npm run format:check

# Lint + format check (pré-commit)
npm run check

# Preview du build
npm run preview

# Installer Husky (après npm install)
npm run prepare
```
## ▶️ Exemple d’utilisation

### Cloner le repo et installer les dépendances :

```bash
git clone <url>
cd frontend
npm install
```

### Lancer le serveur de développement :

```bash
npm run dev
```

> ⚠️ Assure-toi que le backend est aussi lancé si nécessaire.

---

## 🧪 Qualité & vérifications

### Avant chaque commit :

- `lint` + `prettier` sont **automatiquement appliqués** grâce à `husky` + `lint-staged`.

### Vérification manuelle :

```bash
npm run check
```

Cela exécute :

- `eslint` (analyse de code)
- `prettier --check` (formatage)

### Pour corriger automatiquement :

```bash
npm run lint:fix
npm run format
```

---

## 📦 Créer une build de production

```bash
npm run build
```

Cela compile le projet TypeScript + Vite pour la production.
---

## ✅ Qualité de code

- Les erreurs de linting bloquent les commits grâce à `husky` + `lint-staged`.
- Formatage automatique à chaque commit.
- Support complet de TypeScript et JSX avec `eslint-plugin-react` et `@typescript-eslint`.

---

## 📁 Arborescence

```
frontend/
├── src/
│   ├── assets/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── main.tsx
├── eslint.config.ts
├── .prettierrc
├── tsconfig.json
├── README.md
├── vite.config.ts
└── package.json
```

---

## 📣 Auteurs

> Développé par Kyllian & Claudio 2 passionés de sport et de tech.  
> Code propre, scalable, et prêt pour la production. 💪
