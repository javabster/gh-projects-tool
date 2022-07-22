const axios = require('axios')
const { getDaysBetween, delay } = require('./dateUtils')

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
        const res = await axios.get(`https://api.github.com/search/issues?q=label:%22${queryLabel}%22repo:${repo}%20state:open&per_page=100`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'token ' + process.env.GH_TOKEN,
              }
          })
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
            delay(3000)
            // Find the issue data from list of issues just added to the project
            const projectItem = addedIssues.filter(obj => {
                return obj.issueNum === issue.number
              })

              delay(2000)
            // Update the project field 
            if (projectItem.length === 1) {
                // get today's date
                const today = new Date()

                // get timeline info
                const timeline = await axios.get(issue.timeline_url, {
                    headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'token ' + process.env.GH_TOKEN,
                  }})

                // get last comment OR review data
                const last_comment_or_review = await timeline.data.reverse().find(item => {
                    return item.event === ("commented" || "reviewed")
                    }
                )
                delay(2000);
                // console.log(last_comment_or_review)
                if (last_comment_or_review !== undefined) {
                    // Do some date maths to get days since last comment/review
                    const days_last_comment_or_review = await getDaysBetween(last_comment_or_review.created_at, today)

                    // update project 'days since last comment/review' field
                    await updateProjectNumberField(projectId, projectItem[0].graphqlId, process.env.FIELD_ID_DAYS_LAST_COMMENT_OR_REVIEW, days_last_comment_or_review)
                    .then(res => console.log(`days since comment/review field updated for issue ${issue.number}`))
                    
                }
                delay(2000)
               
                // get last op commit info
                const last_op_commit = await timeline.data.reverse().find(item => {
                    const opName = timeline.data[0].event === 'committed' ? timeline.data[0].committer.name : timeline.data[0].actor.login
                    // NOTE! If OpName is a login username and NOT a name then following will only return false, bc login info is not available on the github commit data object
                    // for some reason the first event in the events url is sometimes as review request and not a commit so we can't match the OP commit name with the latest commit from OP
                    return (item.event === "committed") && (item.committer.name === opName)
                })

                delay(2000)
                if (last_op_commit !== undefined) {
                    // Do some date maths to get days since last op commit
                    const days_last_op_commit = await getDaysBetween(last_op_commit.committer.date, today)
                    // update project 'days since last op commit' field
                    await updateProjectNumberField(projectId, projectItem[0].graphqlId, process.env.FIELD_ID_DAYS_LAST_OP_COMMIT, days_last_op_commit)
                        .then(res => console.log(`days since op commit field updated for issue ${issue.number}`))
                }
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
 * This function updates a specified number field on a specified GitHub Project (Beta)
 * @param {*} projectId node id of GitHub project that have recently been added
 * @param {*} itemId graphql id of the issue previously added to project
 * @param {*} fieldId graphql id of the field in the GitHub project that will be updated
 * @param {*} value the number value that the field will be updated with
 */
   async function updateProjectDateField(projectId, itemId, fieldId, value) {
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
                    date: "${value}"     
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
