// Compute the average population of ZIP areas per state

let cursor = db.zips.aggregate([
  {
    $group: {
      "_id": "$state",
      zip_areas: {$sum: 1},
      total_pop: {$sum: "$pop"}
    }
  },
  {
    $project: {
      avg_zip_area_pop: {
        $trunc: {
          $divide: ["$total_pop", "$zip_areas"]
        }
      }
    }
  }
])

print("Average population of ZIP areas by state:\n\n")
while (cursor.hasNext()) {
  printjson(cursor.next())
}
