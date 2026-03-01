vim.wo.relativenumber = true
vim.wo.number = true

local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
	vim.fn.system({
		"git",
		"clone",
		"--filter=blob:none",
		"https://github.com/folke/lazy.nvim.git",
		"--branch=stable", -- latest stable release
		lazypath,
	})
end
vim.opt.rtp:prepend(lazypath)

local mason = require("plugins.mason")
local conform = require("plugins.conform")
local luarocks = require("plugins.luarocks")
local noice = require("plugins.noice")
local blink = require("plugins.blink")
local oil = require("plugins.oil")
local telescope = require("plugins.telescope")
local lualine = require("plugins.lualine")
-- local chatgpt = require("plugins.chatgpt")
local snacks = require("plugins.snacks")
local fzf = require("plugins.fzf")
local copilot = require("plugins.copilot")
-- local avante = require("plugins.avante")
local neoscroll = require("plugins.neoscroll")
local plugins = {
	{ "catppuccin/nvim", name = "catppuccin", priority = 1000 },
	conform,
	luarocks,
	noice,
	blink,
	mason,
	oil,
	telescope,
	lualine,
	snacks,
	fzf,
	copilot,
	-- chatgpt,
	--avante,
	neoscroll,
}
--require('oil').setup()

require("lazy").setup(plugins, {})
require("mason").setup()

require("mason-lspconfig").setup({
	-- ensure_installed={'ts_ls'}
})

local mode_map = {
	["NORMAL"] = "N",
	["O-PENDING"] = "N?",
	["INSERT"] = "I",
	["VISUAL"] = "V",
	["V-BLOCK"] = "VB",
	["V-LINE"] = "VL",
	["V-REPLACE"] = "VR",
	["REPLACE"] = "R",
	["COMMAND"] = "!",
	["SHELL"] = "SH",
	["TERMINAL"] = "T",
	["EX"] = "X",
	["S-BLOCK"] = "SB",
	["S-LINE"] = "SL",
	["SELECT"] = "S",
	["CONFIRM"] = "Y?",
	["MORE"] = "M",
}
require("lualine").setup({
	sections = {
		lualine_a = { {
			"mode",
			fmt = function(s)
				return mode_map[s] or s
			end,
		} },
		lualine_b = { "branch" },
		lualine_c = {},
		lualine_x = { { "filetype", icon_only = true, icon = { align = "right" } } },
		lualine_y = { "diagnostics" },
		lualine_z = {
			"filename",
		},
	},
})

--local lspconfig = require("lspconfig")
-- lspconfig.ts_ls.setup({})
vim.lsp.config("ts_ls", {
	flags = { debounce_text_changes = 300 },
})
vim.lsp.enable({ "ts_ls" })

--lspconfig.emmet_language_server.setup({})

local builtin = require("telescope.builtin")
--vim.keymap.set('n', '<C-f', builtin.find_files, {})
--vim.keymap.set('n', '<C-g>', builtin.live_grep, {})
require("catppuccin").setup({
	transparent_background = true,
})

vim.cmd.colorscheme("catppuccin")
--vim.cmd [[
--highlight Normal guibg=none
--highlight NonText guibg=none
--highlight Normal ctermbg=none
--highlight NonText ctermbg=none
--]]

require("fzf-lua").setup({ "default" })

-- Minimal, clean diagnostic styling (no borders, no backgrounds)

local icons = {
	[vim.diagnostic.severity.ERROR] = " ",
	[vim.diagnostic.severity.WARN] = " ",
	[vim.diagnostic.severity.INFO] = " ",
	[vim.diagnostic.severity.HINT] = "󰌵 ",
}

-- Configure diagnostic float
vim.diagnostic.config({
	virtual_text = false,
	underline = true,
	severity_sort = true,
	float = {
		border = "rounded",
		header = "",
		source = false,
		prefix = "",
		focusable = false,
		format = function(d)
			local msg = (d.message or ""):gsub("^%s+", ""):gsub("%s+$", ""):gsub("%s*%[%d+%]%s*$", "") -- remove trailing [7016]

			return (icons[d.severity] or "") .. msg
		end,
	},
})

-- Apply colors (no background, just foreground + undercurl)
local function diagnostic_colors()
	-- transparent float container
	vim.api.nvim_set_hl(0, "NormalFloat", { bg = "none" })
	vim.api.nvim_set_hl(0, "FloatBorder", { bg = "none", fg = "none" })
	vim.api.nvim_set_hl(0, "FloatTitle", { bg = "none", fg = "none" })

	-- severity text colors
	vim.api.nvim_set_hl(0, "DiagnosticFloatingError", { fg = "#ff6b6b", bg = "none" })
	vim.api.nvim_set_hl(0, "DiagnosticFloatingWarn", { fg = "#f6c177", bg = "none" })
	vim.api.nvim_set_hl(0, "DiagnosticFloatingInfo", { fg = "#7aa2f7", bg = "none" })
	vim.api.nvim_set_hl(0, "DiagnosticFloatingHint", { fg = "#9ece6a", bg = "none" })

	-- matching sign column icons
	vim.fn.sign_define("DiagnosticSignError", { text = " ", texthl = "DiagnosticSignError" })
	vim.fn.sign_define("DiagnosticSignWarn", { text = " ", texthl = "DiagnosticSignWarn" })
	vim.fn.sign_define("DiagnosticSignInfo", { text = " ", texthl = "DiagnosticSignInfo" })
	vim.fn.sign_define("DiagnosticSignHint", { text = "󰌵 ", texthl = "DiagnosticSignHint" })

	-- undercurl styling
	vim.api.nvim_set_hl(0, "DiagnosticUnderlineError", { undercurl = true, sp = "#ff6b6b" })
	vim.api.nvim_set_hl(0, "DiagnosticUnderlineWarn", { undercurl = true, sp = "#f6c177" })
	vim.api.nvim_set_hl(0, "DiagnosticUnderlineInfo", { undercurl = true, sp = "#7aa2f7" })
	vim.api.nvim_set_hl(0, "DiagnosticUnderlineHint", { undercurl = true, sp = "#9ece6a" })
end

diagnostic_colors()
vim.api.nvim_create_autocmd("ColorScheme", { callback = diagnostic_colors })
vim.o.winborder = "rounded"
vim.api.nvim_set_hl(0, "FloatBorder", { fg = "#cba6f7", bg = "none" }) -- Catppuccin Mauve

require("neoscroll").setup({
	mappings = { -- Keys to be mapped to their corresponding default scrolling animation
		"<C-u>",
		"<C-d>",
		"<C-b>",
		"<C-f>",
		"<C-y>",
		"<C-e>",
		"zt",
		"zz",
		"zb",
	},
	hide_cursor = true, -- Hide cursor while scrolling
	stop_eof = true, -- Stop at <EOF> when scrolling downwards
	respect_scrolloff = false, -- Stop scrolling when the cursor reaches the scrolloff margin of the file
	cursor_scrolls_alone = true, -- The cursor will keep on scrolling even if the window cannot scroll further
	duration_multiplier = 1.0, -- Global duration multiplier
	easing = "linear", -- Default easing function
	pre_hook = nil, -- Function to run before the scrolling animation starts
	post_hook = nil, -- Function to run after the scrolling animation ends
	performance_mode = false, -- Disable "Performance Mode" on all buffers.
	ignored_events = { -- Events ignored while scrolling
		"WinScrolled",
		"CursorMoved",
	},
})
