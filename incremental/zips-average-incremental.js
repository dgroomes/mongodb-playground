const {runWithDb, upsertAppMetaData, getAppMetaData, printAFewRecords} = require('./db')
const {
  lastModified,
  refreshAvgPopByCityAggregation,
  sampleAvgPopByCityAggregation,
  refreshGroupedByStateAggregation,
  refreshAvgPopByStateAggregation,
  sampleAvgPopByStateAggregation
} = require('./zips')

// This is a companion script to "zips-average.js". It does an incremental load of ZIP areas data and incrementally computes
// the averages data.

runWithDb(async db => {
  // Preparation step. Set the "lastModified" field on records where it is not set.
  await lastModified(db)

  const {last_loaded_time: lastLoadedTime} = await getAppMetaData(db)
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
  await upsertAppMetaData(db, {last_loaded_time: "$$NOW"})

  // Next, compute the average.
  await refreshAvgPopByCityAggregation(db)
  await sampleAvgPopByCityAggregation(db)

  // Next, group the city-aggregated ZIP area summaries by state into a new collection. Why? Well, I think it will be useful
  // de-duplication.
  await refreshGroupedByStateAggregation(db)

  // Compute state-level ZIP area averages
  await refreshAvgPopByStateAggregation(db)
  await sampleAvgPopByStateAggregation(db)
})
