let {lastModified, runWithDb, printAFewRecords} = require('./functions')

// This is a companion script to "zips-average.js". It does an incremental load of ZIP areas data and incrementally computes
// the averages data.

runWithDb(async db => {
  // Preparation step. Set the "lastModified" field on records where it is not set.
  await lastModified(db)

  const lastLoadedTime = (await db.collection("app_meta_data").findOne()).last_loaded_time
  console.log(`Last loaded time: ${lastLoadedTime}`)

  // Incorporate the new ZIP records into the collection of ZIP areas grouped by city.
  await db.collection("zips").aggregate(
    [
      {
        $match: {
          "lastModified": {
            $gt: lastLoadedTime
          }
        }
      },
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
  ).next()

  // Commit completed work using "last loaded time" field.
  await db.collection("app_meta_data").updateOne({_id: 1}, [{$set: {last_loaded_time: "$$NOW"}}], {upsert: true})

  // COPIED FROM zip-average.js
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
})
