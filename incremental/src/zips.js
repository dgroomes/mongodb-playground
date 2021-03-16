// Functions for computing data with the ZIP Code data.
// These functions are the **core** (read: the interesting parts!) of the project.

const {getAppMetaData} = require('./db')

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
 * Compute the "by city" average: average ZIP area population by city in descending order.
 * @param db
 * @return promise
 */
function avgByCity(db) {
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
    {
      $sort: {
        city_pop: -1
      }
    }
  ])
}

/**
 * Compute the "by state" average: average ZIP area population by state in descending order.
 * @param db
 * @return promise
 */

function avgByState(db) {
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
    {
      $sort: {
        state_pop: -1
      }
    }
  ])
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

  return await db.collection("zips").aggregate(incorporatePipeline).next()
}

/**
 * Refresh the "zips_avg_pop_by_city" aggregation collection
 * @param db the database to use
 * @return {Promise<void>}
 */
async function refreshAvgPopByCityAggregation(db) {
  return await db.collection("zips_grouped_by_city").aggregate([
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
}

/**
 * Refresh the "zips_grouped_by_state" collection
 *
 * @param db the database to use
 * @return {Promise<*>}
 */
async function refreshGroupedByStateAggregation(db) {
  return await db.collection("zips_avg_pop_by_city").aggregate([
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
 * Refresh the "zips_avg_pop_by_state" collection
 * @param db
 * @return {Promise<void>}
 */
async function refreshAvgPopByStateAggregation(db) {
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
}

module.exports = {
  avgByCity,
  avgByState,
  incorporateNewZips,
  refreshAvgPopByCityAggregation,
  refreshGroupedByStateAggregation,
  refreshAvgPopByStateAggregation,
}
