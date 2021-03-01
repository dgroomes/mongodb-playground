// IN PROGRESS
// Compute multiple averages across the Zip code data. Features of this include:
//
//   * Average population of the Zip areas for each city. The result set should be saved to another collection
//     so that it can be quickly queried later without recomputing the averages.
//   * Average population of the Zip areas for each state. This should be implemented by picking up from
//     where the "Average population of the Zip areas for each city" computation left off. Specifically, it should start
//     with the collection that was created with the result set.
//   * (NOT IMPLEMENTED) Incremental updates for "Average population of the Zip areas for each city" when new Zip areas
//     are added
//   * (NOT IMPLEMENTED) Incremental updates for "Average population of the Zip areas for each city" when new Zip area
//     data points are added. The new Zip area data means that the old data point should completely replaced. For example,
//     the population for Zip code 01001 (Agawam, MA) was 15,338 but at a later date increased to 15,776. Why is this
//     interesting? Well, the existing map-reduce and "aggregation pipeline" examples I've seen are only additive, they don't
//     actually replace old data. So, I think this will be an interesting example to see how it can actually be implemented.
//     Will it require an awkward implementation? Note: this could be considered a de-duplication example because we have
//     to de-duplicate the two data points for 01001: we have to toss the old population data and use the new data.

// Average Zip area population by city
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

print("Average population of the Zip areas for each city")
printAFewRecords(cursorAvgByCity)

// Work In Progress
// Average Zip area population by state
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

print("Average population of the Zip areas for each state")
printAFewRecords(cursorAvgByState)


