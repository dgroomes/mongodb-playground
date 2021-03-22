// Functions for computing data with the ZIP Code data.
// These functions are the **core** (read: the interesting parts!) of the project.

/**
 * Refresh the "zips_avg_pop_by_city_inc" aggregation collection
 * @param db the database to use
 * @return {Promise<void>}
 */
async function refreshAvgPopByCityAggregation(db) {
  return await db.collection("zips").aggregate([
    {
      $group: {
        "_id": {city: "$city", state: "$state"},
        city_zip_areas: {$sum: 1},
        city_pop: {$sum: "$pop"},
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
    {$out: "zips_avg_pop_by_city_inc"}
  ]).next()
}

/**
 * Refresh the "zips_avg_pop_by_state_inc" collection
 * @param db
 * @return {Promise<void>}
 */
async function refreshAvgPopByStateAggregation(db) {
  await db.collection("zips_avg_pop_by_city_inc").aggregate([
    {
      "$group": {
        _id: "$_id.state",
        state_zip_areas: {$sum: "$city_zip_areas"},
        state_pop: {$sum: "$city_pop"}
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
    {$out: "zips_avg_pop_by_state_inc"}
  ]).next()
}

module.exports = {
  refreshAvgPopByCityAggregation,
  refreshAvgPopByStateAggregation,
}
