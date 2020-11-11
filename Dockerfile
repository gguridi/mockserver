FROM node:12.19.0-alpine3.12

ENV SERVER_FOLDER=/opt/mockserver

EXPOSE 80

RUN mkdir -p ${SERVER_FOLDER}
COPY . ${SERVER_FOLDER}
WORKDIR ${SERVER_FOLDER}

RUN yarn install
RUN yarn build

ENTRYPOINT ["yarn", "docker-start"]
