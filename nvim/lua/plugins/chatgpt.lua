return {
	{
		"jackMort/ChatGPT.nvim",
		event = "VeryLazy",
		config = function()
			require("chatgpt").setup({
				api_key_cmd = "gpg --decrypt " .. vim.fn.expand("~") .. "/.secrets/cgpt.txt.gpg",
				welcome_message = "What are we working on today?",
				chat_input_placeholder = "Let's get started...",
				max_response_length = 500, -- maximum response length
			})
		end,
		dependencies = {
			"MunifTanjim/nui.nvim",
			"nvim-lua/plenary.nvim",
			"folke/noice.nvim", -- Optional dependency for chat history
			"nvim-telescope/telescope.nvim", -- Optional dependency for searching conversations
		},
	},
}
