#!/bin/bash
echo '{}' | jq 'if .data != null then .data.hint_words = [] | .data.queries = [] | .data.hint_word = {} else . end'
