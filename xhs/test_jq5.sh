#!/bin/bash
# test 
echo '{"data": {"items": [{"recommend_reason": "friend_post"}, {"recommend_reason": "other"}]}}' | jq '.data.items |= map(select(.recommend_reason == "friend_post"))'
