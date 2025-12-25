#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

alias ls='ls --color=auto'
alias grep='grep --color=auto'
alias nv='nvim'
alias F='nvim $(fzf --preview="cat {}")'


PS1='[\u@\h \W]\$ '

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion


[ -s "$HOME/.secrets/avante.sh" ] && \. "$HOME/.secrets/avante.sh"  # This loads nvm


eval "$(starship init bash)"
# neofetch

eval "$(fzf --bash)"

eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"

# bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"


export EDITOR=nvim
export VISUAL=nvim
