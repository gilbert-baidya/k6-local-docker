docker-k6-grafana-influxdb
Demonstrates how to run load tests with containerised instances of K6, Grafana and InfluxDB.

To Run Project
docker compose up -d influxdb grafana chronograf

docker compose exec k6 k6 run /SRC/k6-Demo.js
docker-compose run k6 run /SRC/k6-Demo.js
docker compose run --rm k6 run /SRC/k6-Demo.js
docker compose run --rm k6 run /SRC/k6-Demo-scripts.js
docker compose run --rm k6 run /SRC/basic-test.js
docker compose run --rm k6 run -e TARGET_VUS=50 /SRC/k6-Demo.js


Grafana Url http://localhost:3000/

Influx DB Url http://localhost:8888/

Dashboards
The dashboard in /dashboards is adapted from the excellent K6 / Grafana dashboard here: https://grafana.com/grafana/dashboards/2587

There are only two small modifications:

the data source is configured to use the docker created InfluxDB data source
the time period is set to now-15m, which I feel is a better view for most tests
Scripts
The script here is an example of a low Virtual User (VU) load test of the excellent API: 'https://jsonplaceholder.typicode.com/posts'
# k6-local-docker
