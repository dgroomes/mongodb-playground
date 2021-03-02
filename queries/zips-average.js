// Compute multiple averages across the ZIP code data. Features of this include:
//
//   * Average population of the ZIP areas for each city. The result set should be saved to another collection
//     so that it can be quickly queried later without recomputing the averages.
//   * Average population of the ZIP areas for each state. This should be implemented by picking up from
//     where the "Average population of the ZIP areas for each city" computation left off. Specifically, it should start
//     with the collection that was created with the result set.

// Average ZIP area population by city
db.zips.aggregate([
  {
    $group: {
      "_id": {city: "$city", state: "$state"},
      city_zip_areas: {$sum: 1},
      city_population: {$sum: "$pop"}
    }
  },
  {
    $set: {
      avg_zip_pop_by_city: {
        "$divide": ["$city_population", "$city_zip_areas"]
      }
    }
  },
  {$sort: {city_zip_areas: -1}},
  {$out: "zips_avg_pop_by_city"}
])

let cursorAvgByCity = db.zips_avg_pop_by_city.find()

function printAFewRecords(cursor) {
  for (let i = 0; cursor.hasNext() && i < 3; i++) {
    printjson(cursor.next())
  }
  print()
}

print("Average population of the ZIP areas for each city")
printAFewRecords(cursorAvgByCity)

// Work In Progress
// Average ZIP area population by state
db.zips_avg_pop_by_city.aggregate([
  {
    "$group": {
      _id: "$_id.state",
      state_zip_areas: {$sum: "$city_zip_areas"},
      state_population: {$sum: "$city_population"}
    }
  },
  {
    $set: {
      avg_zip_pop_by_state: {
        $divide: ["$state_population", "$state_zip_areas"]
      }
    }
  },
  {
    $sort: {
      state_zip_areas: -1
    }
  },
  {$out: "zips_avg_pop_by_state"}
])

let cursorAvgByState = db.zips_avg_pop_by_state.find()

print("Average population of the ZIP areas for each state")
printAFewRecords(cursorAvgByState)


