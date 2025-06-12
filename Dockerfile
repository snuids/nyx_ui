FROM node:12.13.1-slim as base
#FROM 18.20.8-bullseye as base

FROM base as builder
RUN npm i express@4.21.2
COPY . /etc/build
WORKDIR /etc/build
RUN npm install -g yarn
RUN yarn install
RUN yarn run build


FROM builder
RUN mv ./dist /etc/opt/nyx_ui
COPY ./start.sh /etc/opt/start.sh
COPY ./app.js /etc/opt/app.js
RUN rm -d -r /etc/build
CMD /etc/opt/start.sh