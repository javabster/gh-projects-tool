const axios = require('axios')

/**
 * This function fetches open issues with a specific label from a given repo and adds them to a given GitHub project (beta)
 * LIMIT: max first 100 issues
 * @param {*} projectId node id of GitHub project to add issues to
 * @param {*} repo repo url to fetch issues from
 * @param {*} label label to filter issues by
 */
 async function addIssuesByLabel(projectId, repo, label) {
    try {
        // construct label query string
        const queryLabel = label.replace(/ /g,"%20")
        // get node ids for all good first issues
        const res = await axios.get(`https://api.github.com/search/issues?q=label:%22${queryLabel}%22repo:${repo}%20state:open&per_page=100`)
        // add issues to project
        await addIssuesToProject(projectId, res.data.items)

    } catch(err) {
        console.error(err)
    }
 }

 /**
 * This function adds issues to a specified GitHub project (beta)
 * @param {*} projectId node id of GitHub project to add issues to
 * @param {*} issues array of issues to be added
 */
async function addIssuesToProject(projectId, issues) {
    try {
        for (issue of issues) {
            // TODO: check if issue already in project

            // construct graphql query
            query = `
            mutation {
                addProjectNextItem(input: {projectId: "${projectId}" contentId: "${issue.node_id}"}) {
                    projectNextItem {
                        id
                    }
                }
            }`

            // add issue to project
            await githubGraphqlPost(query)
        }
    } catch(err) {
        console.log(err)
    }
 }

 /**
 * This function submits a post request to the GitHub graphql endpoint
 * @param {*} query the graphql query to be posted
 */
async function githubGraphqlPost(query) {
    await axios.post(`https://api.github.com/graphql`,
    {
      query,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'token ' + process.env.GH_TOKEN,
      },
    }).then(res => console.log(res.data))
    .catch((error) => {
        console.error(error)
      })
}

module.exports = {
    addIssuesByLabel
}
