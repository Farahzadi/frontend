
FROM node:14
USER root
WORKDIR /landing


COPY . .
RUN yarn

RUN chmod +x run.sh
RUN chmod +x robot.sh
EXPOSE 3001