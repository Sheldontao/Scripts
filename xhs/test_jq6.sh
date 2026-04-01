#!/bin/bash
# test 
echo '{"data": {"items": [{"recommend_reason": "recommend_user"}, {"recommend_reason": "other"}]}}' | jq '.data.items |= map(select(.recommend_reason != "recommend_user"))'
