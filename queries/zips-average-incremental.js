// NOT IMPLEMENTED
// This is a companion script to "zips-average.js". It does an incremental load of ZIP areas data and incrementally computes
// the averages data.
//
//   * (NOT IMPLEMENTED) Incremental updates for "Average population of the ZIP areas for each city" when new ZIP areas
//     are added
//   * (NOT IMPLEMENTED) Incremental updates for "Average population of the ZIP areas for each city" when new ZIP area
//     data points are added. The new ZIP area data means that the old data point should completely replaced. For example,
//     the population for ZIP code 01001 (Agawam, MA) was 15,338 but at a later date increased to 15,776. Why is this
//     interesting? Well, the existing map-reduce and "aggregation pipeline" examples I've seen are only additive, they don't
//     actually replace old data. So, I think this will be an interesting example to see how it can actually be implemented.
//     Will it require an awkward implementation? Note: this could be considered a de-duplication example because we have
//     to de-duplicate the two data points for 01001: we have to toss the old population data and use the new data.

