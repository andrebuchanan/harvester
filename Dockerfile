FROM rogerano/redis
MAINTAINER Andre Buchanan
EXPOSE 6379:6379
ENTRYPOINT ["/usr/bin/redis-server"]
