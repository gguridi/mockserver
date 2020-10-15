FROM node:alpine

ENV SERVER_FOLDER=/opt/mockserver

EXPOSE 80

RUN mkdir -p ${SERVER_FOLDER}
COPY . ${SERVER_FOLDER}
WORKDIR ${SERVER_FOLDER}

RUN yarn install
RUN yarn test
RUN yarn build

ENTRYPOINT ["yarn", "docker-start"]
