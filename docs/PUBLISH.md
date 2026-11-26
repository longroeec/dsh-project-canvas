# Publishing dsh-project-canvas

The package is ready (`pnpm pack` output: `index.js`, `client.js`, `lib/`, `locale/`, `icon.svg`, `cordis.patch.yml`, `README.md`, `LICENSE`). This machine has no Git, so the push has to happen from a machine where Git or GitHub Desktop is installed.

## 1. Create the repository

On GitHub, create `dsh-project-canvas` (public). Do not add a README, license, or `.gitignore` — the package has them.

## 2. Push this folder

```powershell
cd D:\MyFiles\Roeec_workspace\project-canvas-plugin
git init
git add .
git commit -m "dsh-project-canvas 0.1.0"
git branch -M main
git remote add origin https://github.com/<your-user>/dsh-project-canvas.git
git push -u origin main
```

## 3. Record the commit

The market must pin a 40-hex commit:

```powershell
git rev-parse HEAD
```

Copy the value and replace the placeholder in `market/index.example.json`'s `source.commit` (the file currently pins `000…0`).

## 4. Publish the index

1. Copy `market/index.example.json` to `market/index.json`, fill in the commit, and push it.
2. The index URL is the raw file, for example:
   `https://raw.githubusercontent.com/<your-user>/dsh-project-canvas/main/market/index.json`
3. In DSH: **Plugins → Discover → add index**, paste that URL, install `Project Canvas`.
4. Each later release: bump `version` in `package.json`, commit, take the new SHA, add a new entry to `versions` with a `publishTimestamp` in **Unix seconds**, and push.

Because the index file lives in the same commit it describes, push the code first, take its SHA, add `market/index.json` in a second commit, and keep the `source.commit` pointing at the first commit (the code commit). Later index edits do not change what gets installed.

## 5. npm instead (optional)

If you prefer npm, `npm publish --access public` and use:

```json
"source": { "type": "npm" }
```

Keep the index `version` equal to the published version. npm needs an account and no Git, but the first publish also needs a one-time login.

## Checking the index locally

With the DSH installation available:

```powershell
$env:ELECTRON_RUN_AS_NODE = '1'
& 'C:\Users\<you>\AppData\Local\Programs\DeepSeek Harness\DeepSeek Harness.exe' -e "const fs=require('node:fs');const m=require('C:/Users/<you>/AppData/Local/Programs/DeepSeek Harness/resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-plugin-market-index');try{m.parseMarketIndex(JSON.parse(fs.readFileSync('market/index.json','utf8')),'https://example.com/index.json');console.log('index ok')}catch(e){console.error(e.message);process.exit(1)}"
```

A placeholder commit `000…0` passes format validation but cannot be installed; only publish after replacing it.
