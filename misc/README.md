# misc

Miscellaneous notes, data and scripts. This is *not* a cohesive sub-project.

## Notes

* Import the individual state-level ZIP code data files with this command:
  ```
  mongoimport --db test --collection zips <(cat data/zips_*)
  ```
* Import the monolithic ZIP code data file with this command:
  ```
  mongoimport --db test --collection zips data/zips.json
  ```
* Export a single state's ZIP code data
  ```
  mongoexport --db test --collection zips --query '{ "state": "NY" }' --out data/zips_NY.json
  ```

## Common Source Code

Copy the common source code to the other sub-projects with `./copy-common-code.sh`.

## Wish List

General clean-ups, TODOs and things I wish to implement for this project:

* DONE Start authoring the common files like `db.js` and `util.js` in the `misc/` sub-project and copy them out to the individual
  sub-projects as needed. Use a script to copy them out to the other projects. I use this strategy `https://github.com/dgroomes/kafka-playground/tree/main/utility-scripts`
  effectively. Technically, the sub-projects still adhere to the "standalone" constraint because there is no runtime or
  build time dependency between those projects and this projects. A reader can read an individual project and in fact
  delete the `misc/` sub-project and the other sub-project will still work.
* DONE make the sampling code print a consolidate output instead of the bulky JSON. The bulkiness is especially
  annoying when doing the multiple invocations of the refresh and query and timing the execution time in `materialized/`  
* DONE Make utility Mongo scripts to load the zips data into Mongo. This is to easily extract state-specific zip code data.
