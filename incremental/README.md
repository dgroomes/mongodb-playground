# incremental

This is an intermediate MongoDB example that showcases how you might incrementally load input data into an existing
materialized view. This is extended from the [*Aggregation with the Zip Code Data Set*](https://docs.mongodb.com/manual/tutorial/aggregation-zip-code-data-set/)
example on the MongoDB website.

## Design

This project takes raw input data in the form of JSON ZIP Code documents and computes two analytical data sets:

1. Average population of ZIP areas by city
1. Average population of ZIP areas by state

Specifically, the input data is the ZIP Code data for all of the US and is taken from the previously linked example on
the MongoDB website. The process of loading the data into the database is split into a multiple phases. These "splits"
are defined by shell functions in the `commands.sh` file (see [`commands.sh`](#commandssh)). The purpose of these splits
is to exercise the use-case of incrementally adding input data to existing materialized views. The materialized views are
just MongoDB collections and they are updated incrementally using an [Aggregation Pipeline](https://docs.mongodb.com/manual/core/aggregation-pipeline/)
with a [`$merge`](https://docs.mongodb.com/manual/reference/operator/aggregation/merge/#pipe._S_merge) stage as each "split"
is loaded.

For example, consider some "origin" ZIP Code data which makes up the initial input data. This input data is then aggregated
into "Average population of the ZIP areas by city" which is saved into a collection called "zips_avg_pop_by_city_inc".
Next, the "by city" data is used as an input data source that then gets aggregated into "Average population of the ZIP areas
by state" and into another collection. Later, new ZIP Code documents arrive and are added to the input data. These new documents need to be
incorporated to compute a new "by city" ZIP code population average and in turn the new "by city" data set must be
incorporated into the higher level "by state" data set.

How should the data be structured and how should the data update process be designed?

Ideally, the update process should be incremental for the sake of speedy updates. If it were not incremental, a refesh of
the materialized views would require a full re-computation over the full set of input data. This would be a bummer. On the
other hand, a data structure that accommodates incremental updates is inherently more complex than a simplistic data structure.
Just how much complexity do we need to introduce to accommodate incremental updates? And what is the performance advantage
of the incremental capability? This project aims to find out using an easy-to-follow example!

This project showcases the performance difference (or at least tries to) between two methods:

1. Using an "incremental approach" to refresh the materialized views
1. Using a "non-incremental approach" to refresh the materialized views

The "incremental approach" is what has already been described. The "non-incremental approach" is what would be considered
the standard process for refreshing a materialized view. It takes all raw input, executes the query, and saves the results;
completely ignoring and overwriting the results from previous refreshes. If I implement this correctly, the incremental
approach should scale well for large data sets while the non-incremental approach should get continually slower as the
size of the input data grows. 

## Instructions

Pre-requisites: you must have NodeJS and MongoDB installed. 

* Start a MongoDB server
* Install project dependencies
  * `npm install`
* Load project-specific shell commands (see [`commands.sh`](#commandssh)):
  * `source commands.sh`
* Set up the database:
  * `doSetup`
* Load a portion of the ZIP Code data:
  * `doImport1`
* Compute the "averages" data using the non-incremental approach:
  * `doAvg`
* Compute the "averages" data using the incremental approach:
  * `doAvgInc`
  * The results printed to the console should be the same between the non-incremental and the incremental approaches.
* Load the remainder of the ZIP Code data
  * ```
    doImport2
    doImport3
    ```
* Compute a new version of the "averages" data using the non-incremental approach:
  * `doAvg`
* Compute a new version of the "averages" data using the incremental approach:
  * `doAvgInc`
  * Again, you should notice that the results printed to the console should be the same between the non-incremental and
    the incremental approach, but the distinction is what happened under the scenes: the incremental approach re-used the
    existing materialized view and incorporated the new raw input data incrementally! By contrast, the non-incremental
    approach did a full re-computation of the averages data.
* Now let's move on to executing a formal benchmark over the non-incremental vs. the incremental approaches. The first step
  is to clear the existing data and execute the set-up again:
  * `doDropAll && doSetup`
* Benchmark the non-incremental approach:
  * `doBenchmarkAvg`
* Clear the data again and then execute the incremental approach:
  * `doDropAll && doSetup && doBenchmarkAvgInc`

## `commands.sh`

Source the `commands.sh` file using `source commands.sh` which will load your shell with useful
commands. Commands include:

* `doSetup` to set up the database's collections and indexes
* `doImport1` to import split 1 of the ZIP Code data
* `doImport2` to import split 2 of the ZIP Code data
* `doImport3` to import split 3 of the ZIP Code data
* `doAvg` execute the non-incremental approach (`zips-averages.js`) 
* `doAvgInc` execute the incremental approach (`zips-averages-incremental.js`)
* `doBenchmarkAvg` benchmark the non-incremental approach over multiple phases of loading the splits 
* `doBenchmarkAvgInc` benchmark the incremental approach over multiple phases of loading the splits 
* `doDropAll` drop all collections

## Referenced materials

* [MongoDB: *Aggregation with the Zip Code Data Set* tutorial](https://docs.mongodb.com/manual/tutorial/aggregation-zip-code-data-set/)
* [MongoDB: *Data Model Design*](https://docs.mongodb.com/manual/core/data-model-design)
    * Are you coming from a traditional SQL and relational background which favors a normalized data model? This page is
      an important one to read. It describes how idiomatic data model designs in Mongo are usually purposely de-normalized.
      In practice, this means "Store your data as embedded data in an existing document. Don't make a new collection!" (at
      least, that's my understanding so far).
* [MongoDB: *Perform Incremental Map-Reduce*](https://docs.mongodb.com/manual/tutorial/perform-incremental-map-reduce/)
* [MongoDB: *Database Profiler*](https://docs.mongodb.com/manual/tutorial/manage-the-database-profiler/)
* [NodeJS: *Easy profiling for Node.js Applications*](https://nodejs.org/en/docs/guides/simple-profiling/)

## Notes

* A shortcut to execute all setup steps and run the incremental approach:
  * `doDropAll && doSetup && doImportAll && doAvgInc`

## Wish List

General clean-ups, TODOs and things I wish to implement for this project:

* DONE Clean this up. I'm not sure exactly how. Maybe I need to upgrade to a proper NodeJS project instead of having so much
  scripting in the individual JS files which get executed by the mongo shell. I could get some code re-use with the `printAFewRecords`
  function for example.
  * DONE. Upgrade to a NodeJS project to better organize the code.
  * DONE Consolidate common code between `zips-averages.js` and `zips-averages-incremental.js`
* DONE (but needs testing) Support incremental updates for "Average population of the ZIP areas for each city" when replacement ZIP area
  data points are added. For example, the population for ZIP code 01001 (Agawam, MA) was 15,338 but at a later date increased
  to 15,776. Why is this interesting? Well, the existing map-reduce and "aggregation pipeline" examples I've seen are only
  additive, they don't actually replace old data. So, I think this will be an interesting example to see how it can actually
  be implemented. Will it require an awkward implementation? Note: this could be considered a de-duplication example because we have
  to de-duplicate the two data points for 01001: we have to toss the old population data and use the new data. Note: this
  will require re-thinking the "_id" used for the documents because Mongo will reject documents with the same ID. UPDATE:
  I think I've implemented this with what boils down to a `$mergeObjects` operation to handle replacement/duplicate ZIP
  area documents. But I have not created new "replacement" or "overriding" ZIP Code data to test this out. I would like
  to generate a lot of ZIP code data to do more volume testing, so in general I want to revamp the test data strategy but
  it will be an effort.  
* DONE Illustrate the performance advantage between incremental and non-incremental. This will require quite a bit of code especially
  around generating test data. I think a lot of test data will be needed. If there is too little test data, I think the
  execution times between incremental and non-incremental will be negligible because a lot of time is spent in the "fixed costs"
  of NodeJS startup and MongoDB query parsing and data fetching. These fixed costs should instead be amortized across a
  larger swath of test data and "incremental data load" operations and "materialized view refresh" operations. With the
  cost amortized, the execution times should better reflect the nature of the data access and data update process instead
  of illustrating stuff that is not germane to this experiment; rather, uninteresting stuff like NodeJS start up time and
  MongoDB query parsing etc. Note: the actual perf script part should be a simple timed test like: 1) start a Node program
  and initialize the database 2) load split #1 of the data 3) Compute the averages (either incrementally
  or non-incrementally depending on what is being tests) and then 4) repeat steps #2 and #3 until all splits are loaded
  5) print timing results.
* DONE De-couple the "incremental average" script (`zips-averages-incremental.js`) from the "bare average" script (`zips-averages.js`).
  The "bare average" script only exists to create a performance baseline of "how long does it take to compute an average
  across the set of raw input data" whereas the "incremental average" script is a wholesale replacement for the "bare average"
  script. In theory it should execute more quickly for averages computations when incremental input data is added. Currently
  the "bare average" script saves into an indermediate collection. It shouldn't. It should just be a simple query to compute
  the averages.
* DONE push functions into `zips.js` and have thin scripts for actually running the functions. I.e. the `zips-averages.js`
  script should import the averaging functions from `zips.js`. This paves the way for creating the performance test runner
  scripts which will also import the averaging functions from `zips.js`.
* Speed up the incremental script. It is really slow compared to the non-incremental script, but the whole point of this
  project is to show how an incremental approach can be faster! There are a lot of options here. First and foremost is
  to weed out already processed data. This can be done by creating a new field named "loaded". It will store a boolean
  to indicate if the data has been loaded or not. This should be indexed. In fact, if possible, it should use a partial
  index so that only documents with this field set to "false" are indexed. All documents that are already loaded should
  be ignored. Alternatively, maybe a "capped" (I think is what it's called?) collection can be used as a landing zone for
  new ZIP area records that need to be incorporated. After an incremental load, this can be blow away. This should be faster
  than an index. Moving on from this, the averaging computation across the cities and states should use use a "needs updating"
  flag approach to reduce computation of already computed data.
* DONE ("Speed up") Spread actual incrementalism into "refreshAvgPopByCityInc". Currently, "refreshAvgPopByCityInc"
  is not actually incremental. To make it incremental, only visit those entries that were recently modified in the "zips_grouped_by_city"
  collection and then compute the new city average and merge the results into "zips_avg_pop_by_city_inc"
* DONE ("Speed up") Spread actual incrementalism into "refreshGroupedByState" step. Note: while implementing this
  I have a challenge with the timestamps that is making the query not idempotent. For example, the "Springfield, MA"
  aggregation is counted twice in the "zips_grouped_by_state" aggregation:
  ```
  'zips_grouped_by_state.city_aggregated_zip_area_summaries' for "MA":
  ┌─────────┬──────────────────────────────────────┬──────────────────────────────┬──────────┬────────────────┬──────────────────────────┐
  │ (index) │                 _id                  │ avg_zip_area_pop_across_city │ city_pop │ city_zip_areas │      last_modified       │
  ├─────────┼──────────────────────────────────────┼──────────────────────────────┼──────────┼────────────────┼──────────────────────────┤
  │    0    │ { city: 'SPRINGFIELD', state: 'MA' } │            12219             │  24438   │       2        │ 2021-03-20T20:37:53.177Z │
  │    1    │ { city: 'SPRINGFIELD', state: 'MA' } │            13136             │  39408   │       3        │ 2021-03-20T20:38:22.166Z │
  └─────────┴──────────────────────────────────────┴──────────────────────────────┴──────────┴────────────────┴──────────────────────────┘
  ```
  Idea: I'm finding it hard (impossible?) to use the "setUnion" operator to merge incoming "city_aggregated_zip_area_summary"
  documents into the "zips_grouped_by_state" collection because the incoming documents have timestamps that cause them to
  be different from the other documents. I would really prefer to do something like "mergeObjects" operation which would
  replace the old fields with the new, but I want this for arrays... Anyway, I think I will experiment with the "incorporateNewZips"
  function to see if there is a simpler way to merge in new records. If not simpler, then at least I can always go and use
  server-side JavaScript inside Mongo using [`$accumulator`](https://docs.mongodb.com/manual/reference/operator/aggregation/accumulator/#grp._S_accumulator)
  and write the merge in JavaScript code. Of course this is not idiomatic, if there is a normal Mongo query then that would
  be better, but it's getting awkward because I'm looking into "$let" and other conditionals so it's like writing function body
  in JSON, reminds me of if/else in JSP or XML elements. I will do this work in a new branch "incorporate-alternative".
  UPDATE: I figured out the right operators to use in an aggregation pipeline to upsert sub-documents that are stored in
  an array in a "$merge" stage! I will apply that to the refresh state function.
* DONE ("Speed up") Spread actual incrementalism into the "refreshAvgPopByStateInc" step.
* DONE Turn the "bare averages" script into a normal materialized view refresh script, or a so-called "non-incremental"
  approach for refreshing a materialized view. In other words, actually commit the query results into a collection; thus
  it is a materialized view. This will slow down the execution time of the non-incremental approach significantly and make
  for a more like-to-like comparison with the incremental approach.
* DONE ("Speed up") Create an index on "last_modified" time. Not really sure this will make a big difference because it will only
  speed up reads, but reads should already be ultra fast on a data set that's only a few megabytes (how do I check the
  actual on-disk size of a collection in bytes?). UPDATE: it's implemented but not really sure it makes a significant different.
  I see a 10-40ms improvement anecdotally in the later "splits" compared to without an index.
* Starker performance view. Make the visual difference greater between the time it takes to execute the materialized view refresh
  at lower volumes of data (the first few levels of the "splits" loads) and larger data (when most of the "splits" data
  is loaded). Right now it's kind of flat; it starts at 200ms and goes to 300 and 400 but it's quite gradual. I think if
  we just run 2, 3 or 4 refreshes for each split, then it will have the effect of magnifying the results (but of course
  that's not a realistic workload). Or, maybe do more splits, compute a rolling average as splits are loaded, and show exactly
  10 windows of this data (after all 29, which is what shows now, is too much for the screen)
* DONE Enable database performance profiling
* Inspect MongoDB for slow queries. I want to know which queries are slow. I don't want to guess and the fruitlessly try
  to optimize something that turns out doesn't matter.
* In the non-incremental approach, compute the state averages using the city averages. It's so slow to compute the state
  averages using the raw zips data. It makes the speed comparison unfair when compared to the incremental approach. I want
  the incremental approach to win on merit.  
