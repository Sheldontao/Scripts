#!/bin/bash
# test 
echo '{"data": {"ads_groups": [{"start_time": 1, "end_time": 2, "ads": [{"start_time": 1, "end_time": 2}]}]}}' | jq '.data.ads_groups |= map(.start_time = 3818332800 | .end_time = 3818419199 | .ads |= map(.start_time = 3818332800 | .end_time = 3818419199))'
