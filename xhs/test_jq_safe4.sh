#!/bin/bash
echo '{"data": {}}' | jq 'del(.data.app_theme?, .data.loading_img?, .data.splash?, .data.store?)'
