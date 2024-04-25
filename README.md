<h1>Deploy An API Server For An Airline</h1>
<b>1. Clone this repo</b>

Install Git in your system, and run:

```
git clone https://github.com/swqa7697/cs6650-backend.git
cd cs6650-backend
```

<b>2. Configure</b>

Before starting the server, there are several things to be prepared:

1. MongoDB Cluster: the cluster created on Atlas which is used by all api servers within the subsystem of an airline
2. AWS Cognito User Pool: the only user pool that is used by the entire system across all airlines
3. API Key of API Ninjas: also used by all airlines (only one key required) for determining airport and timezone
4. [Optional] List of Admin Users: fill the user subs (id used by Cognito) in the array to enable their permissions to add/update flights through API calls (You can get the user sub of yourself when creating your own account manually in the console of Cognito)

In the config file, provide the MongoDB connecting information, Cognito user pool ID, API Ninjas Key, and user subs of admin users. Also indicate the airline name and code. <b>Then, rename the config file to be 'config.json' and put it into the directory '/cs6650-backend/config'</b>

The correct config.json will be like:
```
{
  "airline": "Airline 1",
  "airlineCode": "AB",

  "mongodbConnectURI": "yourMongoDbConnectingString",
  "dbName": "YourDbName",

  "CognitoRegion": "region",
  "CognitoUserPoolId": "yourUserPoolId",
  "CognitoTokenUse": "access",
  "CognitoTokenExpiration": 8640000,

  "apiNinjasKey": "yourApiKey",

  "adminUsers": ["yourUserSub"]
}
```

<b>3. Install Dependencies</b>

Install Node.js in your system, and run the command under the directory '/cs6650-backend':

```
npm install
```

<b>4. Start Server</b>

```
npm start
```

<h2>Additional: Deploy The Load Balancer</h2>

One (or one cluster of) load balancer(s) is used for all api servers under the same subsystem/airline

<b>1. Install Nginx</b>

In an independent VM (idealy) or in any one of the api servers (for test/demo), install Nginx and start it by:

(For Ubuntu)
```
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

<b>2. Configure</b>

Go to the directory:

```
cd /etc/nginx/conf.d
```

Create a config file (for example 'load_balancing.conf') with the content of:

```
upstream backend {
  # Add all backend api servers of this airline below. All of them should call port 3000
  server backend1.example.com:3000;
  server backend2.example.com:3000;
  server backend3.example.com:3000;
  # ... More servers if exist ...
}

server {
  listen 80;
  location / {
    proxy_pass http://backend;
  }
}
```

Change the URLs like 'backend1.example.com' to be address of your api servers, and keep the ports to be 3000. If you are using EC2 deploying all the servers including load balancer under the same VPC, you can use the private IPv4 address instead of public address

<b>3. Reload Nginx</b>

Then, validate the config and reload Nginx by running:

```
sudo nginx -t
sudo systemctl reload nginx
```
