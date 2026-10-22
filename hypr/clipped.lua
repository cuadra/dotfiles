#!/usr/bin/env lua
-- clipped.lua: copy a string to the Wayland clipboard (for Hyprland binds).
--
-- Usage:
--   clipped.lua "some text"        copy the given text
--   clipped.lua -n "some text"     copy and show a desktop notification
--   clipped.lua -p "some text"     paste the text into the focused window
--   echo "text" | clipped.lua      copy from stdin when no text is given
--
-- Hyprland example:
--   bind = SUPER, F1, exec, lua ~/.config/hypr/clipped.lua -n "hello@example.com"
--   bind = SUPER, F2, exec, lua ~/.config/hypr/clipped.lua -p "hello@example.com"

local notify = false
local paste = false
local parts = {}

for _, a in ipairs(arg) do
  if a == "-n" or a == "--notify" then
    notify = true
  elseif a == "-p" or a == "--paste" then
    paste = true
  else
    parts[#parts + 1] = a
  end
end

local text = table.concat(parts, " ")
if text == "" then
  text = io.read("a") or ""
  text = text:gsub("\n$", "")
end

if text == "" then
  io.stderr:write("clipped: nothing to copy\n")
  os.exit(1)
end

-- Write via a pipe so the text never passes through the shell unescaped.
local function pipe_to(cmd, data)
  local pipe = io.popen(cmd, "w")
  if not pipe then
    io.stderr:write("clipped: failed to run " .. cmd .. "\n")
    os.exit(1)
  end
  pipe:write(data)
  if not pipe:close() then
    io.stderr:write("clipped: " .. cmd .. " exited with an error\n")
    os.exit(1)
  end
end

if paste then
  -- Remember the current text clipboard so it can be put back afterwards.
  local p = io.popen("wl-paste --no-newline --type text 2>/dev/null")
  local previous = p and p:read("a") or ""
  if p then p:close() end

  -- Paste through the clipboard with Ctrl+Shift+V (works in browsers and
  -- terminals). sendshortcut sets the modifiers explicitly, so the bind's
  -- still-held SUPER key can't turn this into a different shortcut.
  pipe_to("wl-copy", text)
  -- hyprctl exits 0 even on failure, so check what it printed.
  local h = io.popen("hyprctl dispatch sendshortcut 'CTRL SHIFT, V, activewindow'")
  local result = h and h:read("a") or ""
  if h then h:close() end
  if not result:match("^ok") then
    io.stderr:write("clipped: sendshortcut failed: " .. result)
    os.execute("notify-send -t 3000 'clipped: paste failed' " .. string.format("%q", result))
  end

  -- Give the app time to read the clipboard before restoring it.
  os.execute("sleep 0.5")
  if previous ~= "" then
    pipe_to("wl-copy", previous)
  else
    os.execute("wl-copy --clear")
  end
else
  pipe_to("wl-copy", text)
end

if notify then
  local preview = text:sub(1, 60):gsub("'", "'\\''")
  os.execute("notify-send -t 1500 'Copied to clipboard' '" .. preview .. "'")
end
