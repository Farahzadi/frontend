
FROM node:14
USER root
WORKDIR /landing


COPY . .
RUN yarn

RUN chmod +x run.sh
EXPOSE 3001