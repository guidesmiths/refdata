FROM mhart/alpine-node:6

WORKDIR /opt
ENV NODE_ENV production

# npm-shrinkwrap.json and package.json are used to bust the cache
COPY npm-shrinkwrap.json /opt/npm-shrinkwrap.json
COPY package.json /opt/package.json

RUN NODE_ENV=development npm install && npm cache clean

COPY ./ /opt/

CMD [ "node", "index.js" ]
