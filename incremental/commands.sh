#!/usr/bin/env bash

doSetup() {
  node src/zips-setup.js
}

doImport1() {
  mongoimport --db test --collection zips <(sed -n '1,10000p;10001q' zips.json)
}

doImport2() {
  mongoimport --db test --collection zips <(sed -n '10001,20000p;20001q' zips.json)
}

doImport3() {
  mongoimport --db test --collection zips <(sed -n '20001,29353p' zips.json)
}

doImportAll() {
  mongoimport --db test --collection zips zips.json
}

# Import two ZIP areas for the city Springfield, MA
# This function, in combination with doImportSpringfield2() is useful as I test the incremental
# merge functionality.
doImportSpringfield1() {
  mongoimport --db test --collection zips <(sed -n '48,49p' zips.json)
}

# Import one more ZIP code for Springfield. See doImportSpringfield1.
doImportSpringfield2() {
  mongoimport --db test --collection zips <(sed -n '50p' zips.json)
}

doAvg() {
  node src/zips-averages.js
}

doAvgInc() {
  node src/zips-averages-incremental.js
}

doBenchmark() {
  node src/zips-benchmark.js
}

doDropAll() {
  mongo --quiet --eval '
    db.setProfilingLevel(0)
    db.system.profile.drop()
    db.zips.drop()
    db.app_meta_data.drop()
    db.zips_avg_pop_by_city.drop()
    db.zips_avg_pop_by_state.drop()
    db.zips_avg_pop_by_city_inc.drop()
    db.zips_avg_pop_by_state_inc.drop()
    db.zips_grouped_by_city.drop()
    db.zips_grouped_by_state.drop()'
}

doDebug() {
  node src/zips-debug.js
}
