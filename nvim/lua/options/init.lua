vim.opt.swapfile = false

vim.opt.backspace = "2"
vim.opt.showcmd = true
vim.opt.laststatus = 2
vim.opt.autowrite = true
vim.opt.cursorline = false
vim.opt.autoread = true

-- use spaces for tabs and whatnot
vim.opt.tabstop = 2
vim.opt.shiftwidth = 2
vim.opt.shiftround = true
vim.opt.expandtab = true
vim.opt.fillchars = { eob = " " }
vim.api.nvim_set_hl(0, "LineNr", { fg = "#808080" })

-- vim.o.signcolumn = "yes:1"
vim.opt.signcolumn = "no"
