#!/bin/bash
echo '{"data": {}}' | jq 'del(.data.cooperate_binds?, .data.generic?, .data.note_next_step?, .data.widget_list?)'
