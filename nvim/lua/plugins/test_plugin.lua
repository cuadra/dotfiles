local group = vim.api.nvim_create_augroup("LLMRequestPlugin", { clear = true })
local lm_studio_url = "http://192.168.20.2:1234/v1/chat/completions"

local function perform_ai_request()
	local current_row = vim.api.nvim_win_get_cursor(0)[1]
	local current_line_text = vim.api.nvim_buf_get_lines(0, current_row - 1, current_row, false)[1]

	if not current_line_text or not string.find(current_line_text, "@ai") then
		print("No @ai trigger found.")
		return
	end

	local cleaned_prompt = vim.trim(string.gsub(current_line_text, "@ai", ""))
	print("Requesting...")

	local payload = vim.fn.json_encode({
		model = "qwen/qwen3.5-9b",
		messages = {
			{
				role = "system",
				content = "Provide ONLY the raw code or direct answer. Do not use markdown backticks. No talk, just code.",
			},
			{ role = "user", content = cleaned_prompt },
		},
		temperature = 0.1, -- Low temperature for high precision
	})

	local cmd = {
		"curl",
		"-s",
		"-X",
		"POST",
		lm_studio_url,
		"-H",
		"Content-Type: application/json",
		"-d",
		payload,
	}

	vim.system(cmd, { text = true }, function(obj)
		vim.schedule(function()
			if obj.code ~= 0 then
				return
			end

			local success, response_data = pcall(vim.fn.json_decode, obj.stdout)
			if success and response_data.choices and response_data.choices[1] then
				local ai_response = response_data.choices[1].message.content

				-- BAREBONES LOGIC: Strip markdown code blocks if they exist
				-- This regex looks for ```language ... ``` and captures only the '...'
				local code_content = ai_response:match("```%w*\n?(.*)```")
				if code_content then
					ai_response = vim.trim(code_content)
				else
					ai_response = vim.trim(ai_response)
				end

				local response_lines = vim.split(ai_response, "\n")
				vim.api.nvim_buf_set_lines(0, current_row - 1, current_row, false, response_lines)
				print("Code inserted.")
			end
		end)
	end)
end

vim.keymap.set("n", "<leader>t", perform_ai_request, { desc = "Trigger AI on current line" })
