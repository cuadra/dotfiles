local opts = { noremap = true, silent = true}
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

keymap("n", "<leader>h", "0", opts)
keymap("n", "<leader>l", "$", opts)

-- Stay in indent mode
keymap("v", "h", "<gv^", opts)
keymap("v", "l", ">gv^", opts)

-- Move text up and down

keymap("n", "<S-j>", ":m '>+1<CR>gv=gv", opts)
keymap("n", "<S-k>", ":m '<-2<CR>gv=gv", opts)
keymap("v", "<S-j>", ":m '>+1<CR>gv=gv", opts)
keymap("v", "<S-k>", ":m '<-2<CR>gv=gv", opts)
keymap("x", "<S-j>", ":m '>+1<CR>gv=gv", opts)
keymap("x", "<S-k>", ":m '<-2<CR>gv=gv", opts)
-- keymap("x", "J", ":m '>+1<CR>gv=gv", opts)
-- keymap("x", "K", ":m '<-2<CR>gv=gv", opts)

-- Find and get ready to replace
keymap("n", "<leader>a", ":%s/", opts)

-- Telescope
keymap("n", "<leader>f", ":Telescope find_files<cr>", opts)
keymap("n", "<leader>g", ":Telescope live_grep<cr>", opts)


-- Oil
keymap('n', '-', ':edit .<cr>', opts)

keymap('n', 'de', 'd0', opts)
keymap('n', 'dr', 'd$', opts)

-- copy and pasting
-- yw to copy word
-- yy to copy line
-- p to paste
-- d to delete
-- dw to delete word
-- dd to delete line


