#!/usr/bin/osascript

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title SFMRule
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 

# Documentation:
# @raycast.description Direct/Rule/Global via clashapi
# @raycast.author LeonardoX
# @raycast.authorURL https://raycast.com/LeonardoX

set targetMode to "Rule" -- change to "Rule", "Global", or "Direct"
set apiURL to "http://127.0.0.1:9090/configs"

-- Construct the curl command for PATCH
set curlCommand to "curl -X PATCH -H \"Content-Type: application/json\" -d '{\"mode\": \"" & targetMode & "\"}' " & apiURL

try
	set apiResponse to do shell script curlCommand
	display notification "Sing-box mode set to: " & targetMode with title "Sing-box Control"
on error errMsg number errNum
	display notification "Error: " & errMsg with title "Sing-box Control Error"
end try
