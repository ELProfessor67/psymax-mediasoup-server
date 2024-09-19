FROM node
RUN apt-get update && \
   apt-get install -y build-essential pip net-tools iputils-ping iproute2 curl

WORKDIR /app/mediasoup-server
COPY . /app/mediasoup-server/

RUN npm install
RUN npm run build

ENV PORT=4000

EXPOSE 4000
EXPOSE 2000-2020
EXPOSE 10000-10100

CMD [ "npm","run","start" ]