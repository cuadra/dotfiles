local opts = { noremap = true, silent = true }
local keymap = vim.api.nvim_set_keymap

-- Remap space as leader key
keymap("", "<Space>", "<Nop>", opts)
vim.g.mapleader = " "
vim.g.maplocalleader = " "

-- keymap("n", "<leader>e", ":Lex 30<cr>", opts)

-- Navigating buffers

keymap("n", "e", ":bprevious<cr>", opts)
keymap("n", "r", ":bnext<cr>", opts)

-- New Buffer
keymap("n", "<leader>n", ":enew<cr>", opts)

-- Writing and Exiting
keymap("n", "<leader>s", ":w<cr>", opts)
keymap("n", "<leader>w", ":bd<cr>", opts)

-- Navigating lines
-- Jump to the end and beginning of line
keymap("n", "<leader>h", "0", opts)
keymap("n", "<leader>l", "$", opts)

-- Stay in indent mode
keymap("v", "h", "<gv^", opts)
keymap("v", "l", ">gv^", opts)

-- Move text up and down

keymap("v", "<S-j>", ":m '>+1<CR>gv=gv", opts)
keymap("v", "<S-k>", ":m '<-2<CR>gv=gv", opts)

-- Find and get ready to replace
keymap("n", "<leader>a", ":%s/", opts)

-- FzfLua
--
keymap("n", "<leader>f", ":FzfLua files<cr>", opts)
-- keymap("n", "<leader>f", ":Telescope find_files<cr>", opts)
keymap("n", "<leader>g", ":FzfLua grep<cr>", opts)
keymap("n", "<leader>G", ":FzfLua git_branches<cr>", opts)
-- keymap("n", "<leader>g", ":Telescope live_grep<cr>", opts)
keymap("n", "<leader>b", ":FzfLua buffers<cr>", opts) -- List all buffers

-- Quick Quit
keymap("n", "<leader>q", ":q<cr>", opts)
keymap("n", "<leader>Q", ":q!<cr>", opts)

-- Oil
-- Start browsing
keymap("n", "-", ":edit .<cr>", opts)

-- keymap("n", "de", "d0", opts)
-- keymap("n", "dr", "d$", opts)

-- keymap('n', '<leader>x', ':cope<cr>', opts)
keymap("n", "<leader>xx", ":ccl<cr>", opts)
keymap("n", "<leader>x", ":lua vim.diagnostic.setqflist()<cr>", opts)

-- keymap('n', '<leader>j', '<C-w>j', opts)
-- keymap('n', '<leader>k', '<C-w>k', opts)

-- keymap('n', '<leader>e', ':lua vim.diagnostic.open_float()<cr>', opts)

-- Cycle through Diagnostics (Errors and Warnings)
keymap("n", "E", ":lua vim.diagnostic.goto_prev()<cr>", opts)
keymap("n", "R", ":lua vim.diagnostic.goto_next()<cr>", opts)
-- vim.api.nvim_create_autocmd('DiagnosticChanged', {
-- group = vim.api.nvim_create_augroup('diagnostic', { clear = true }),
-- callback = function()
-- vim.diagnostic.setqflist()
-- end,
-- })

-- Enabling and Disabling Indent Guides
keymap("n", "<leader>i", ":lua Snacks.indent.enable()<cr>", opts)
keymap("n", "<leader>I", ":lua Snacks.indent.disable()<cr>", opts)

-- Copy and Pasting with the Clipboard
-- System clipboard (wl-clipboard).
-- Plain yanks (y, yy, V+y) also go to the clipboard; deletes (d, x, c) stay inside nvim.
-- <leader>p / <leader>P paste text copied in other apps.
local map = vim.keymap.set
map({ "n", "x" }, "<leader>p", '"+p', { silent = true, desc = "Paste clipboard after" }) -- visual: replace selection
map({ "n", "x" }, "<leader>P", '"+P', { silent = true, desc = "Paste clipboard before" })

local clip_group = vim.api.nvim_create_augroup("yank_to_clipboard", { clear = true })
-- Last text nvim and the clipboard agreed on, so we only pull in *new* copies.
local last_clip = nil

vim.api.nvim_create_autocmd("TextYankPost", {
  group = clip_group,
  callback = function()
    local ev = vim.v.event
    -- Only plain yanks into the default register (skip "ay etc. and deletes).
    if ev.operator ~= "y" or ev.regname ~= "" then
      return
    end
    local text = table.concat(ev.regcontents, "\n")
    local regtype = ev.regtype
    -- Whole-line yanks: drop the trailing newline so pasting elsewhere
    -- doesn't add a line break (or run the line in a terminal).
    if regtype == "V" then
      regtype = "v"
    end
    last_clip = text
    vim.schedule(function()
      vim.fn.setreg("+", text, regtype)
    end)
  end,
})

-- Coming back to nvim: if something new was copied in another app,
-- put it in the default register so plain p pastes it.
vim.api.nvim_create_autocmd("FocusGained", {
  group = clip_group,
  callback = function()
    local ok, text = pcall(vim.fn.getreg, "+")
    if not ok or text == "" or text == last_clip then
      return
    end
    last_clip = text
    vim.fn.setreg('"', text, vim.fn.getregtype("+"))
  end,
})

-- copy and pasting
-- yw to copy word
-- yy to copy line
-- p to paste
-- d to delete
-- dw to delete word
-- dd to delete line
-- gg to jump to the beginning of the file
-- G to jump to the end of the file
-- nP to paste from registers

-- ChatGPT Shortcuts
-- keymap("n", "<leader>r", ":ChatGPTRun optimize_code<cr>", opts)
-- keymap("n", "<leader>R", ":ChatGPTRun fix_bugs<cr>", opts)
-- keymap("n", "<leader>c", ":ChatGPTEditWithInstructions<cr>", opts)
-- keymap("v", "<leader>c", ":ChatGPTEditWithInstructions<cr>", opts)
-- keymap("n", "<leader>C", ":ChatGPT<cr>", opts)

-- Clear search highlights
keymap("n", "<leader>?", ":nohlsearch<cr>", opts)
-- Avante Shortcuts
