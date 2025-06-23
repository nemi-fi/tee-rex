FROM ubuntu:24.04

# system dependencies
RUN apt update && apt install -y curl git build-essential libc++-dev python3 && rm -rf /var/lib/apt/lists/*

# node.js
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

# bb
RUN curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/master/barretenberg/bbup/install | bash && . ~/.bashrc && bbup -v 0.87.2

WORKDIR /app

# Copy source code
COPY . .

RUN pnpm install --frozen-lockfile

# Expose port (adjust if your app uses a different port)
EXPOSE 80
ENV PORT=80

# Start the application
WORKDIR /app/server
CMD ["pnpm", "start"]
