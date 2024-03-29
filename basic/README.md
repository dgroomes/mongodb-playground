# basic

A basic MongoDB example with instructions to install MongoDB, load data into the database and then query it back. This is
extended from the [*Aggregation with the Zip Code Data Set*](https://docs.mongodb.com/manual/tutorial/aggregation-zip-code-data-set/)
example on the MongoDB website.

**TIP**: This is a good project to start with you if you are just starting to learn about MongoDB and are already familiar with
JavaScript.

## Instructions

Follow these instructions to execute the example. As a pre-requisite, you must first install MongoDB. See the [Installing MongoDB](#installing-mongo)
section for options.

1. Start the MongoDB server:
    * The start command depends on whether you are using Docker or not. Follow the [Installing MongoDB](#installing-mongo)
      section as a pre-requisite to this step and learn how to run a MongoDB server. 
1. Load the database with ZIP Code test data from the states of Georgia (GA) and Montana (MT):
    * ```shell
      mongoimport --db test --collection zips zips-GA.json
      mongoimport --db test --collection zips zips-MT.json
      ```
1. Start a shell session:
    * ```shell
      mongosh
      ```
1. Switch to the `test` database (this is the database with the ZIP Code data):
    * ```mongo
      use test
      ```
1. Query the size of the `zips` collection:
    * ```mongo
      db.zips.find().size()
      ```
    * Success, you've written and executed your first query!
    * Exit the the shell session with `exit`
1. Query the average population of ZIP areas by city using the pre-defined query in `zips-average-population.js`:
    * ```shell
      mongosh --quiet zips-average-population.js
      ```
    * Success, you've executed your first complex query!
1. Stop the MongoDB server

## Installing MongoDB

There are various options for getting up and running with MongoDB locally. The most direct way is to download MongoDB
from the official website (see the relevant link under [Reference](#reference)) or via HomeBrew. You
should then follow the additional documentation on the MongoDB site to learn how to create a data directory, start the
MongoDB server, start an interactive shell session using the `mongo` command, and stop the MongoDB server. You should also
install the separate package known as *MongoDB Database Tools*.

An alternative option is to run a MongoDB server using Docker. There is a `docker-compose.yml` file in this project to help
accomplish that. Using the Docker option, you can do the following:

1. Start a MongoDB server:
   * ```shell
     docker-compose up --detach
     ```
2. Enter an interactive `mongo` shell session:
   * ```shell
     docker exec -it basic-mongo-1 mongo
     ```
   * NOTE: while this option is clever, it would pay off to install Mongo so that you can use the `mongo` command directly
     to start a shell session instead of this extra-ness of starting a session via the Docker container. The strength of
     the "Mongo-via-Docker" option is in running the *server* and handling the data directory in a convenient way to the user.
     Whereas starting a shell session (*client*) is more convenient to do via the `mongo` command compared to the long-winded
     `docker exec...` alternative command.
3. Stop the server:
   * ```shell
     docker-compose down
     ```

## Reference

* [MongoDB: download *Community Server*](https://www.mongodb.com/try/download/community)
* [MongoDB: *Installing the Database Tools on macOS*](https://docs.mongodb.com/database-tools/installation/installation-macos/)
* [MongoDB: run the `mongod` process](https://docs.mongodb.com/manual/tutorial/manage-mongodb-processes/)
* [MongoDB: *Aggregation with the Zip Code Data Set* tutorial](https://docs.mongodb.com/manual/tutorial/aggregation-zip-code-data-set/)
* [MongoDB: *Write Scripts for the `mongo` Shell*`](https://docs.mongodb.com/manual/tutorial/write-scripts-for-the-mongo-shell/)

## Wish List

General clean-ups, TODOs and things I wish to implement for this project:

* [x] DONE Make a monolithic query in `zips-average-population.js` instead of using the intermediate collections. This is a more
  approachable, minimal example appropriate for a basic MongoDB example project.
