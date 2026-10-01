# WebLab

Interactive web lessons for learning through experiments.

## Titanic: from data to machine learning

Explore 1,309 passenger records, write a simple prediction rule, watch a decision stump learn from 10 examples, train a decision tree with JavaScript, and check whether the model is any good. The lesson has editable code cells, answer boxes, guess-first questions, charts, an exit quiz, and a report students can hand in.

- **Students:** open the lesson and start with **Meet the passengers**.
- **Teachers:** read the [teacher notes](titanic-js/TEACHER-NOTES.md) for the timing plan, expected answers, and what the machine learning does.

### Start the lesson

There are three ways to run it. Pick one.

**1. As a web page (no setup for students).** The lesson is a static site, so GitHub Pages can host it. One-time step: in the repository on GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**. The workflow in `.github/workflows/pages.yml` then publishes the lesson on every push to `main`, at <https://vladimir2492.github.io/WebLab/>. Students only need that link and a browser.

**2. In GitHub Codespaces.**

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/vladimir2492/WebLab)

1. Click **Open in GitHub Codespaces** to create your own working environment.
2. Wait for setup to finish. Node.js and the lesson dependencies are installed automatically.
3. In the terminal at the repository root, run:

   ```sh
   npm start
   ```

4. Open the forwarded **5174** port in your browser. If the page does not open automatically, choose **Ports → Titanic classroom notebook → Open in Browser**.

Keep the terminal running during the lesson. Stop the codespace when you finish using it.

**3. On your own computer.** Install Node.js 24 (or Node.js 22.12 or newer), then run these commands from this repository:

```sh
npm run setup
npm start
```

Open <http://127.0.0.1:5174/>. No API key or paid ML service is needed.

### Save your work

Answers, guesses, and code changes are saved in the browser as you work. They do **not** change the files in the repository.

- **Save my work** downloads a report: one HTML file with your answers, guesses, code, and results. Open it in any browser, then hand it in.
- **Open saved work** loads a report file again, for example on another computer in the next session.
- **↺ Reset** on a cell puts its original code back. **Start the lesson again** clears everything in this browser.

### Project layout

- `titanic-js/` — complete lesson, notebook app, models, and passenger data.
- [Teacher notes](titanic-js/TEACHER-NOTES.md) — how to run the two sessions, expected answers, and an assessment of the machine learning used.
- [Lesson guide](titanic-js/README.md) — commands, files, and model results.
- `.devcontainer/` — Codespaces environment and port forwarding.
- `.github/workflows/pages.yml` — publishes the lesson to GitHub Pages.

Setup references: [GitHub Pages with GitHub Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [GitHub Codespaces for Node.js](https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/setting-up-your-nodejs-project-for-codespaces), [forwarded ports](https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace), and [Vite server options](https://vite.dev/config/server-options).
