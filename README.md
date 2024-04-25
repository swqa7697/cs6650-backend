<h1>Deploy An API Server For An Airline</h1>

<h4>1. Clone this repo</h4>

Install Git in your system, and run:

```
git clone https://github.com/swqa7697/cs6650-backend.git
cd cs6650-backend
```

<h4>2. Configure</h4>

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

<h4>3. Install Dependencies</h4>

Install Node.js in your system, and run the command under the directory '/cs6650-backend':

```
npm install
```

<h4>4. Start Server</h4>

```
npm start
```

<h2>Additional: Deploy The Load Balancer</h2>

The load balancer is used for all api servers under the same subsystem/airline

<h4>1. Install Nginx</h4>

In an extra instance (idealy) or in any one of the api servers (for test/demo), install Nginx and start it by:

(For Ubuntu)
```
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

<h4>2. Configure</h4>

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

<h4>3. Reload Nginx</h4>

Then, validate the config and reload Nginx by running:

```
sudo nginx -t
sudo systemctl reload nginx
```

<h2>Configure API Gateway</h2>

The instruction below shows the configuration of Amazon API Gateway, triggering 2 Amazon Lambda Functions

<h4>1. Create Required Layer For Lambda</h4>

Download the zip file here: [axios.zip](https://github.com/swqa7697/cs6650-additional-files/releases/download/Downloads/axios.zip)

- In your AWS console, go to <b>Lambda</b> - <b>Additional resources</b> - <b>Layers</b>, and click <b>Create layer</b>
- Fill 'axios' in the fields <b>Name</b> and <b>Description</b>, and keep other options as default
- Upload the zip file just downloaded and create the layer

Record the <b>Version ARN</b> for later use

<h4>2. Create Lambda Functions</h4>

Download these 2 files:
[cs6650-airline-aggregation.zip](https://github.com/swqa7697/cs6650-additional-files/releases/download/Downloads/cs6650-airline-aggregation.zip)
and
[cs6650-airline-routing.zip](https://github.com/swqa7697/cs6650-additional-files/releases/download/Downloads/cs6650-airline-routing.zip)

- Unzip them and edit the two 'constants.mjs' files according to the comments (configuring the airlines with their related load balancers)
  - The two 'constants.mjs' should be exactly same, so you can just edit one of them and use it for both functions
- Click <b>Create function</b> in the Lambda console to create function
  - There are two functions should be created, one called <b>aggregation</b> and another one called <b>routing</b>, both using the default Node.js runtime
- Copy/paste the code from the files you downloaded into the related functions
  - Make sure for both functions, the edited 'constants.mjs' are uploaded
- For both functions, at the bottom of the <b>Code</b> page, click <b>Add a layer</b>, and choose <b>Specify an ARN</b> and enter the <b>Version ARN</b> you got in the previous step. Add the layer

<h4>3. Create API Gateway</h4>
In the AWS console, find API Gateway:

- Click on <b>Create API</b>, and find <b>REST API</b>
  - Then, click on <b>Build</b>
  - Choose <b>New API</b>, and specify an API name
  - Click on <b>Create API</b>
- In the API just created, use <b>Create resource</b> to build API routes(endpoints) with the same structure of backend servers
  - Enable the CORS option(checkbox) when creating each resource

```
/flight/flights          GET   aggregation
/flight/new              POST  routing
/reservation/autoCancel  PUT   routing
/reservation/confirm     PUT   routing
/user/book               POST  routing
/user/reservations       GET   aggregation
```

- Use <b>Create Method</b> in each route specified above, Choosing the related Method type (GET/POST/PUT)
  - Choose <b>Lambda function</b> as <b>Integration type</b>
  - Enable <b>Lambda proxy integration</b> option
  - Choose the <b>Lambda function</b> to be triggered as specified above
- For each route created, click on <b>Enable CORS</b>
  - Enable all checkboxes under <b>Gateway responses</b> and <b>Access-Control-Allow-Methods</b>
  - Add two headers in <b>Access-Control-Allow-Headers</b> (separate headers by comma): 'cognito-token' and 'airline-name'
  - Click <b>Save</b>
- Click on <b>Deploy API</b> to make changes effective (create a new stage)
- In the <b>Stages</b> page, you can find the <b>Invoke URL</b> of the API gateway you just deployed. Record it for later use in the frontend
