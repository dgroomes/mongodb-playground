// This is a companion script to "zips-average.js". It does an incremental load of ZIP areas data and incrementally
// computes the averages data.

const {runWithDb, upsertAppMetaData, getAppMetaData, printAFewRecords} = require('./db')
const {
  lastModified,
  refreshAvgPopByCityAggregation,
  sampleAvgPopByCityAggregation,
  refreshGroupedByStateAggregation,
  refreshAvgPopByStateAggregation,
  sampleAvgPopByStateAggregation
} = require('./zips')


runWithDb(async db => {

  // Preparation step. Set the "lastModified" field on records where it is not set.
  await lastModified(db)

  const {last_loaded_time: lastLoadedTime} = await getAppMetaData(db)
  console.log(`Last loaded time: ${lastLoadedTime}`)

  // Incorporate the new ZIP records into the collection of ZIP areas grouped by city.
  // The new records are identified as those that have a "lastModified" date greater than the last load time. These records
  // have not been incorporated yet into the aggregations.
  //
  // Importantly, this operation is idempotent. Any records that have already been incorporated will be discarded because
  // a "set" data structure is used to group the ZIP area records together. Specifically, the "addToSet" operation is used.
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
