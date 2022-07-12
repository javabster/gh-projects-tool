const { addIssuesByLabel } = require('./utils/githubUtils')
require('dotenv').config();

const projectId = process.env.PROJECT_ID
const repo = process.env.REPO
const labels = JSON.parse(process.env.LABELS)
const update_field_bools = ("UPDATE_FIELD_BOOLS" in process.env) ? JSON.parse(process.env.UPDATE_FIELD_BOOLS) : null

try {
  // add issues for each label in label list
  for (let [idx, label] of labels.entries()) {
    if (update_field_bools != null) {
      // add issues to project AND update updateable fields
      addIssuesByLabel(projectId, repo, label, update_field_bools[idx])
    } else {
      //  just add issues
      addIssuesByLabel(projectId, repo, label)
    }
  }
} catch(err) {
  console.error(err)
  // TODO better error handling
}