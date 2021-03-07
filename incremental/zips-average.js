let {lastModified, runWithDb, upsertAppMetaData, printAFewRecords} = require('./functions')

// Compute multiple averages across the ZIP code data. Features of this include:
//
//   * Average population of the ZIP areas for each city. The result set should be saved to another collection
//     so that it can be quickly queried later without recomputing the averages.
//   * Average population of the ZIP areas for each state. This should be implemented by picking up from
//     where the "Average population of the ZIP areas for each city" computation left off. Specifically, it should start
//     with the collection that was created with the result set.

// Preparation steps:
// Initialize an application meta data collection. It should only ever contain exactly one document. We will use it to store
// custom meta data like the "last loaded time" and "last invocation time for the zip-averages.js script".
runWithDb(async db => {
  await upsertAppMetaData(db,{last_invocation_time_zip_averages: "$$NOW"})

  await lastModified(db)

  // Average ZIP area population by city
  // First, create the "grouped by city" collection which should later be helpful for de-duplication (for supporting idempotency).
  const zips = db.collection("zips");
  await zips.aggregate([
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
  ]).next()

  // Next, compute the average.
  await db.collection("zips_grouped_by_city").aggregate([
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
  ]).next()

  let cursorAvgByCity = await db.collection("zips_avg_pop_by_city").find().sort({city_pop: -1})
  console.log("Average population of the ZIP areas for each city")
  await printAFewRecords(cursorAvgByCity)

  // Next, group the city-aggregated ZIP area summaries by state into a new collection. Why? Well, I think it will be useful
  // de-duplication.
  await db.collection("zips_avg_pop_by_city").aggregate([
    {
      "$group": {
        _id: "$_id.state",
        city_aggregated_zip_area_summaries: {
          $addToSet: "$$CURRENT"
        }
      }
    },
    {$out: "zips_grouped_by_state"}
  ]).next()

  // Compute state-level ZIP area averages
  await db.collection("zips_grouped_by_state").aggregate([
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
  ]).next()

  let cursorAvgByState = await db.collection("zips_avg_pop_by_state").find().sort({state_pop: -1})

  console.log("Average population of the ZIP areas for each state")
  await printAFewRecords(cursorAvgByState)

  // Update the "last loaded time" so that future incremental loads know to skip input documents older than this time.
  // This creates a race condition if ingestion was happening concurrently to the execution of the above averaging operations
  // but for a prototype it's fine. And in fact, we do not have concurrent work.
  await upsertAppMetaData(db, {last_loaded_time: "$$NOW"})
})
