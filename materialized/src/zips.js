// Functions for computing data with the ZIP Code data.
// These functions are the **core** (read: the interesting parts!) of the project.

const {printAFewRecords} = require("./db")

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
  lastModified,
  refreshAvgPopByCityAggregation,
  refreshGroupedByStateAggregation,
  refreshAvgPopByStateAggregation,
}
