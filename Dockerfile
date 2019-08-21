FROM node:7.7
RUN npm i express
COPY ./start.sh /etc/opt/start.sh
COPY ./app.js /etc/opt/app.js
COPY ./dist /etc/opt/nyx_ui
RUN ls -l /etc/opt/
CMD /etc/opt/start.sh
