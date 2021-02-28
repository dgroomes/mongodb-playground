// NOT YET IMPLEMENTED
// Compute multiple averages across the Zip code data. Features of this include:
//
//   * (NOT IMPLEMENTED) Average population of the Zip areas for each city
//   * (NOT IMPLEMENTED) Average population of the Zip areas for each state
//   * (NOT IMPLEMENTED) Incremental updates for "Average population of the Zip areas for each city" when new Zip areas
//     are added
//   * (NOT IMPLEMENTED) Incremental updates for "Average population of the Zip areas for each city" when new Zip area
//     data points are added. The new Zip area data means that the old data point should completely replaced. For example,
//     the population for Zip code 01001 (Agawam, MA) was 15,338 but at a later date increased to 15,776. Why is this
//     interesting? Well, the existing map-reduce and "aggregation pipeline" examples I've seen are only additive, they don't
//     actually replace old data. So, I think this will be an interesting example to see how it can actually be implemented.
//     Will it require an awkward implementation? Note: this could be considered a de-duplication example because we have
//     to de-duplicate the two data points for 01001: we have to toss the old population data and use the new data.
