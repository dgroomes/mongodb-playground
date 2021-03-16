// Like "zips-averages-benchmark.js" but for the incremental approach.

const {runWithDb} = require('./db')
const {refreshMaterializedView} = require('./zips')
const {benchmark} = require('./zips-benchmark')

runWithDb(db => {
  console.log("Benchmarking the incremental approach over multiple phases of loading the splits data...")
  const query = async function() {
    await refreshMaterializedView(db)
  }
  return benchmark(db, query)
})
