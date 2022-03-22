# Time Sync

Firebase Cloud Functions to synchronize time entered though [Clockify](https://clockify.me/) into [Activecollab](https://activecollab.com/)

Base URL

`http://localhost:5001/time-sync-a450f/us-central1/hooks`
`https://d631-163-172-228-113.ngrok.io/time-sync-a450f/us-central1/hooks`

`https://us-central1-time-sync-a450f.cloudfunctions.net/hooks/jira/project/${project.id}/issue/${issue.id}/worklog/${worklog.id}`
`https://us-central1-time-sync-a450f.cloudfunctions.net/hooks/jira/project/${project.id}/issue/${issue.id}`

`https://d631-163-172-228-113.ngrok.io/time-sync-a450f/us-central1/hooks/jira/automation/worklog`

`https://d631-163-172-228-113.ngrok.io/time-sync-a450f/us-central1/hooks/jira/automation/issue`

https://support.atlassian.com/cloud-automation/docs/jira-smart-values-issues/

firebase functions:config:set jira.automation.api_key=""
