#!/bin/bash
# test 
echo '{"data": {"app_theme": 1, "loading_img": 2, "splash": 3, "store": 4, "other": 5}}' | jq 'del(.data.app_theme, .data.loading_img, .data.splash, .data.store)'
