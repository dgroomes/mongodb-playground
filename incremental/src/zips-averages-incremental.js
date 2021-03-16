// Compute multiple averages across the ZIP Code data. "Averaging" computations include:
//   * Average population of the ZIP areas for each *city*.
//   * Average population of the ZIP areas for each *state*.
//
// The averages data is computed using materialized views which can be incrementally updated as new raw input data arrives.

const {runWithDb, upsertAppMetaData} = require('./db')
const {
  incorporateNewZips,
  refreshAvgPopByCityAggregation,
  refreshGroupedByStateAggregation,
  refreshAvgPopByStateAggregation,
} = require('./zips')
const {sampleAvgPopByCityAggregation, sampleAvgPopByStateAggregation} = require('./zips-sample')


runWithDb(async db => {

  await incorporateNewZips(db)

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
