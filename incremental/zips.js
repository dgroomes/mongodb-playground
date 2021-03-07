// Functions for computing data with the ZIP Code data.
// These functions are the **core** (read: the interesting parts!) of the project.

/**
 * Set the "lastModified" field on records where it is not set.
 */
async function lastModified(db) {
  return await db.collection("zips").updateMany(
    {lastModified: {$exists: false}},
    [
      {$set: {lastModified: "$$NOW"}}
    ]
  )
}

module.exports = {
  lastModified
}
