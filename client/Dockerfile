# Remove named builder when you want to publish to AWS
# Declare builder phase
FROM node:alpine as builder
WORKDIR "/app"
COPY package.json .
RUN yarn install
COPY . .
RUN yarn build

FROM nginx
EXPOSE 3000

# Copy from builder stage to build folder
# Replace builder with 0 when publishing AWS
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# To build: docker build -t web-prod
# To run the image: docker run -it -p 8080:80 web-prod