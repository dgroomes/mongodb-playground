// Query the ZIP Code "averages" data that are stored in materialized views.
//
// This is a companion script to "zips-refresh-averages.js" which is the script that actually computes the materialized views
// in the first place. Querying the "averages" data from a materialized view is faster than computing it from the backing
// source data

const {runWithDb} = require('./db')
const {sampleAvgPopByCityInc, sampleAvgPopByStateInc} = require('./zips-sample')

runWithDb(async db => {

  await sampleAvgPopByCityInc(db)
  await sampleAvgPopByStateInc(db)
})
