return {
	"milanglacier/minuet-ai.nvim",
	event = "InsertEnter",
	dependencies = {
		"nvim-lua/plenary.nvim",
	},
	config = function()
		require("minuet").setup({
			blink = {
				enable_auto_complete = true,
			},
			provider = "openai_compatible",

			provider_options = {
				openai_compatible = {
					name = "LM Studio",
					end_point = "http://192.168.20.2:1234/v1/chat/completions",
					api_key = "lm-studio",
					model = "qwen/qwen3.5-9b",
					stream = true,
				},
			},
		})
	end,
}
