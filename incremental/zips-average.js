const {runWithDb, upsertAppMetaData, printAFewRecords} = require('./db')
const {
  lastModified,
  refreshAvgPopByCityAggregation,
  sampleAvgPopByCityAggregation,
  refreshGroupedByStateAggregation,
  refreshAvgPopByStateAggregation,
  sampleAvgPopByStateAggregation
} = require('./zips')

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
  await upsertAppMetaData(db, {last_invocation_time_zip_averages: "$$NOW"})

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
  await refreshAvgPopByCityAggregation(db)
  await sampleAvgPopByCityAggregation(db)

  // Next, group the city-aggregated ZIP area summaries by state into a new collection. Why? Well, I think it will be useful
  // de-duplication.
  await refreshGroupedByStateAggregation(db)

  // Compute state-level ZIP area averages
  await refreshAvgPopByStateAggregation(db)
  await sampleAvgPopByStateAggregation(db)

  // Update the "last loaded time" so that future incremental loads know to skip input documents older than this time.
  // This creates a race condition if ingestion was happening concurrently to the execution of the above averaging operations
  // but for a prototype it's fine. And in fact, we do not have concurrent work.
  await upsertAppMetaData(db, {last_loaded_time: "$$NOW"})
})
