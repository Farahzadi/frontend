# build environment
FROM node:alpine as build
WORKDIR /app
COPY . .
RUN yarn
RUN yarn build

EXPOSE 3000
RUN chmod +x nginx.sh
RUN chmod +x robot.sh