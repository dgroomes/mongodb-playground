// Compute multiple averages across the ZIP Code data. "Averaging" computations include:
//   * Average population of the ZIP areas for each *city*.
//   * Average population of the ZIP areas for each *state*.

const {runWithDb, printAFewRecords} = require('./db')

runWithDb(async db => {

  let cityAvgCursor = db.collection("zips").aggregate([
    {
      $group: {
        "_id": "$city",
        zip_areas: {$sum: 1},
        total_pop: {$sum: "$pop"}
      }
    },
    {
      $project: {
        avg_zip_area_pop: {
          $trunc: {
            $divide: ["$total_pop", "$zip_areas"]
          }
        }
      }
    },
    {
      $sort: {
        avg_zip_area_pop: -1
      }
    }
  ])

  console.log("Average population of ZIP areas by city:\n\n")
  await printAFewRecords(cityAvgCursor)

  let stateAvgCursor = db.collection("zips").aggregate([
    {
      $group: {
        "_id": "$state",
        zip_areas: {$sum: 1},
        total_pop: {$sum: "$pop"}
      }
    },
    {
      $project: {
        avg_zip_area_pop: {
          $trunc: {
            $divide: ["$total_pop", "$zip_areas"]
          }
        }
      }
    },
    {
      $sort: {
        avg_zip_area_pop: -1
      }
    }
  ])

  console.log("Average population of ZIP areas by state:\n\n")
  await printAFewRecords(stateAvgCursor)
})
