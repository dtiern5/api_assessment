const express = require("express");
const https = require("https");
const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;
const url = "https://api.hatchways.io/assessment/blog/posts";

app.get("/", (_, res) => {
  res.send("Server is running");
});

app.get("/api/ping", (_, res) => {
  res.send({ success: true });
});

app.get("/api/posts", (req, res) => {
  let tags = [];

  // Query string can either be in tags=tag1,tag2 format
  // or tag=tag1&tag=tag2 format
  if (req.query.tag) {
    tags = getTags(req.query.tag);
  }
  if (req.query.tags) {
    tags = getTags(req.query.tags);
  }

  let { sortBy, direction } = req.query;
  let sortableFields = ["id", "reads", "likes", "popularity"];

  // Check for invalid parameters
  if (tags.length === 0) {
    res.status(400).send({ error: "Tags parameter is required" });
  }
  if (sortBy && !sortableFields.includes(sortBy)) {
    res.status(400).send({ error: "sortBy parameter is invalid" });
  }
  if (direction && direction !== "asc" && direction !== "desc") {
    res.status(400).send({ error: "direction parameter is invalid" });
  }

  // Set defaults for sortBy and direction if not given
  if (!sortBy) {
    sortBy = "id";
  }
  if (!direction) {
    direction = "asc";
  }

  // loop through tags, create promise for each, push to promises array
  let promises = [];
  for (let i = 0; i < tags.length; i++) {
    const queryUrl = url + "?tag=" + tags[i];
    promises.push(makeHTTPRequest(queryUrl));
  }

  // loop through each request, and each post in those requests
  // and push to finalData
  let finalData = [];
  Promise.all(promises).then((data) => {
    let numberOfTags = data.length;
    for (let i = 0; i < numberOfTags; i++) {
      let numberOfPosts = data[i].posts.length;
      for (let j = 0; j < numberOfPosts; j++) {
        finalData.push(data[i].posts[j]);
      }
    }
    finalData = removeDuplicates(finalData);

    // apply sort and sort direction
    finalData = dataSort(finalData, sortBy, direction);
    res.send({"posts": finalData});
  });
});

const getTags = (tagParam) => {
  let output = []
  // add single tag
  if (typeof tagParam == "string" && !tagParam.includes(",")) {
    output.push(tagParam);
  } else if (typeof tagParam == "string" && tagParam.includes(",")) {
    // multiple tags separated by ','
      let multipleTagArray = tagParam.split(",");
      multipleTagArray.forEach((t) => output.push(t));
  } else {
    // multiple tags separated by '&' as array
    tagParam.forEach((tag) => {
      output.push(tag);
    });
  }
  return output;
};

const dataSort = (data, sortBy, direction) => {
  if (direction === "desc") {
    data.sort((a, b) => {
      return b[sortBy] - a[sortBy];
    });
  } else {
    data.sort((a, b) => {
      return a[sortBy] - b[sortBy];
    });
  }

  return data;
};

const removeDuplicates = (posts) => {
  // sort by id
  posts.sort((a, b) => {
    return a.id - b.id;
  });

  // remove duplicates
  let response = [posts[0]];
  for (let i = 1; i < posts.length; i++) {
    if (posts[i].id !== posts[i - 1].id) {
      response.push(posts[i]);
    }
  }
  return response;
};

const makeHTTPRequest = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let stream = [];
      res
        .on("data", function (chunk) {
          stream.push(chunk);
        })
        .on("end", function () {
          let data = Buffer.concat(stream);

          data = JSON.parse(data);
          resolve(data);
        })
        .on("error", (err) => {
          console.error(`Error in response: ${err}`);
        });
    });
  });
};

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;