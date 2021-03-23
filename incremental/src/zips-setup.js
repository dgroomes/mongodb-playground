// Set up the schema for the incremental approach (of course, MongoDB is schemaless but you know what I mean).
//
// Create the collections and the indexes. This should be run before importing any data or executing any queries.
// Interestingly, defining an index on "last_modified" for the averages collections used in the non-incremental approach
// has an impact! For example, the collection "zips_avg_pop_by_city" does not have any documents with the field
// "last_modified" however defining an index on it seems to slow down the refresh "splits" by about 150ms on each split.
// And it might be fair that these collections should have this field anyway, so I defined the index to make the performance
// impact even better for the incremental approach (maybe not fair, but I thought it was interesting so wanted to check it
// into Git).

const {runWithDb} = require('./db')

runWithDb(async db => {

  // Enable profiling
  // See https://docs.mongodb.com/manual/tutorial/manage-the-database-profiler/#enable-and-configure-database-profiling
  const size = 100000000 // around 100MB
  db.createCollection( "system.profile", { capped: true, size: size} )
  await db.setProfilingLevel('slow_only')

  const collections = new Set([
    "zips",
    "zips_grouped_by_city",
    "zips_avg_pop_by_city",
    "zips_avg_pop_by_city_inc",
    "zips_grouped_by_state",
    "zips_avg_pop_by_state",
    "zips_avg_pop_by_state_inc"
  ])

  // Create the collections and indexes
  for (let collection of collections) {
    await db.createCollection(collection)
    await db.collection(collection).createIndex( { last_modified : -1 })
  }
})
