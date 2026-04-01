#!/bin/bash
# test 
echo '{"data": {"cooperate_binds": [1], "generic": {}, "note_next_step": "a", "widget_list": [], "other": 1}}' | jq 'del(.data.cooperate_binds, .data.generic, .data.note_next_step, .data.widget_list)'
