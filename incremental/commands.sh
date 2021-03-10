#!/usr/bin/env bash

doImport1() {
  mongoimport --db test --collection zips zips-RI-split-1.json
}

doImport2() {
  mongoimport --db test --collection zips zips-RI-split-2.json
}

doImport3() {
  mongoimport --db test --collection zips zips-RI-split-3.json
}

doAvg() {
  node src/zips-averages.js
}

doAvgInc() {
  node src/zips-averages-incremental.js
}

doDropAll() {
  mongo --quiet --eval '
    db.app_meta_data.drop()
    db.zips.drop()
    db.zips_avg_pop_by_city.drop()
    db.zips_avg_pop_by_state.drop()
    db.zips_grouped_by_city.drop()
    db.zips_grouped_by_state.drop()'
}
