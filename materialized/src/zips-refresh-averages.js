// Compute multiple averages across the ZIP Code data. "Averaging" computations include:
//
//   * Average population of the ZIP areas for each *city*. The result set should be saved to another collection
//     so that it can be quickly queried later without recomputing the averages.
//   * Average population of the ZIP areas for each *state*. This should be implemented by picking up from
//     where the "Average population of the ZIP areas for each city" computation left off. Specifically, it should start
//     with the collection that was created with the result set.
//
// The output of the averages computations are stored in their own collections. These are so-called "materialized views".

const {runWithDb, upsertAppMetaData} = require('./db')
const {
  lastModified,
  refreshAvgPopByCityAggregation,
  refreshGroupedByStateAggregation,
  refreshAvgPopByStateAggregation,
} = require('./zips')
const {sampleAvgPopByCityAggregation, sampleAvgPopByStateAggregation} = require('./zips-sample')

runWithDb(async db => {

  // Preparation step. Set the "lastModified" field on records where it is not set.
  await lastModified(db)

  // The first step in our journey to find the average ZIP area population "by city" is to create a "grouped by city"
  // collection. This is useful pre-work which will make the averaging computation simple and this grouping should help us
  // later when we need to de-duplicate "already-incorporated" ZIP area documents.
  //
  // Importantly, this operation is idempotent. Any records that have already been incorporated will be discarded because
  // a "set" data structure is used to group the ZIP area records together. Specifically, the "addToSet" operation is used.
  await db.collection("zips").aggregate([
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

  // Compute the "by city" ZIP area population averages.
  await refreshAvgPopByCityAggregation(db)
  await sampleAvgPopByCityAggregation(db)

  // Now, we are moving on to computing the "by state" averages. Similar to the "by city" average, we will first perform
  // the useful pre-work of grouping the data set by state.
  await refreshGroupedByStateAggregation(db)

  // Compute the "by state" ZIP area population averages.
  await refreshAvgPopByStateAggregation(db)
  await sampleAvgPopByStateAggregation(db)

  // Commit the completed work by updating the "last loaded time" application meta data field.
  // Update the "last loaded time" so that future incremental loads know to skip input documents older than this time.
  // This creates a race condition if ingestion was happening concurrently to the execution of the above averaging operations
  // but for a prototype it's fine. And in fact, we do not have concurrent work.
  await upsertAppMetaData(db, {last_loaded_time: "$$NOW"})
})
