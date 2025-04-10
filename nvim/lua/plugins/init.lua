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
local chatgpt = require("plugins.chatgpt")
local snacks = require("plugins.snacks")
local fzf = require("plugins.fzf")
local copilot = require("plugins.copilot")

local plugins = {
	conform,
	luarocks,
	noice,
	blink,
	mason,
	oil,
	telescope,
	lualine,
	chatgpt,
	snacks,
	fzf,
	copilot,
	{ "catppuccin/nvim", name = "catppuccin", priority = 1000 },
}
--require('oil').setup()

require("lazy").setup(plugins, {})
require("mason").setup()
require("mason-lspconfig").setup({
	-- ensure_installed={'ts_ls'}
})
require("lualine").setup({
	-- options = { theme = "horizon" },
})

local lspconfig = require("lspconfig")
lspconfig.ts_ls.setup({})

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

require("chatgpt").setup({
	api_key_cmd = "gpg --decrypt " .. vim.fn.expand("~") .. "/.secrets/cgpt.txt.gpg",
	welcome_message = "What are we working on today?",
	chat_input_placeholder = "Let's get started...",
	max_response_length = 500, -- maximum response length
})

require("fzf-lua").setup({ "default" })
