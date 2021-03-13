// Compute multiple averages across the ZIP Code data. "Averaging" computations include:
//   * Average population of the ZIP areas for each *city*.
//   * Average population of the ZIP areas for each *state*.
//
// The averages data is computed using materialized views which can be incrementally updated as new raw input data arrives.

const {runWithDb, upsertAppMetaData, getAppMetaData, printAFewRecords} = require('./db')
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

  // This is the basis of the "incremental load" aggregation pipeline to incorporate new ZIP records into the collection of
  // ZIP areas grouped by city.
  //
  // For the very first execution of the load, all records are new. For all subsequent executions of the load, new records
  // are identified as those that have a "lastModified" date greater than the last load time. These records
  // have not been incorporated yet into the aggregations.
  //
  // Importantly, this operation is idempotent. Any records that have already been incorporated will be discarded because
  // a "set" data structure is used to group the ZIP area records together. Specifically, the "addToSet" operation is used.
  const incorporatePipeline = [
    {
      $group: {
        "_id": {city: "$city", state: "$state"},
        zip_areas: {
          $addToSet: "$$CURRENT"
        }
      }
    },
    {
      "$set": {
        lastModified: "$$NOW"
      }
    },
    {
      $merge: {
        into: "zips_grouped_by_city",
        whenMatched: [
          {
            $set: {
              zip_areas: {
                $setUnion: ["$zip_areas", "$$new.zip_areas"]
              },
              lastModified: "$$new.lastModified"
            }
          }
        ]
      }
    }
  ]

  const appMetaData = await getAppMetaData(db)
  const lastLoadedTime = appMetaData.last_loaded_time
  if (lastLoadedTime === undefined) {
    console.log("The 'last loaded time' is undefined. This must be the first execution of the load.")
  } else {
    console.log(`The 'last loaded time' was ${lastLoadedTime}`)
    incorporatePipeline.unshift({
      $match: {
        "lastModified": {
          $gt: lastLoadedTime
        }
      }
    })
  }

  await db.collection("zips").aggregate(incorporatePipeline).next()


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
  await upsertAppMetaData(db, {last_loaded_time: "$$NOW"})
})
