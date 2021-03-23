// Functions for executing a benchmark against the "zips" collection

const {lines} = require("./util")
const readline = require("readline")

/**
 * Benchmark a query on the ZIP Code data over multiple phases of loading the splits data.
 * Prints the progress in a self-erasing line on the terminal. Then after it finishes, prints the results.
 * @param db
 * @param query
 * @return {Promise<void>}
 */
async function benchmark(db, query) {
  const SPLIT_SIZE = 1000
  const timings = []
  const zipAreas = lines("zips.json")
  const zips = db.collection("zips");
  const stream = process.stdout

  let docIdx = 0
  let splitIdx = 1
  let zipAreasBuffer = []

  // Insert the split data. This function declaration is unusual. I need to declare the insert code in a function because
  // I need to be able to call it from inside the loop while and after the loop is done. So because I need to call the code
  // twice, I need a function. Also I want the closures over "splitIdx" and "zipAreasBuffer" which is why I didn't declare
  // this function at the top-level, where I would need to pass them as params instead of referencing them as closures.
  async function insertSplit() {
    readline.clearLine(stream, 0)
    readline.cursorTo(stream, 0)
    stream.write(`Executing split ${splitIdx}`)

    await zips.insertMany(zipAreasBuffer)

    const start = Date.now();
    await query()
    const end = Date.now();
    const duration = end - start

    readline.cursorTo(stream,0)
    stream.write("")

    // Record the timing results and clear the buffer
    timings.push({ split: splitIdx, duration:  duration})
    zipAreasBuffer = []
  }

  for await (const zipArea of zipAreas) {
    docIdx++
    zipAreasBuffer.push(JSON.parse(zipArea))

    if (docIdx % SPLIT_SIZE === 0) {
      await insertSplit()
      splitIdx++
    }
  }
  // Insert the remainder. This split will always be the shortest one.
  await insertSplit()

  console.log("Benchmark complete. Execution timings for each phase:")
  console.table(timings)
}

module.exports = {
  benchmark
}
