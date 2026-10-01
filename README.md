# WebLab

Interactive web lessons for learning through experiments.

## Titanic: from data to machine learning

Explore 1,309 passenger records, write simple prediction rules, watch a decision stump learn from 10 examples, and train a decision tree with JavaScript. The lesson has editable code cells, Run buttons, charts, and a learning board.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/vladimir2492/WebLab)

### Start in Codespaces

1. Click **Open in GitHub Codespaces** above to create your own working environment.
2. Wait for setup to finish. Node.js and the lesson dependencies are installed automatically.
3. In the terminal at the repository root, run:

   ```sh
   npm start
   ```

4. Open the forwarded **5174** port in your browser. If the page does not open automatically, choose **Ports → Titanic classroom notebook → Open in Browser**.
5. Start with **Meet the passengers**, then move through the six chapters. Use **Edit code**, change a value, and press **Run**.

Keep the terminal running during the lesson. Stop the codespace when you finish using it.

### Save your work

Edits in the classroom page are saved in that browser. They do **not** change the files in the repository. Use **Save notebook** to download your edited notebook and submit that file to your teacher. To keep source changes in GitHub, edit files in Codespaces and commit them to your own branch or fork.

### Run locally

Install Node.js 24 (or Node.js 22.12 or newer), then run these commands from this repository:

```sh
npm run setup
npm start
```

Open <http://127.0.0.1:5174/>. No API key or paid ML service is needed.

### Project layout

- `titanic-js/` — complete lesson, notebook app, models, and passenger data.
- `.devcontainer/` — Codespaces environment and port forwarding.
- [Lesson guide](titanic-js/README.md) — teaching flow, commands, and model results.

The interactive notebook needs the running Vite server to compile edited cells. A static build or GitHub Pages alone does not provide that service.

Setup references: [GitHub Codespaces for Node.js](https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/setting-up-your-nodejs-project-for-codespaces), [forwarded ports](https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace), and [Vite server options](https://vite.dev/config/server-options).
