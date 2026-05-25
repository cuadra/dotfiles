return {
	"ai_helper",
	virtual = true,
	dir = vim.fn.stdpath("config"),
	config = function()
		local lm_studio_url = "http://192.168.20.2:1234/v1/chat/completions"

		local function perform_ai_request()
			local mode = vim.api.nvim_get_mode().mode
			local is_visual = mode:match("[vV]")
			local buf = vim.api.nvim_get_current_buf()
			local start_row, end_row

			if is_visual then
				-- Get the visual selection range
				-- We need to exit visual mode briefly to ensure marks are updated
				vim.api.nvim_feedkeys(vim.api.nvim_replace_termcodes("<Esc>", true, false, true), "x", true)
				-- schedule the rest to run after marks are updated
				vim.schedule(function()
					start_row = vim.api.nvim_buf_get_mark(buf, "<")[1]
					end_row = vim.api.nvim_buf_get_mark(buf, ">")[1]
					if start_row > end_row then
						start_row, end_row = end_row, start_row
					end
					M_perform(buf, start_row, end_row)
				end)
			else
				start_row = vim.api.nvim_win_get_cursor(0)[1]
				end_row = start_row
				M_perform(buf, start_row, end_row)
			end
		end

		function M_perform(buf, start_row, end_row)
			local lines = vim.api.nvim_buf_get_lines(buf, start_row - 1, end_row, false)
			local full_text = table.concat(lines, "\n")

			-- Look for @ai in the entire block
			local prompt_line_idx = nil
			local cleaned_prompt = ""

			for i, line in ipairs(lines) do
				if string.find(line, "@ai") then
					prompt_line_idx = i
					cleaned_prompt = vim.trim(string.gsub(line, "@ai", ""))
					break
				end
			end

			if not prompt_line_idx then
				print("No @ai trigger found in selection.")
				return
			end

			local context_code = table.concat(lines, "\n")
			local frames = { "⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏" }
			local frame_idx = 1
			local timer = vim.loop.new_timer()
			local ns = vim.api.nvim_create_namespace("ai_helper_anim")
			local extmark_id = vim.api.nvim_buf_set_extmark(buf, ns, start_row - 1, 0, {})

			-- Start animation using virtual text so it doesn't pollute undo history
			timer:start(
				0,
				100,
				vim.schedule_wrap(function()
					if vim.api.nvim_buf_is_valid(buf) then
						local frame = frames[frame_idx]
						vim.api.nvim_buf_set_extmark(buf, ns, start_row - 1, 0, {
							id = extmark_id,
							virt_lines = { { { frame .. " AI is thinking...", "Comment" } } },
							virt_lines_above = true,
						})
						frame_idx = (frame_idx % #frames) + 1
					end
				end)
			)

			local function stop_animation()
				if timer:is_active() then
					timer:stop()
				end
				if not timer:is_closing() then
					timer:close()
				end
				if vim.api.nvim_buf_is_valid(buf) then
					vim.api.nvim_buf_del_extmark(buf, ns, extmark_id)
				end
			end

			local payload = vim.fn.json_encode({
				model = "qwen/qwen3.5-9b",
				messages = {
					{
						role = "system",
						content = "Provide ONLY the raw code or direct answer. Do not use markdown backticks. No talk, just code.",
					},
					{
						role = "user",
						content = "Instructions: " .. cleaned_prompt .. "\n\nContext Code:\n" .. context_code,
					},
				},
				temperature = 0.1,
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
					stop_animation()

					if obj.code ~= 0 then
						print("AI request failed: " .. (obj.stderr or "check connection"))
						return
					end

					local success, response_data = pcall(vim.fn.json_decode, obj.stdout)
					if success and response_data.choices and response_data.choices[1] then
						local ai_response = response_data.choices[1].message.content

						-- Strip markdown code blocks if they exist
						local code_content = ai_response:match("```%w*\n?(.*)```")
						ai_response = code_content and vim.trim(code_content) or vim.trim(ai_response)

						local response_lines = vim.split(ai_response, "\n")
						-- Replace the original text with the response exactly once
						vim.api.nvim_buf_set_lines(buf, start_row - 1, end_row, false, response_lines)
					else
						print("AI response failed to parse or no choices returned.")
					end
				end)
			end)
		end

		vim.keymap.set({ "n", "v" }, "<leader>t", perform_ai_request, { desc = "Trigger AI Helper" })
	end,
}
