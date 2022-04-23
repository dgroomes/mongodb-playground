# materialized

An intermediate MongoDB example using NodeJS that showcases how to create a materialized view using the `$out` stage of
an aggregation pipeline. This is extended from the [*Aggregation with the Zip Code Data Set*](https://docs.mongodb.com/manual/tutorial/aggregation-zip-code-data-set/)
example on the MongoDB website.

## Design

This project takes raw input data in the form of JSON ZIP Code documents and computes two analytical data sets:

1. Average population of ZIP areas by city
1. Average population of ZIP areas by state
   
The data sets are stored in their own MongoDB collections by using the `$out` stage of the [Aggregation Pipeline](https://docs.mongodb.com/manual/core/aggregation-pipeline/)
query that computes the averages data. These output collections are known as *materialized views*. A materialized view
is a copy of the result set of some other query. The idea is that the result set is much smaller, in terms of bytes, than
the original data set and so querying the materialized view is a much computationally cheaper operation than re-computing
the result set on-demand from the original data. The downside of a materialized view is that it must be frequently refreshed
to reflect changes in the backing source data. This means read requests to a materialized view return increasingly stale
data as changes happen to the backing source data over time.

Using a materialized view is an effective physical data design to make reads fast if you can afford "windows of staleness"
and the accompanying maintenance it takes to refresh the view. 

## Instructions

Follow these instructions to execute the example. 

1. Start a MongoDB server
1. Install project dependencies
   * ```shell
     npm install
     ```
1. Load the database with ZIP Code test data from the states of Georgia (GA) and Montana (MT):
   * ```shell
     mongoimport --db test --collection zips zips-GA.json
     mongoimport --db test --collection zips zips-MT.json
     ```
1. Perform an inaugural "refresh" of the materialized views by computing the "averages" data from the backing source data:
   * ```shell
     node src/zips-refresh-averages.js
     ```
1. Query the averages data from the materialized views:
   * ```shell
     node src/zips-averages.js
     ```
   * The same data was returned, but no "averages" computation was actually done in this command! Rather, the query returned
     a copy of the "averages" data from the materialized view where it was already pre-computed in the earlier invocation
     of `zips-refresh-averages.js`.
1. Repeat the same steps but this time pay attention to how long it takes to execute the commands. Let's make use of the
   `time` command. Execute the refresh three times and then the query to the materialized view three times:
   * ```shell
     time (node src/zips-refresh-averages.js; node src/zips-refresh-averages.js; node src/zips-refresh-averages.js)
     ```
   * On my computer, the three refreshes take around **1.5 seconds** total.
   * ```shell
     time (node src/zips-averages.js; node src/zips-averages.js; node src/zips-averages.js)
     ```
   * On my computer, the three queries to the materialized views take around **.8 seconds** total! Admittedly, this is
     not very impressive, but imagine the savings for more large data sets. Depending on the use case and the volume of
     source data the time savings could be even larger. As in all things, experiment with your own data
     to evaluate the time savings of a materialized view strategy and weigh that against the design complexity.

## Reference

* [MongoDB: *MongoDB Node Driver*](https://docs.mongodb.com/drivers/node/)
* [MongoDB: *Aggregation with the Zip Code Data Set* tutorial](https://docs.mongodb.com/manual/tutorial/aggregation-zip-code-data-set/)

## Wish List

General clean-ups, TODOs and things I wish to implement for this project:

* [x] DONE Remove the "lastModified" stuff from this project.
* [x] DONE Consolidate the "refresh" code. I don't think the "grouped by city" intermediate aggregation is useful here. I think that
  is more useful for the `incremental/` sub-project
