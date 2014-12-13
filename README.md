# InfluxDB Analytics Tools
A collection of tools for monitoring services and reporting stats to InfluxDB. These are simplified to provide an easy example of usage.

# Overview
This repository contains a collection of scripts to aide in getting data into InfluxDB. You will need to specify your InfluxDB settings by editing the configuration in `conf/config.js`.

![grafana](https://vasir-assets.s3.amazonaws.com/influxanalytics/grafana-warroom.png)

I use [grafana](http://grafana.org/) to display data in InfluxDB. It allows me to keep an eye not just on the health of my servers, but also on in app activity and the effectiveness of product design choices (e.g., how many users are performing a certain action, or how many users in a certain area are getting push notifications?)

# Analytics - Track
The core functionality is in `lib/analytics.js`, which exposes a `track` function. This takes in arbitrary object and transforms it into a format InfluxDB can consume. This is the function to call anytime you wish to track anything. 

# Example Server Scripts
This repository also provides a few sample scripts for sending service data to InfluxDB. The server scripts will launch a server that continually pings a service for various stats (system, usage, etc. stats) and reports them to influx. Ideally, you would run these behind something like Monit.

`server-mongo.js` : Server which pings mongo for various stats and reports them

`server-rabbitmq.js` : Server which pings RabbitMQ for stats and reports them

# Configuration
Configuration settings can be found in `conf/config.js`. Ideally, something like [nconf](https://github.com/flatiron/nconf), or whatever your app configuration workflow is liked, can be used to handle configuration.
