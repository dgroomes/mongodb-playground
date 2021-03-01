// Find the number of zip areas per city. Sort in descending order starting with the cities with the most amount of zip
// areas.

let cursor = db.zips.aggregate([
  {
    $group: {
      _id: { city: "$city", state: "$state" },
      count: {$sum: 1}
    }
  },
  {
    $sort: {count: -1}
  }
])

// Remember, the non-interactive mode of the "mongo" shell (which is what we run when we run script files like this file)
// will return a "cursor" variable that points to the data returned by the query. This cursor does not contain the data itself.
// Instead, we have to iterate through the data by calling the "next" method. The below statement prints the first few
// elements of the result data.
for (let i = 0; cursor.hasNext() && i < 3; i++) {
  let page = cursor.next()
  printjson(page)
}
