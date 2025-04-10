return {
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
		},
	},
}
