// Compute multiple averages across the ZIP code data. Features of this include:
//
//   * Average population of the ZIP areas for each city. The result set should be saved to another collection
//     so that it can be quickly queried later without recomputing the averages.
//   * Average population of the ZIP areas for each state. This should be implemented by picking up from
//     where the "Average population of the ZIP areas for each city" computation left off. Specifically, it should start
//     with the collection that was created with the result set.

// Average ZIP area population by city
// First, create the "grouped by city" collection which should later be helpful for de-duplication (for supporting idempotency).
db.zips.aggregate([
  {
    $group: {
      "_id": {city: "$city", state: "$state"},
      zip_areas: {
        $addToSet: "$$CURRENT"
      }
    }
  },
  {
    $set: {
      lastModified: "$$NOW"
    }
  },
  {$out: "zips_grouped_by_city"}
])

// Next, compute the average.
db.zips_grouped_by_city.aggregate([
  {
    $project: {
      city_zip_areas: {$size: "$zip_areas"},
      city_pop: {$sum: "$zip_areas.pop"},
    }
  },
  {
    $addFields: {
      avg_zip_area_pop_across_city: {
        $trunc: {
          $divide: ["$city_pop", "$city_zip_areas"]
        }
      }
    }
  },
  {$out: "zips_avg_pop_by_city"}
])

let cursorAvgByCity = db.zips_avg_pop_by_city.find().sort({ city_pop: -1 })

function printAFewRecords(cursor) {
  for (let i = 0; cursor.hasNext() && i < 3; i++) {
    printjson(cursor.next())
  }
  print()
}

print("Average population of the ZIP areas for each city")
printAFewRecords(cursorAvgByCity)

// Next, group the city-aggregated ZIP area summaries by state into a new collection. Why? Well, I think it will be useful
// de-duplication.
db.zips_avg_pop_by_city.aggregate([
  {
    "$group": {
      _id: "$_id.state",
      city_aggregated_zip_area_summaries: {
        $addToSet: "$$CURRENT"
      }
    }
  },
  {$out: "zips_grouped_by_state"}
])

// Compute state-level ZIP area averages
db.zips_grouped_by_state.aggregate([
  {
    "$project": {
      _id: "$_id",
      state_zip_areas: {$sum: "$city_aggregated_zip_area_summaries.city_zip_areas"},
      state_pop: {$sum: "$city_aggregated_zip_area_summaries.city_pop"}
    }
  },
  {
    $addFields: {
      avg_zip_area_pop_across_state: {
        $trunc: {
          $divide: ["$state_pop", "$state_zip_areas"]
        }
      }
    }
  },
  {$out: "zips_avg_pop_by_state"}
])

let cursorAvgByState = db.zips_avg_pop_by_state.find().sort({ state_pop: -1 })

print("Average population of the ZIP areas for each state")
printAFewRecords(cursorAvgByState)


