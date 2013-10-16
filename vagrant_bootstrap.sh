#!/usr/bin/env bash

export NVM_DIR=/home/vagrant/nvm
apt-get update
apt-get install -y git curl
git clone https://github.com/creationix/nvm
. ./nvm/nvm.sh
nvm install 0.10
nvm alias default 0.10
cd /vagrant
npm install --global --no-bin-links
cd /home/vagrant/nvm/`node --version`/lib/node_modules/harvester
. ./handler
