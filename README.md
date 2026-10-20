# Lindy's Pharmacy static website

This is a plain HTML, CSS, and JavaScript version of the pharmacy website. It can be hosted on GitHub Pages without running Python or installing packages.

## Preview

Open `index.html` in a browser, or use the VS Code Live Server extension for a local preview. The website's navigation links are ordinary relative HTML links, so they work on GitHub Pages project sites as well as at a domain root.

## Publish with GitHub Pages

1. Create or open a GitHub repository and upload the static website files and `assets` folder.
2. In the repository, open **Settings → Pages**.
3. Select **Deploy from a branch**, choose the branch containing the files and the repository root folder, then save.
4. Open the published URL after GitHub Pages finishes deploying.

## Important data limitation

GitHub Pages is static hosting: it does not run `app.py`, provide a database, send appointment requests to the pharmacy, or authenticate staff. This demo stores requests in the current browser's `localStorage`; other visitors and devices cannot see them. The Staff Portal is not protected and must not be used for real patient data. To operate a real appointment service, connect the pages to a secure backend with authentication and shared storage.

The original Python app and Jinja templates are left unchanged as source files; the static website does not depend on them.
