# Buurtapp Beekhuizen — broncode

Dit is de volledige broncode van de Buurtapp Beekhuizen, oorspronkelijk gebouwd als
Claude-artifact en hier omgezet naar een standaard React + Vite-project dat je zelf
kunt hosten (bijvoorbeeld op Vercel of Netlify), met een eigen naam en logo bij
"Toevoegen aan beginscherm".

## Wat is er anders dan de Claude-artifact-versie?

1. **Opslag (storage)** — de artifact-versie gebruikt `window.storage`, een functie
   die alleen binnen Claude bestaat en automatisch gedeeld is tussen alle gebruikers.
   Die bestaat hier niet vanzelf. Dit project bevat een vervangende adapter
   (bovenaan in `src/App.jsx`) die dezelfde functies aanbiedt maar opslaat in
   `localStorage` — dus **per toestel/browser, niet gedeeld tussen bewoners**.

   Wil je dat berichten, reacties en privéberichten wél door alle bewoners gezien
   worden (zoals in de artifact-versie)? Dan heb je een echte database nodig.
   De makkelijkste gratis opties:
   - [Supabase](https://supabase.com) (gratis tier, Postgres-database, simpele API)
   - [Firebase](https://firebase.google.com) (gratis tier, Realtime Database of Firestore)

   Vervang dan de functies in de `window.storage`-adapter bovenaan `src/App.jsx`
   door echte API-calls naar Supabase/Firebase. De rest van de app hoeft niet
   aangepast te worden, zolang de functienamen (`get`, `set`, `delete`, `list`)
   hetzelfde blijven en hetzelfde teruggeven.

2. **AI-bevestigingsbericht bij nieuwe posts** — de app probeert bij elk nieuw
   bericht een vriendelijke AI-reactie te genereren via de Anthropic API. Dat werkt
   automatisch binnen een Claude-artifact, maar buiten die omgeving heb je een
   eigen Anthropic API-key nodig (via [console.anthropic.com](https://console.anthropic.com)).
   Zonder API-key faalt dit netjes stil op de achtergrond en valt de app terug op
   een standaardbericht ("Bericht geplaatst!") — dit is dus geen blocker, alleen
   een gemiste leuke extra.

   Wil je dit wel laten werken? Zet de API-call dan achter een eigen kleine
   serverless function (bijv. een Vercel Edge Function) zodat je API-key niet
   zichtbaar wordt in de browser-code. Direct vanuit de browser een Anthropic
   API-key gebruiken is onveilig, want iedereen kan die dan uitlezen.

3. **Naam en logo bij "Toevoegen aan beginscherm"** — dit is precies waarom dit
   project bestaat. `index.html` en `public/manifest.json` bevatten nu de juiste
   titel ("Buurtapp Beekhuizen") en het Belang Beekhuizen-logo als icoon. Zodra dit
   gehost wordt op je eigen domein (in plaats van binnen claude.ai), pakken zowel
   iOS als Android dit automatisch correct op.

## Lokaal draaien

Je hebt [Node.js](https://nodejs.org) nodig (versie 18 of hoger).

```bash
npm install
npm run dev
```

Open daarna `http://localhost:5173` in je browser.

## Live zetten (gratis, zonder eigen server)

### Optie A — Vercel (aanbevolen, makkelijkst)

1. Zet deze map in een nieuwe GitHub-repository (zie hieronder).
2. Ga naar [vercel.com](https://vercel.com), log in met je GitHub-account.
3. Kies "New Project", selecteer de repository.
4. Vercel herkent automatisch dat het een Vite-project is — klik op "Deploy".
5. Na een paar minuten krijg je een live link, bijv. `buurtapp-beekhuizen.vercel.app`.
6. Optioneel: koppel een eigen domein via Vercel's instellingen (bijv. `app.belangbeekhuizen.nl`).

### Optie B — Netlify

1. Zet deze map in een nieuwe GitHub-repository.
2. Ga naar [netlify.com](https://netlify.com), log in met je GitHub-account.
3. Kies "Add new site" → "Import an existing project".
4. Selecteer de repository. Build-instellingen worden automatisch herkend
   (build command: `npm run build`, publish directory: `dist`).
5. Klik op "Deploy".

## Code in een nieuwe GitHub-repository zetten

Als je nog geen GitHub-repository hebt:

1. Ga naar [github.com/new](https://github.com/new) en maak een nieuwe (bijv. private) repository aan, bijvoorbeeld genaamd `buurtapp-beekhuizen`.
2. Pak deze bestanden uit op je computer.
3. Open een terminal in de uitgepakte map en voer uit:

```bash
git init
git add .
git commit -m "Eerste versie buurtapp Beekhuizen"
git branch -M main
git remote add origin https://github.com/JOUW-GEBRUIKERSNAAM/buurtapp-beekhuizen.git
git push -u origin main
```

(Vervang `JOUW-GEBRUIKERSNAAM` door je eigen GitHub-gebruikersnaam.)

Daarna kun je deze repository koppelen aan Vercel of Netlify zoals hierboven beschreven.

## Wijktoegangscode en beheercode aanpassen

Deze staan bovenin `src/App.jsx`:

```js
const TOEGANGSCODE = "BEEKHUIZEN2026";
const BEHEERCODE = "BESTUUR2026";
```

Pas deze waarden aan en commit/push de wijziging — bij de volgende deploy
(automatisch bij Vercel/Netlify zodra je naar GitHub pusht) worden ze bijgewerkt.

## Mapstructuur

```
buurtapp-beekhuizen/
├── index.html              ← PWA meta-tags, titel, icon-koppeling
├── package.json
├── vite.config.js
├── public/
│   ├── manifest.json        ← PWA-naam en -icoon voor Android
│   ├── icon-192.png
│   ├── icon-512.png
│   └── logo.png
└── src/
    ├── main.jsx              ← React-opstartpunt
    ├── index.css
    └── App.jsx                ← De volledige buurtapp (alle logica + UI)
```
