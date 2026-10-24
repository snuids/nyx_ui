FROM node:22-bullseye AS base

FROM base AS builder
COPY package.json package-lock.json /etc/build/
WORKDIR /etc/build
RUN npm ci
COPY . /etc/build
RUN npm run build


FROM base
WORKDIR /etc/opt
RUN echo '{"name":"nyx_ui_runtime","dependencies":{"express":"4.21.2"}}' > package.json
RUN npm install --production
COPY --from=builder /etc/build/dist /etc/opt/nyx_ui
COPY ./start.sh /etc/opt/start.sh
COPY ./app.js /etc/opt/app.js
CMD /etc/opt/start.sh