# Use the official Golang image to create a build artifact.
# This is a multi-stage Dockerfile, which helps to keep the final image small.
FROM golang:1.19-alpine AS builder

# Set the working directory inside the container.
WORKDIR /app

# Copy go.mod and go.sum files to download dependencies.
COPY go.mod go.sum ./

# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed.
RUN go mod download

# Copy the source code into the container.
COPY . .

# Build the Go app.
# -o api will output the executable named 'api'.
# CGO_ENABLED=0 is used to build a statically linked executable.
RUN CGO_ENABLED=0 go build -o api .

# Start a new stage from scratch for a smaller final image.
FROM alpine:latest

WORKDIR /root/

# Copy the pre-built binary from the previous stage.
COPY --from=builder /app/api .

# Expose port 8080 to the outside world.
EXPOSE 8080

# Command to run the executable.
CMD ["./api"]
