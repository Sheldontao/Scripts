#!/bin/bash
# test 
echo '{"data": {"hint_words": ["a"], "queries": ["b"], "hint_word": {"c": 1}}}' | jq '.data.hint_words = [] | .data.queries = [] | .data.hint_word = {}'
