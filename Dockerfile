FROM node:16-alpine3.16

ENV SERVER_FOLDER=/opt/mockserver

EXPOSE 80

RUN mkdir -p ${SERVER_FOLDER}
COPY . ${SERVER_FOLDER}
WORKDIR ${SERVER_FOLDER}

RUN yarn install --prod
RUN yarn build

ENTRYPOINT ["yarn", "docker-start"]
