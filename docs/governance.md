# Governance & Security: Branch Protection

To maintain code quality and prevent accidental breaking changes to the production environment, it is highly recommended to protect the `main` branch.

## Setting Up Branch Protection (GitHub)

1. Go to your repository on **GitHub**.
2. Click on **Settings** in the top navigation bar.
3. In the left sidebar, click on **Branches**.
4. Click the **Add branch protection rule** button.
5. In the **Branch name pattern** field, type `main`.
6. Enable the following settings:
    - **Require a pull request before merging**: This ensures all changes are reviewed.
    - **Require approvals**: Set "Required number of approvals before merging" (typically 1).
    - **Require status checks to pass before merging**: (Optional/Recommended) If you have CI (e.g., GitHub Actions) set up.
    - **Do not allow bypassing the above settings**: Ensures even admins follow the PR process.
7. Click **Create** at the bottom of the page.

## Workflow for Developers

With branch protection enabled, the workflow becomes:
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -m "Description"`
3. Push to the feature branch: `git push origin feature/your-feature`
4. Create a **Pull Request** on GitHub.
5. Once reviewed and approved, merge the PR into `main`.
