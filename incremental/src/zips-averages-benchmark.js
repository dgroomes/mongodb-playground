// WORK IN PROGRESS
//
// Benchmark the "bare" average computation script, "zips-averages.js", over multiple phases of loading "splits" of data and
// computing the average for each split.
//
// The effect of benchmarking the "bare" average computation is that it serves as a working baseline to compare the
// incrementally updating materialized view script "zips-average-incremental.js". While the bare average script does not
// actually persist its result into a materialized view, it still executes the query that we would execute if we had a
// "full computation materialized refresh" script. For this project, we're not interested in benchmarking queries to the
// materialized view itself because we already now that would be fast! Instead, we are trying to analyze the refresh process
// and specifically compare an incremental-style refresh (zips-averages-incremental.js) with a non-incremental refresh (basically zips-averages.js).

const {runWithDb} = require('./db')
const {avgByCity, avgByState} = require('./zips')
const {benchmark} = require('./zips-benchmark')

runWithDb(db => {
  console.log("Benchmarking the 'bare' averages script over multiple phases of loading the splits data...")
  const query = async function() {
    await avgByCity(db).next()
    await avgByState(db).next()
  }
  return benchmark(db, query)
})
