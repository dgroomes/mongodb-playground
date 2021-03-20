// Functions for computing data with the ZIP Code data.
// These functions are the **core** (read: the interesting parts!) of the project.

const {getAppMetaData, upsertAppMetaData} = require('./db')

/**
 * Set the "lastModified" field on records where it is not set.
 */
async function lastModified(db) {
  return await db.collection("zips").updateMany(
    {lastModified: {$exists: false}},
    [
      {$set: {lastModified: "$$NOW"}}
    ]
  )
}

/**
 * Refresh the non-incremental "by city" materialized view.
 */
function refreshAvgPopByCity(db) {
  return db.collection("zips").aggregate([
    {
      $group: {
        "_id": {city: "$city", state: "$state"},
        city_zip_areas: {$sum: 1},
        city_pop: {$sum: "$pop"}
      }
    },
    {
      $addFields: {
        avg_zip_area_pop: {
          $trunc: {
            $divide: ["$city_pop", "$city_zip_areas"]
          }
        }
      }
    },
    {$out: "zips_avg_pop_by_city"}
  ]).next()
}

/**
 * Refresh the non-incremental "by state" materialized view.
 */
function refreshAvgPopByState(db) {
  return db.collection("zips").aggregate([
    {
      $group: {
        "_id": "$state",
        state_zip_areas: {$sum: 1},
        state_pop: {$sum: "$pop"}
      }
    },
    {
      $addFields: {
        avg_zip_area_pop: {
          $trunc: {
            $divide: ["$state_pop", "$state_zip_areas"]
          }
        }
      }
    },
    {$out: "zips_avg_pop_by_state"}
  ]).next()
}

/**
 * Refresh the non-incremental materialized views.
 */
async function refreshAll(db) {
  await refreshAvgPopByCity(db)
  await refreshAvgPopByState(db)
}

/**
 * Adorn the aggregation pipeline with a "$match" stage to match only documents that have recently been modified and
 * need to be processed. The purpose of this check is to filter out documents that have already been incorporated into
 * the "$into" collection. This check is a core part of an incremental update strategy.
 * @param db
 * @param incorporatePipeline
 * @return {Promise<void>}
 */
async function matchUnprocessed(db, incorporatePipeline) {
  const appMetaData = await getAppMetaData(db)
  const lastLoadedTime = appMetaData.last_loaded_time
  if (lastLoadedTime === undefined) {
    // The 'last loaded time' is undefined. This must be the first execution of the load.
  } else {
    incorporatePipeline.unshift({
      $match: {
        "lastModified": {
          $gt: lastLoadedTime
        }
      }
    })
  }
}

/**
 * Incorporate new ZIP records incrementally into the "zips_grouped_by_city" aggregation.
 *
 * This is the basis of the "incremental load" aggregation pipeline to incorporate new ZIP records into the collection of
 * ZIP areas grouped by city.
 *
 * For the very first execution of the load, all records are new. For all subsequent executions of the load, new records
 * are identified as those that have a "lastModified" date greater than the last load time. These records
 * have not been incorporated yet into the aggregations.
 *
 * Importantly, this operation is idempotent. Any records that have already been incorporated will be discarded because
 * a "set" data structure is used to group the ZIP area records together. Specifically, the "addToSet" operation is used.
 */
async function incorporateNewZips(db) {
  // Preparation step. Set the "lastModified" field on records where it is not set.
  await lastModified(db)

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

  await matchUnprocessed(db, incorporatePipeline);

  return await db.collection("zips").aggregate(incorporatePipeline).next()
}

/**
 * Refresh the incremental materialized views.
 */
async function refreshAllInc(db) {
  await incorporateNewZips(db)

  // Compute the "by city" ZIP area population averages.
  await refreshAvgPopByCityInc(db)

  // Now, we are moving on to computing the "by state" averages. Similar to the "by city" average, we will first perform
  // the useful pre-work of grouping the data set by state.
  await refreshGroupedByState(db)

  // Compute the "by state" ZIP area population averages.
  await refreshAvgPopByStateInc(db)

  // Commit the completed work by updating the "last loaded time" application meta data field.
  await upsertAppMetaData(db, {last_loaded_time: "$$NOW"})
}

/**
 * Incrementally refresh the "by city" materialized view.
 * @param db the database to use
 * @return {Promise<void>}
 */
async function refreshAvgPopByCityInc(db) {
  const incorporatePipeline = [
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
    {
      $merge: {
        into: "zips_avg_pop_by_city_inc"
      }
    }
  ]

  await matchUnprocessed(db, incorporatePipeline)

  return await db.collection("zips_grouped_by_city").aggregate(incorporatePipeline).next()
}

/**
 * Refresh the intermediate "zips_grouped_by_state" collection
 *
 * @param db the database to use
 * @return {Promise<*>}
 */
async function refreshGroupedByState(db) {
  return await db.collection("zips_avg_pop_by_city_inc").aggregate([
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
}

/**
 * Refresh the incremental "by state" materialized view.
 * @param db
 * @return {Promise<void>}
 */
async function refreshAvgPopByStateInc(db) {
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
    {$out: "zips_avg_pop_by_state_inc"}
  ]).next()
}

module.exports = {
  refreshAll,
  refreshAllInc
}
