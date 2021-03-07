# mongodb-playground

📚 Learning and exploring MongoDB.

> A complete data framework
> 
> We offer a document-based, distributed database built to handle
> the data of any application you're building.
>
> -- <cite>https://www.mongodb.com/3</cite>

Note: this was developed on macOS.

## Standalone sub-projects

This repository illustrates different concepts, patterns and examples via standalone sub-projects. Each sub-project is
completely independent of the others and do not depend on the root project. This _standalone sub-project constraint_
forces the sub-projects to be complete and maximizes the reader's chances of successfully running, understanding, and
re-using the code.

The sub-projects include:

### `basic/`

A basic MongoDB example with instructions to install MongoDB, load data into the database and then query it back. This is
extended from the [*Aggregation with the Zip Code Data Set*](https://docs.mongodb.com/manual/tutorial/aggregation-zip-code-data-set/)
example on the MongoDB website.

**TIP**: This is a good project to start with you if you are just starting to learn about MongoDB and are already familiar with
JavaScript.

See the README in [basic/](basic/).

### `incremental/`

This is an intermediate MongoDB example that showcases how you might incrementally load input data into an existing
analytical data set. This is extended from the [*Aggregation with the Zip Code Data Set*](https://docs.mongodb.com/manual/tutorial/aggregation-zip-code-data-set/)
example on the MongoDB website.

See the README in [incremental/](incremental/).

### `misc/`

Miscellaneous notes, data and scripts. This is *not* a cohesive sub-project.

See the README in [misc/](misc/).

## Wish List

General clean-ups, TODOs and things I wish to implement for this project:

* DONE Create test data and load it into Mongo
* DONE Create some test queries
* DONE Incrementally update an aggregation ([see this MongoDB official example](https://docs.mongodb.com/manual/tutorial/perform-incremental-map-reduce/))
  * Note: We need a way to make the aggregation pipeline idempotent because there is lack of transaction support
    for aggregation pipelines using the `$merge` operator which I'm assuming we need. To cite the [docs](https://docs.mongodb.com/manual/reference/operator/aggregation/merge/#pipe._S_merge):
    "An aggregation pipeline cannot use $merge inside a transaction." So if there is no transaction support, there is the
    chance for a partial/incomplete update. So to accommodate partial updates, one solution is to just execute the averaging
    operation again. And if we do this, we have to make sure that subsequent runs of the operation after the first are harmless.
    This is what "idempotent" means. How do we do this? Well for one I think we can use a "last modified" strategy to process all
    records that have been modified since "X" and then keep track of "last operation time" and run the incremental averaging operation 
    between "X" and now (exclusive of now). Then I think we can group ZIP area records sharing the same city into the same document
    as a way to de-duplicate already incorporated documents during a "merge" operation. If there is a change to the document, set the
    "last modified" to now for that document. This has the effect of flagging this document so that it can processed by
    the next level up in the averaging operation pyramid: avg by state. And so on. (That's the theory anyway.)
  * DONE make intermediate Mongo collections that group the ZIP areas by city and another collection to group the
    cities by state. This is the deduping strategy (it sounds a bit algorithmically expensive but it's the best I can do.)
  * DONE Add lastModified field to the raw input documents (the "zips" collection). I'm not sure the best way to do this. One option
    is to do it in the JSON before importing it via `mongoimport`. Another option is to run an update query right before doing
    any other queries to update documents where "lastModified" is unset.
  * DONE Keep track of "last loaded time"
* DONE Split into standalone sub-projects. This will free us up for later to increase the cohesion of the sub-projects.
* Split the 'incremental/' sub-project into two: 1) a 'materialized/' sub-project that implements a materialized view of
  the ZIP averages data but without incremental support. And 2) the 'incremental/' sub-project which is also an implementation
  of a materialized view of the data but which also supports incremental load. I realize I was conflating these two concepts
  in the existing 'incremental/' sub-project.
* Create a new sub-project that performance tests the incremental approach vs. the non-incremental approach. This should be a simple
  timed test like: 1) start a Node program and initialize the database 2) load slice 1 of the data 3) Compute the averages (either incrementally
  or non-incrementally depending on what is being tests) and then 4) repeat steps 2 and 3 until all slices are loaded 5) print timing results 
