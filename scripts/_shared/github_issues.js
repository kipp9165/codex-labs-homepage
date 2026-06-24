import { httpJson } from "./api_helpers.js";

function headers(token) {
  return {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function fetchOpenIssueTitles({ token, repo }) {
  const titles = new Set();

  for (let page = 1; page <= 10; page += 1) {
    const issues = await httpJson(`https://api.github.com/repos/${repo}/issues?state=open&per_page=100&page=${page}`, {
      method: "GET",
      headers: headers(token),
      retries: 1,
    });

    if (!Array.isArray(issues) || issues.length === 0) {
      break;
    }

    for (const issue of issues) {
      if (issue && typeof issue.title === "string") {
        titles.add(issue.title);
      }
    }
  }

  return titles;
}

export async function createIssueWithDedupe({ token, repo, title, body, labels = [], openTitles }) {
  const titles = openTitles || new Set();
  if (titles.has(title)) {
    return false;
  }

  await httpJson(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ title, body, labels }),
    retries: 1,
  });

  titles.add(title);
  return true;
}
