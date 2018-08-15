// Declaring a few resources
const discourse = require("./discourse.json");
const creds = require("./jira_credentials.json");
const request = require('request-promise');

// Declaring variables for later
var title, description, label, topic_views_count, priority;

// Async function so we can use the async-await pattern
// Otherwise, the rest of the script would run before the response came back
async function main() {
  for(var i = 0; i < discourse.length; i++) {
    article = discourse[i];
    title = article["topics.title"];
    safe_title = title
      .replace(/([-+.,;?!:|*/%^$#@\[\]\(\){}])/g, "\\\\$1")
      .replace(/"/g, "'");

    // Check to see if the article we are adding already exists
    var issues = await request.get('https://looker.atlassian.net/rest/api/2/search', {
        'auth': {
          'user': creds.user,
          'pass': creds.pass
        },
        'qs': {
          'jql': `project = "HC" AND summary ~ "${safe_title}"`
        },
        'json': true
      });

    // Check if there are any issues that come back in the search
    if(issues.issues.length > 0) {
      // Skip if duplicate
      console.log("skipping article " + i);
      continue;
    } else {
      // Otherwise continue to issue creation
      console.log("processing article " + i);
    }

    topic_id = article["topic_id"];
    priority = '3';
    labels = [];

    // If the article is a release note, set priority to 4 and add a label
    if(article["categories.name"] == "Release") {
      labels = ["release-notes"];
      priority = '4';
    }

    // If the article is a bloc, set priority to 4 and add a label
    if(article["categories.name"] == "Blocks") {
      labels = ["block"];
      priority = '4';
    }

    // Build the markdown link for the issue description
    description = "[Discourse](https://discourse.looker.com/t/" + topic_id + ")"

    // Create issue
    request.post('https://looker.atlassian.net/rest/api/2/issue', {
      'auth': {
        'user': creds.user,
        'pass': creds.pass
      },
      'body': {
        "fields": {
          "project": {
            "key": "HC"
          },
         "summary": title,
         "description": description,
         "issuetype": {
            "id": "10002"
         },
         "priority": {
           "id": priority
         }
       }
     },
     'json': true
   });

  console.log("Article " + i + " completed");
  }
}

// Run the encapsulated script
main();
