const axios = require('axios')
const { getDaysBetween } = require('./dateUtils')

/**
 * This function fetches open issues with a specific label from a given repo and adds them to a given GitHub project (beta)
 * LIMIT: max first 100 issues
 * @param {*} projectId node id of GitHub project to add issues to
 * @param {*} repo repo url to fetch issues from
 * @param {*} label label to filter issues by
 * @param {*} updateActivity boolean if true will update activity fields (days since last update)
 */
 async function addIssuesByLabel(projectId, repo, label, updateActivity=false) {
    try {
        // construct label query string
        const queryLabel = label.replace(/ /g,"%20")
        // get node ids for all good first issues
        const res = await axios.get(`https://api.github.com/search/issues?q=label:%22${queryLabel}%22repo:${repo}%20state:open&per_page=100`)
        // add issues to project, retrieve project id and issue number
        const addedIssues = await addIssuesToProject(projectId, res.data.items)

        if (updateActivity) {
            // update the 'Days since last updated' field 
            await updateActivityFields(projectId, res.data.items, addedIssues)
        }

    } catch(err) {
        console.error(err)
    }
 }

 /**
 * This function updates the 'days since last update' field on a specified GitHub Project (Beta)
 * @param {*} projectId node id of GitHub project that have recently been added
 * @param {*} issues array of issues from GitHub REST search api
 * @param {*} addedIssues array of issue objects that have recently been added to specifed project, containing the graphql id and issue number
 */
  async function updateActivityFields(projectId, issues, addedIssues) {
    try {
        for (issue of issues) {
            // Do some date maths to get days since last updated
            const today = new Date()
            const last_update = issue.updated_at
            const days_last_update = getDaysBetween(last_update, today)

            // Find the issue data from list of issues just added to the project
            const projectItem = addedIssues.filter(obj => {
                return obj.issueNum === issue.number
              })

            // Update the project field 
            if (projectItem.length === 1) {
                await updateProjectNumberField(projectId, projectItem[0].graphqlId, process.env.FIELD_ID_LAST_UPDATE, days_last_update)
                .then(res => console.log(`last update field updated for issue ${issue.number}`))
            }
            
        }
    } catch(err) {
        console.log(err)
    }
 }

  /**
 * This function updates a specified number field on a specified GitHub Project (Beta)
 * @param {*} projectId node id of GitHub project that have recently been added
 * @param {*} itemId graphql id of the issue previously added to project
 * @param {*} fieldId graphql id of the field in the GitHub project that will be updated
 * @param {*} value the number value that the field will be updated with
 */
async function updateProjectNumberField(projectId, itemId, fieldId, value) {
    try {
        // construct graphql query
        query = `
        mutation {
            updateProjectV2ItemFieldValue(
                input: {
                projectId: "${projectId}"
                itemId: "${itemId}"
                fieldId: "${fieldId}"
                value: { 
                    number: ${value}      
                }
                }
            ) {
                projectV2Item {
                id
                }
            }
        }`

        // make post request
        await githubGraphqlPost(query)
    } catch (err) {
        console.log(err)
    }
 }

 /**
 * This function adds issues to a specified GitHub project (beta)
 * @param {*} projectId node id of GitHub project to add issues to
 * @param {*} issues array of issues to be added
 */
async function addIssuesToProject(projectId, issues) {
    try {
        let addedIssueIds = []
        for (issue of issues) {
            // construct graphql query
            query=`
            mutation {
                addProjectV2ItemById(input: {projectId: "${projectId}" contentId: "${issue.node_id}"}) {
                item {
                    id
                }
                }
            }`

            // add issue to project
            const res = await githubGraphqlPost(query)
            // get date for issue just added
            addedIssueIds.push({'graphqlId': res.data.addProjectV2ItemById.item.id, 'issueNum': issue.number})
        }
        return addedIssueIds
    } catch(err) {
        console.log(err)
    }
 }

 /**
 * This function submits a post request to the GitHub graphql endpoint
 * @param {*} query the graphql query to be posted
 */
async function githubGraphqlPost(query) {
    const res = await axios.post(`https://api.github.com/graphql`,
    {
      query,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'token ' + process.env.GH_TOKEN,
      },
    }).then(res => {
        console.log(JSON.stringify(res.data))
        return res.data
    })
    .catch((error) => {
        console.error(error)
      })
    return res
}

module.exports = {
    addIssuesByLabel
}
