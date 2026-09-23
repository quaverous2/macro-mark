FROM node:22.23.2-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends git less sudo \
    && rm -rf /var/lib/apt/lists/*

RUN npm install --global npm@12.1.0

RUN echo "node ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

ENV DEVCONTAINER=true
