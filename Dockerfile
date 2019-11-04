FROM node:8.16 as build

RUN npm install -g grunt

COPY console-frontend /console-frontend/

WORKDIR /console-frontend

RUN echo "{ \"name\": \"console-frontend\", \"version\": \"develop\" }" > package-version.json

RUN npm install

RUN grunt css

FROM nginx:alpine

COPY --from=build /console-frontend /usr/share/nginx/html/
