FROM node:18.20.8-bullseye as base
#FROM node:12.13.1-slim as base

FROM base as builder
COPY . /etc/build
WORKDIR /etc/build
RUN npm install -g yarn
RUN yarn install
RUN yarn run build


FROM base
WORKDIR /etc/opt
RUN echo '{"name":"nyx_ui_runtime","dependencies":{"express":"4.21.2"}}' > package.json
RUN npm install --production
COPY --from=builder /etc/build/dist /etc/opt/nyx_ui
COPY ./start.sh /etc/opt/start.sh
COPY ./app.js /etc/opt/app.js
CMD /etc/opt/start.sh