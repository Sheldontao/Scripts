#!/bin/bash
# test 
echo '{"data": {"title": "你可能感兴趣的人", "rec_users": [1, 2]}}' | jq 'if (.data.title == "你可能感兴趣的人" and (.data.rec_users | length) > 0) then .data = {} else . end'
