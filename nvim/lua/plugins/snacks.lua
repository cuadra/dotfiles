return {
	{
		"folke/snacks.nvim",
		priority = 1000,
		lazy = false,
		---@type snacks.config
		opts = {
			indent = {
				enabled = false,
				animate = {
					enabled = false,
				},
			},
			notifier = {
				enabled = true, -- enable notifications
				timeout = 1000, -- duration in ms
			},
		},
	},
}
