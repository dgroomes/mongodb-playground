// Miscellaneous queries to get a clear view into the collections data to help during debugging.
// The incremental approach is more complex than the non-incremental approach and I'm getting confused easily!

const {getAppMetaData, runWithDb} = require('./db')

/**
 * Print documents data across all collections. This is meant to be used in conjunction with the `doImportSpringfield1`
 * and `doImportSpringfield2` in "commands.sh". By loading importing a small subset of input data, then running the
 * incremental averages computations, and then inspecting the underlying collections, it should reveal enough to help you
 * debug a tricky data or Mongo query problem.
 *
 * I am especially thankful for the Web/NodeJS `console.table` function to print the documents in an easily readable table
 * format. It's easier to read tabular data with column headers compared to multiple lines of JSON that repeat the same
 * keys redundantly on each line.
 */
async function printAllData() {
  await runWithDb(async (db) => {
    const metaData = await getAppMetaData(db);
    console.log(`App meta data:\n${JSON.stringify(metaData)}\n`)
  })
  await findAndPrint("zips")
  await findAndPrint("zips_grouped_by_city")
  await findAndPrint("zips_avg_pop_by_city_inc")
  await findAndPrint("zips_grouped_by_state")
// TODO print state
}

/**
 * Execute a MongoDB query and print the results
 * @return {Promise<void>}
 */
async function findAndPrint(collectionName, query, options) {
  await runWithDb(async (db) => {
    let cursor = await db.collection(collectionName).find(query, options)

    // Print all records
    const found = []
    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      // Special handling for fields in the document that are arrays of objects.
      // An array of objects does not print nicely by the "console.table" function. So instead, identify these fields and
      // print them on their own and replace the contents with a "See above" message so that they do not get printed out as
      // "[Object]" in the later "console.table" invocation.
      for (const [key, value] of Object.entries(doc)) {
        if (value instanceof Array) {
          if (value.length > 0) {
            if (value[0] instanceof Object) {
              console.log(`'${collectionName}.${key}' for ${JSON.stringify(doc._id)}:`)
              console.table(doc[key])
              doc[key] = "See above"
            }
          }
        }
      }
      found.push(doc)
    }
    console.log(`'${collectionName}':`)
    console.table(found)
  })
}

printAllData()
