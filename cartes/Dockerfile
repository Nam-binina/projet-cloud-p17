FROM overv/openstreetmap-tile-server:1.4.0

COPY madagascar-latest.osm.pbf /import.osm.pbf

RUN /usr/local/bin/import

EXPOSE 80