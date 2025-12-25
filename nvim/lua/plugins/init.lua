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
local avante = require("plugins.avante")
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
	-- chatgpt,
	snacks,
	fzf,
	copilot,
	avante,
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
		lualine_z = { "filename" },
	},
})

local lspconfig = require("lspconfig")
lspconfig.ts_ls.setup({})

--lspconfig.emmet_language_server.setup({})

local builtin = require("telescope.builtin")
--vim.keymap.set('n', '<C-f', builtin.find_files, {})
--vim.keymap.set('n', '<C-g>', builtin.live_grep, {})
require("catppuccin").setup({ transparent_background = true })

vim.cmd.colorscheme("catppuccin")
--vim.cmd [[
--highlight Normal guibg=none
--highlight NonText guibg=none
--highlight Normal ctermbg=none
--highlight NonText ctermbg=none
--]]
vim.diagnostic.config({
	float = {
		border = "rounded",
	},
})

require("fzf-lua").setup({ "default" })
