
FROM node:14
USER root
WORKDIR /landing


COPY . .
RUN yarn

EXPOSE 3001

CMD ["yarn", "up"]