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
//
// 1) Load split #1 of the data
// 2) Compute the averages
// 3) Repeat the previous two steps until all splits are loaded
// 4) Print timing results of the splits as a table (console.table)

const {runWithDb} = require('./db')
const {avgByCity, avgByState} = require('./zips')
const {lines} = require("./util")

async function benchmark(db) {
  const zipAreas = lines("zips.json")
  const zips = db.collection("zips");

  let idx = 0
  const LIMIT = 5 // artificially limit the input file just for fast iterative development
  const SPLIT_SIZE = 2
  let zipAreasBuffer = []
  for await (const zipArea of zipAreas) {
    idx++
    zipAreasBuffer.push(JSON.parse(zipArea))

    if (idx % 2 === 0) {
      console.log(`Chomped off a split at idx=${idx}. Inserting the data.`)
      await zips.insertMany(zipAreasBuffer)

      console.log(`${Date.now()}: Executing averages...`)
      await avgByCity(db).next()
      await avgByState(db).next()
      console.log(`${Date.now()}: Done.`)

      // Clear the buffer
      zipAreasBuffer = []
    }

    if (idx === LIMIT) {
      break
    }
  }

  console.log("All ZIP areas loaded!")
}

runWithDb(benchmark)
