# gh-projects-tool
A lightweight node.js app for adding issues to GitHub Projects (beta)

## Overview

This repo contains a node.js app with a collection of utility functions for fetching GitHub issues and adding them to new GitHub Projects (beta). 

This node app currently has one script `npm run add-issues` that will fetch issues or PRs with the following labels:
* `good first issue`
* `help wanted`
* `Community PR`

Once issues with these tags have been fetched, they will be added to a user-specified GitHub Project (beta)

***NOTE: due to GitHub search API limits this currently only fetches a total of 100 issues per label. Further work may be done to get around this at a later date.***

### Run Locally

1. Clone this repo
2. Install dependencies (run `npm install` in project directory in your terminal)
3. Add a `.env` file in the root of your project directory
4. In your `.env` file add the following:
    * `PROJECT_ID={node id of your github org level project}`
    * `REPO={the repo you want to pull issues/PRs from}` if you want to pull issues from a repo that is in an organisation you will need to use the structure `org/repo`
    * `GH_TOKEN={a github auth token with write permissions to the project you're trying to add to}`
6. From your terminal run `npm run add-issues`

### Nightly CRON Jobs
This repo also runs a nightly GitHub action to add issues/PRs from the Qiskit Terra to a GitHub Project (beta)
