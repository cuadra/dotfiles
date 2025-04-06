
vim.wo.relativenumber = true
vim.wo.number = true

local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({
    "git",
    "clone","--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable", -- latest stable release
    lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)
local plugins = {
  { 'github/copilot.vim'}, 
  { "stevearc/conform.nvim",
  event = { "BufReadPre", "BufNewFile" },
  config = function()
    local conform = require("conform")

    conform.setup({
      formatters_by_ft = {
        javascript = { "prettier" },
        typescript = { "prettier" },
        javascriptreact = { "prettier" },
        typescriptreact = { "prettier" },
        css = { "prettier" },
        html = { "prettier" },
        json = { "prettier" },
        yaml = { "prettier" },
        markdown = { "prettier" },
        graphql = { "prettier" },
        lua = { "stylua" },
      },
      format_on_save = {
        lsp_fallback = true,
        async = false,
        timeout_ms = 500,
      },
    })

    vim.keymap.set({ "n", "v" }, "<leader>#", function()
      conform.format({
        lsp_fallback = true,
        async = false,
        timeout_ms = 500,
      })
    end, { desc = "Format file or range (in visual mode)" })
  end,
},
  {
  "folke/noice.nvim",
  event = "VeryLazy",
  opts = {
    -- add any options here
  },
  dependencies = {
    -- if you lazy-load any plugin below, make sure to add proper `module="..."` entries
    "MunifTanjim/nui.nvim",
    -- OPTIONAL:
    --   `nvim-notify` is only needed, if you want to use the notification view.
    --   If not available, we use `mini` as the fallback
    --   "rcarriga/nvim-notify",
    }
},
  {
  'stevearc/oil.nvim',
  ---@module 'oil'
  ---@type oil.SetupOpts
  opts = {},
  -- Optional dependencies
  dependencies = {{'echasnovski/mini.icons', opts = {} }}
},
{
  'williamboman/mason.nvim',
  'williamboman/mason-lspconfig.nvim',
  'neovim/nvim-lspconfig'
},
{ "catppuccin/nvim", name = "catppuccin", priority = 1000 },
{
	'nvim-telescope/telescope.nvim', tag = '0.1.8',
	dependencies = { 'nvim-lua/plenary.nvim' }
},
{
'nvim-lualine/lualine.nvim',
    dependencies = { 'nvim-tree/nvim-web-devicons' }
},
{
  "jackMort/ChatGPT.nvim",
  event = "VeryLazy",
  config = function()
    require("chatgpt").setup()
  end,
  dependencies = {
    "MunifTanjim/nui.nvim",
    "nvim-lua/plenary.nvim",
    "folke/noice.nvim", -- Optional dependency for chat history
    "nvim-telescope/telescope.nvim", -- Optional dependency for searching conversations
  }
},
{
  "folke/snacks.nvim",
  priority = 1000,
  lazy = false,
  ---@type snacks.config
  opts = {
    indent = { enabled = true},
    notifier = {
      enabled = true, -- enable notifications
      timeout = 1000, -- duration in ms
    },
  }
},
{
  "ibhagwan/fzf-lua",
  dependencies = { "nvim-tree/nvim-web-devicons"},
  opts = {}
}
}
local opts = {}
--require('oil').setup()
require('lazy').setup(plugins, opts)
require('mason').setup()
require('mason-lspconfig').setup({
  ensure_installed={'ts_ls'}
})
require("lualine").setup()

local lspconfig = require('lspconfig')
lspconfig.ts_ls.setup({})

local builtin = require("telescope.builtin")
--vim.keymap.set('n', '<C-f', builtin.find_files, {})
--vim.keymap.set('n', '<C-g>', builtin.live_grep, {})
require("catppuccin").setup({transparent_background = true})


vim.cmd.colorscheme "catppuccin"
--vim.cmd [[
  --highlight Normal guibg=none
  --highlight NonText guibg=none
  --highlight Normal ctermbg=none
  --highlight NonText ctermbg=none
--]]

local home = vim.fn.expand("~")
require("chatgpt").setup({
      api_key_cmd = "gpg --decrypt " .. home .. "/.secrets/cgpt.txt.gpg",
      welcome_message = "What are we working on today?",
      chat_input_placeholder = "Let's get started...",
      max_response_length = 500, -- maximum response length
});

require("fzf-lua").setup({'default'})
