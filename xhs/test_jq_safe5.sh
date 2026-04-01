#!/bin/bash
echo '{}' | jq '.data.hint_words = [] | .data.queries = [] | .data.hint_word = {}'
