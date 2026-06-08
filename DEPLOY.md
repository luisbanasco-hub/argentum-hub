# 🚀 Deploy Argentum Hub — 3 manual steps

Everything is built, tested, and committed locally. The autonomous agent
could **not** push because no GitHub credentials were available in its
environment (no `gh` CLI, no token, SSH key rejected). These steps take ~2 min.

## 1. Create the GitHub repo

Either via the web (https://github.com/new → owner `luisbanasco-hub`,
name `argentum-hub`, **Public**, *don't* add a README), or with `gh`:

```bash
gh repo create luisbanasco-hub/argentum-hub --public --source=. --remote=origin --push
```

If you used the web UI, push manually instead (the remote is already set):

```bash
cd argentum-hub
git push -u origin main
```

## 2. Enable GitHub Pages

Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The included workflow (`.github/workflows/deploy.yml`) then deploys on every
push to `main`. First deploy runs automatically once Pages is enabled and a
commit lands. Live in ~1 min at:

```
https://luisbanasco-hub.github.io/argentum-hub/
```

## 3. (Optional) Link the Hub from the MAX dashboard

In the **`argentum-max-v2`** repo, edit `dashboard/index.html` and add a Hub
link in the header (this repo isn't checked out here, so it wasn't done
automatically):

```html
<a href="https://luisbanasco-hub.github.io/argentum-hub/"
   style="color:#58a6ff;text-decoration:none">🏠 Hub</a>
```

---

### Verify after deploy
- Open the URL on your phone → **Add to Home Screen** (⚔️ icon).
- All 4 pages should show 🟢 LIVE data; empty tables show clearly-labelled
  🟡 MOCK until they populate.
