# build environment
FROM node:16.17.0 

WORKDIR /app
COPY . .
RUN yarn
RUN export NODE_OPTIONS=--max_old_space_size=8192
RUN yarn build

EXPOSE 3000