-- Hyprland Lua config, ported from hyprland.conf.
-- Refer to the wiki for more information.
-- https://wiki.hypr.land/configuring/

-- You can (and should!!) split this configuration into multiple files
-- Create your files separately and then require them like this:
-- require("myColors")

------------------
---- MONITORS ----
------------------

-- See https://wiki.hypr.land/configuring/core/monitors/
hl.monitor({
	output = "DP-1",
	mode = "3840x2160@120",
	position = "0x0",
	scale = 1,
})

hl.config({
	decoration = {
		wobble = {
			enabled = true,
		},
	},
})

---------------------
---- MY PROGRAMS ----
---------------------

-- Set programs that you use
-- Ghostty is GTK 4, which tells Hyprland "don't blur me" by default. Turning off
-- GTK's background-effect protocol for Ghostty only lets Hyprland blur its
-- translucent background (background-opacity in ~/.config/ghostty/config).
local terminal = "env GDK_WAYLAND_DISABLE=ext_background_effect_manager_v1 ghostty"
local fileManager = "kitty -e yazi"
local browser = "flatpak run app.zen_browser.zen"

-------------------
---- AUTOSTART ----
-------------------

-- See https://wiki.hypr.land/configuring/core/autostart/

hl.on("hyprland.start", function()
	-- Load hyprpm plugins (hyprfocus); -n sends a notification if one fails to load
	hl.exec_cmd("hyprpm reload -n")
	-- AGS (~/.config/ags): bar, dashboard and notifications
	hl.exec_cmd("hyprpaper & ags run ~/.config/ags")
	-- Bluetooth starts off on every login (retries while BlueZ comes up); turn it on from the dashboard
	hl.exec_cmd("sh -c 'for i in 1 2 3 4 5 6 7 8 9 10; do bluetoothctl power off && exit 0; sleep 1; done'")
end)

-------------------------------
---- ENVIRONMENT VARIABLES ----
-------------------------------

-- See https://wiki.hypr.land/configuring/core/environment-variables/

hl.env("XCURSOR_SIZE", "24")
hl.env("HYPRCURSOR_SIZE", "24")
-- Qt apps (Dolphin, etc.) take their theme/colors from qt6ct (run "qt6ct" to change)
hl.env("QT_QPA_PLATFORMTHEME", "qt6ct")

-----------------------
---- LOOK AND FEEL ----
-----------------------

-- top, right, bottom, left. The AGS bar doesn't reserve space, so the top gap
-- covers it: bar margin-top 10 + bar height 54 + 10 gap below it = 74
local gapsFull = { top = 40, right = 20, bottom = 20, left = 20 }
-- 2160 - 535 - 535 = 1090, minus gaps_in (5 top + 5 bottom) = 1080
local gapsBand = { top = 535, right = 20, bottom = 535, left = 20 }

-- Refer to https://wiki.hypr.land/configuring/core/config-options/
hl.config({
	general = {
		gaps_in = 5,
		gaps_out = gapsFull,

		border_size = 0,

		col = {
			active_border = { colors = { "rgba(666666ee)", "rgba(33333300)", "rgba(666666ee)" } },
			inactive_border = { colors = { "rgba(666666ee)", "rgba(00000000)", "rgba(666666ee)" }, angle = 45 },
		},

		-- Set to true to enable resizing windows by clicking and dragging on borders and gaps
		resize_on_border = false,

		-- Please see https://wiki.hypr.land/configuring/extra/tearing/ before you turn this on
		allow_tearing = false,

		layout = "scrolling",
	},

	decoration = {
		rounding = 7,

		-- Change transparency of focused and unfocused windows
		active_opacity = 1.0,
		inactive_opacity = 1.0,

		shadow = {
			enabled = false,
		},

		blur = {
			enabled = true,
			size = 4,
			passes = 3,
			vibrancy = 0.1696,
		},
	},

	animations = {
		enabled = true,
	},
})

-- See https://wiki.hypr.land/configuring/core/animations/
hl.curve("myBezier", { type = "bezier", points = { { 0.05, 0.9 }, { 0.1, 1.05 } } })

hl.animation({ leaf = "windows", enabled = true, speed = 7, bezier = "myBezier" })
hl.animation({ leaf = "windowsOut", enabled = true, speed = 7, bezier = "default", style = "popin 80%" })
hl.animation({ leaf = "workspaces", enabled = true, speed = 6, bezier = "default", style = "slidefade 20%" })
hl.animation({ leaf = "border", enabled = true, speed = 10, bezier = "default" })
hl.animation({ leaf = "borderangle", enabled = true, speed = 8, bezier = "default" })
hl.animation({ leaf = "fade", enabled = true, speed = 7, bezier = "default" })

-- hyprfocus (hyprpm plugin): quick squish-and-bounce on keyboard focus (Super+hjkl).
-- Its options and animation leaves only exist once hyprpm has loaded the plugin,
-- so they're applied on config.reloaded, and skipped until the plugin is loaded
-- (otherwise Hyprland shows "unknown config key" errors).
local function pluginLoaded(name)
	for _, p in pairs(hl.get_loaded_plugins()) do
		if p.name == name then
			return true
		end
	end
	return false
end

hl.on("config.reloaded", function()
	if not pluginLoaded("hyprfocus") then
		return
	end
	hl.config({
		plugin = {
			hyprfocus = {
				keyboard_focus_animation = "shrink", -- flash / shrink / slide / none
				mouse_focus_animation = "none", -- follow_mouse is on, so hover focus stays quiet
				shrink_percentage = 0.95, -- how small the window gets at the peak
				animate_floating = true,
			},
		},
	})
	hl.animation({ leaf = "hyprfocusIn", enabled = true, speed = 1.7, bezier = "default" })
	-- myBezier overshoots (1.05), so the window springs slightly past full size on the way back
	hl.animation({ leaf = "hyprfocusOut", enabled = true, speed = 2.5, bezier = "myBezier" })
end)

-- See https://wiki.hypr.land/configuring/layouts/dwindle-layout/ for more
hl.config({
	dwindle = {
		preserve_split = true, -- You probably want this
	},
})

-- See https://wiki.hypr.land/configuring/layouts/master-layout/ for more
hl.config({
	master = {
		new_status = "master",
		orientation = "center",
		mfact = 0.40, -- Master factor, 0.0 - 1.0, 0.5 is default
	},
})

-- See https://wiki.hypr.land/configuring/layouts/scrolling-layout/ for more
hl.config({
	scrolling = {
		column_width = 0.5,
		fullscreen_on_one_column = true,
	},
})

----------------
----  MISC  ----
----------------

hl.config({
	misc = {
		force_default_wallpaper = 0, -- Set to 0 or 1 to disable the anime mascot wallpapers
		disable_hyprland_logo = true, -- If true disables the random hyprland logo / anime girl background. :(
		background_color = 0x303446,
	},
})

---------------
---- INPUT ----
---------------

hl.config({
	input = {
		kb_layout = "us",
		kb_variant = "",
		kb_model = "",
		kb_options = "",
		kb_rules = "",

		follow_mouse = 1,

		sensitivity = 1.0, -- -1.0 - 1.0, 0 means no modification.

		touchpad = {
			natural_scroll = false,
		},
	},
})

-- Example per-device config
-- See https://wiki.hypr.land/configuring/core/devices/ for more
hl.device({
	name = "epic-mouse-v1",
	sensitivity = -0.5,
})

---------------------
---- KEYBINDINGS ----
---------------------

local mainMod = "SUPER" -- Sets "Windows" key as main modifier

-- Hyprland popups replace each other in AGS (see ags/widget/Notifications.tsx)
local function notify(id, tag, text)
	hl.exec_cmd(
		"notify-send -a Hyprland -t 1500 -r "
			.. id
			.. " -h string:x-canonical-private-synchronous:"
			.. tag
			.. " '"
			.. text
			.. "'"
	)
end

-- See https://wiki.hypr.land/configuring/core/binds/ for more
hl.bind(mainMod .. " + V", hl.dsp.exec_cmd("lua ~/.config/hypr/clipped.lua -p 'An0r0E!!ipt@'"))

-- Cycle layouts: master -> scrolling -> monocle -> dwindle (was toggle.sh)
local nextLayout = { master = "scrolling", scrolling = "monocle", monocle = "dwindle", dwindle = "master" }
hl.bind(mainMod .. " + TAB", function()
	local layout = nextLayout[hl.get_config("general.layout")]
	if not layout then
		return
	end
	hl.config({ general = { layout = layout } })
	notify(9102, "hypr-layout", "Layout: " .. layout)
end)

hl.bind(mainMod .. " + Q", hl.dsp.exec_cmd("pidof hyprlock || hyprlock"))

hl.bind(mainMod .. " + N", hl.dsp.exec_cmd(terminal))
hl.bind(mainMod .. " + SHIFT + N", hl.dsp.exec_cmd(browser))

hl.bind(mainMod .. " + ESCAPE", hl.dsp.window.close())

-- Move focus with mainMod + hjkl
hl.bind(mainMod .. " + H", hl.dsp.focus({ direction = "left" }))
hl.bind(mainMod .. " + L", hl.dsp.focus({ direction = "right" }))
hl.bind(mainMod .. " + K", hl.dsp.focus({ direction = "up" }))
hl.bind(mainMod .. " + J", hl.dsp.focus({ direction = "down" }))
hl.bind(mainMod .. " + Z", hl.dsp.layout("cycleprev"))
hl.bind(mainMod .. " + X", hl.dsp.layout("cyclenext"))

-- Move active window with mainMod + SHIFT + hjkl
hl.bind(mainMod .. " + SHIFT + H", hl.dsp.window.move({ direction = "left" }))
hl.bind(mainMod .. " + SHIFT + L", hl.dsp.window.move({ direction = "right" }))
hl.bind(mainMod .. " + SHIFT + K", hl.dsp.window.move({ direction = "up" }))
hl.bind(mainMod .. " + SHIFT + J", hl.dsp.window.move({ direction = "down" }))

-- Switch workspaces with mainMod + [yuio]
-- Move active window to a workspace with mainMod + SHIFT + [yuio]
for i, key in ipairs({ "Y", "U", "I", "O" }) do
	hl.bind(mainMod .. " + " .. key, hl.dsp.focus({ workspace = i }))
	hl.bind(mainMod .. " + SHIFT + " .. key, hl.dsp.window.move({ workspace = i }))
end

-- Notepad
hl.bind(mainMod .. " + M", hl.dsp.exec_cmd("kitty -e nvim ~/notepad.txt"))
hl.bind(mainMod .. " + E", hl.dsp.exec_cmd(fileManager))

-- Move/resize windows with mainMod + LMB/RMB and dragging
hl.bind(mainMod .. " + mouse:272", hl.dsp.window.drag(), { mouse = true })
hl.bind(mainMod .. " + mouse:273", hl.dsp.window.resize(), { mouse = true })

hl.bind(mainMod .. " + P", hl.dsp.exec_cmd("hyprshot -m region --clipboard-only"))
hl.bind(mainMod .. " + SHIFT + P", hl.dsp.exec_cmd("hyprshot -m window --clipboard-only"))
-- Screen recording: Super+Shift+R records an area (press again to stop),
-- Super+Ctrl+R stops any recording
hl.bind(mainMod .. " + SHIFT + R", hl.dsp.exec_cmd("bash ~/.config/hypr/record.sh"))
hl.bind(mainMod .. " + CTRL + R", hl.dsp.exec_cmd("bash ~/.config/hypr/record.sh stop"))
-- Dashboard (AGS, includes the app launcher): Super+Space toggles it; Esc closes it
hl.bind(mainMod .. " + SPACE", hl.dsp.exec_cmd("ags toggle dashboard"))
hl.bind(mainMod .. " + 0", hl.dsp.exec_cmd("flameshot gui"))
hl.bind(mainMod .. " + B", hl.dsp.exec_cmd("flatpak run io.github.TheWisker.Cavasik"))

-- Toggle floating as a centered 1920x1080 window
hl.bind(mainMod .. " + C", function()
	hl.dispatch(hl.dsp.window.float({ action = "toggle" }))
	hl.dispatch(hl.dsp.window.resize({ x = 1920, y = 1080 }))
	hl.dispatch(hl.dsp.window.move({ x = 960, y = 540 }))
end)

-- Toggle tiled windows between full height and a centered 1080px band (was height.sh).
-- Band mode also caps a lone window at one column width instead of full width.
hl.bind(mainMod .. " + G", function()
	local band = hl.get_config("general.gaps_out").top ~= gapsBand.top
	hl.config({
		general = { gaps_out = band and gapsBand or gapsFull },
		scrolling = { fullscreen_on_one_column = not band },
	})
	notify(9103, "hypr-height", band and "Height: 1080 band" or "Height: full")
end)

--------------------------------
---- WINDOWS AND WORKSPACES ----
--------------------------------

-- See https://wiki.hypr.land/configuring/core/rules/

-- Terminals launched with "kitty --class floating-term ..." (dashboard
-- shortcuts) open as a regular floating window instead of a full-screen column
hl.window_rule({
	name = "floating-term",
	match = { class = "floating-term" },

	float = true,
	size = "1600 1000",
	center = true,
})

-- Dashboard blur: requested by AGS itself (backdrop-filter on .backdrop in
-- ags/style.scss, via the background-effect protocol), so no layer rule here.
-- Strength comes from decoration.blur above.
