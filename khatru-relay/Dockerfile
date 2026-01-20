FROM golang:1.24-alpine

# Build tools are required for downloading from GitHub and compiling C-dependencies
RUN apk add --no-cache git gcc musl-dev

WORKDIR /app

# 1. Force-initialize the module with a name
# This ensures go.mod is NOT empty even if the file on your host is
RUN go mod init audiozap-relay || true

# 2. Add the specific dependencies
# We use 'go get' to specifically add them to the now-initialized go.mod
RUN go get github.com/fiatjaf/khatru@latest
RUN go get github.com/nbd-wtf/go-nostr@latest

# 3. Copy your actual main.go code
COPY . .

# 4. Tidy will fill in any missing indirect dependencies and clean the file
RUN go mod tidy

# 5. Build the binary
RUN go build -o relay main.go

CMD ["./relay"]