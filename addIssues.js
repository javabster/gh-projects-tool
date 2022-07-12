const { addIssuesByLabel } = require('./utils/githubUtils')
require('dotenv').config();

const projectId = process.env.PROJECT_ID
const repo = process.env.REPO

try {
  addIssuesByLabel(projectId, repo, 'good first issue')
  addIssuesByLabel(projectId, repo, 'help wanted')
  addIssuesByLabel(projectId, repo, 'Community PR', true)
} catch(err) {
  console.error(err)
  // TODO better error handling
}