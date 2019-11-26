FROM node:12.13.1-slim as base

FROM base as builder
RUN npm i express
COPY . /etc/build
WORKDIR /etc/build
RUN npm i
RUN npm run build

FROM builder
RUN mv ./dist /etc/opt/nyx_ui
COPY ./start.sh /etc/opt/start.sh
COPY ./app.js /etc/opt/app.js
RUN rm -d -r /etc/build
CMD /etc/opt/start.sh
