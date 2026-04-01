#!/bin/bash
echo '{"data": {}}' | jq '(.data.ads_groups | select(. != null)) |= map(.start_time = 3818332800 | .end_time = 3818419199 | (.ads | select(. != null)) |= map(.start_time = 3818332800 | .end_time = 3818419199))'
