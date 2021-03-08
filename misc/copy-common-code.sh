#!/usr/bin/env bash
# Copy the common source code files to the other sub-projects

set -eu

subProjects=(
'materialized'
'incremental'
)

for i in "${subProjects[@]}"; do
    cp common/* "../$i/src"
done
