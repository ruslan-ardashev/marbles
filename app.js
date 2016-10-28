'use strict';
/* global process */
/* global __dirname */
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved. 
 *
 * Contributors:
 *   David Huffman - Initial implementation
 *******************************************************************************/
/////////////////////////////////////////
///////////// Setup Node.js /////////////
/////////////////////////////////////////
var express = require('express');
var session = require('express-session');
var compression = require('compression');
var serve_static = require('serve-static');
var path = require('path');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var app = express();
var url = require('url');
var setup = require('./setup');
var cors = require('cors');

//// Set Server Parameters ////
var host = setup.SERVER.HOST;
var port = setup.SERVER.PORT;

////////  Pathing and Module Setup  ////////
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.engine('.html', require('jade').__express);
app.use(compression());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded()); 
app.use(cookieParser());
app.use('/cc/summary', serve_static(path.join(__dirname, 'cc_summaries')) );												//for chaincode investigator
app.use( serve_static(path.join(__dirname, 'public'), {maxAge: '1d', setHeaders: setCustomCC}) );							//1 day cache
//app.use( serve_static(path.join(__dirname, 'public')) );
app.use(session({secret:'Somethignsomething1234!test', resave:true, saveUninitialized:true}));
function setCustomCC(res, path) {
	if (serve_static.mime.lookup(path) === 'image/jpeg')  res.setHeader('Cache-Control', 'public, max-age=2592000');		//30 days cache
	else if (serve_static.mime.lookup(path) === 'image/png') res.setHeader('Cache-Control', 'public, max-age=2592000');
	else if (serve_static.mime.lookup(path) === 'image/x-icon') res.setHeader('Cache-Control', 'public, max-age=2592000');
}
// Enable CORS preflight across the board.
app.options('*', cors());
app.use(cors());

///////////  Configure Webserver  ///////////
app.use(function(req, res, next){
	var keys;
	console.log('------------------------------------------ incoming request ------------------------------------------');
	console.log('New ' + req.method + ' request for', req.url);
	req.bag = {};											//create my object for my stuff
	req.bag.session = req.session;
	
	var url_parts = url.parse(req.url, true);
	req.parameters = url_parts.query;
	keys = Object.keys(req.parameters);
	if(req.parameters && keys.length > 0) console.log({parameters: req.parameters});		//print request parameters
	keys = Object.keys(req.body);
	if (req.body && keys.length > 0) console.log({body: req.body});						//print request body
	next();
});

//// Router ////
app.use('/', require('./routes/site_router'));

////////////////////////////////////////////
////////////// Error Handling //////////////
////////////////////////////////////////////
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});
app.use(function(err, req, res, next) {		// = development error handler, print stack trace
	console.log('Error Handeler -', req.url);
	var errorCode = err.status || 500;
	res.status(errorCode);
	req.bag.error = {msg:err.stack, status:errorCode};
	if(req.bag.error.status == 404) req.bag.error.msg = 'Sorry, I cannot locate that file';
	res.render('template/error', {bag:req.bag});
});

// ============================================================================================================================
// 														Launch Webserver
// ============================================================================================================================
var server = http.createServer(app).listen(port, function() {});
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.NODE_ENV = 'production';
server.timeout = 240000;																							// Ta-da.
console.log('------------------------------------------ Server Up - ' + host + ':' + port + ' ------------------------------------------');
if(process.env.PRODUCTION) console.log('Running using Production settings');
else console.log('Running using Developer settings');

// ============================================================================================================================
// 														Deployment Tracking
// ============================================================================================================================
console.log('- Tracking Deployment');
require('cf-deployment-tracker-client').track();		//reports back to us, this helps us judge interest! feel free to remove it

// ============================================================================================================================
// ============================================================================================================================
// ============================================================================================================================
// ============================================================================================================================
// ============================================================================================================================
// ============================================================================================================================

// ============================================================================================================================
// 														Warning
// ============================================================================================================================

// ============================================================================================================================
// 														Entering
// ============================================================================================================================

// ============================================================================================================================
// 														Test Area
// ============================================================================================================================
var part1 = require('./utils/ws_part1');
var part2 = require('./utils/ws_part2');
var ws = require('ws');
var wss = {};
var Ibc1 = require('ibm-blockchain-js');
var ibc = new Ibc1();

// ==================================
// load peers manually or from VCAP, VCAP will overwrite hardcoded list!
// ==================================
//this hard coded list is intentionaly left here, feel free to use it when initially starting out
//please create your own network when you are up and running
var manual = {
  "credentials": {
  "peers": [
    {
      "discovery_host": "46fd5f3fb1724c5fb82917ccebc21916-vp0.us.blockchain.ibm.com",
      "discovery_port": 30304,
      "api_host": "46fd5f3fb1724c5fb82917ccebc21916-vp0.us.blockchain.ibm.com",
      "api_port_tls": 444,
      "api_port": 444,
      "type": "peer",
      "network_id": "46fd5f3fb1724c5fb82917ccebc21916",
      "container_id": "cbc6796ef5cb56793e16c25a831e17674844823365950728c6177f401388fd64",
      "id": "46fd5f3fb1724c5fb82917ccebc21916-vp0",
      "api_url": "http://46fd5f3fb1724c5fb82917ccebc21916-vp0.us.blockchain.ibm.com:444"
    },
    {
      "discovery_host": "46fd5f3fb1724c5fb82917ccebc21916-vp3.us.blockchain.ibm.com",
      "discovery_port": 30304,
      "api_host": "46fd5f3fb1724c5fb82917ccebc21916-vp3.us.blockchain.ibm.com",
      "api_port_tls": 444,
      "api_port": 444,
      "type": "peer",
      "network_id": "46fd5f3fb1724c5fb82917ccebc21916",
      "container_id": "51a61ff83e12a62f586c73253cf410076ae2a220f8e03771b47e788961453915",
      "id": "46fd5f3fb1724c5fb82917ccebc21916-vp3",
      "api_url": "http://46fd5f3fb1724c5fb82917ccebc21916-vp3.us.blockchain.ibm.com:444"
    },
    {
      "discovery_host": "46fd5f3fb1724c5fb82917ccebc21916-vp2.us.blockchain.ibm.com",
      "discovery_port": 30304,
      "api_host": "46fd5f3fb1724c5fb82917ccebc21916-vp2.us.blockchain.ibm.com",
      "api_port_tls": 444,
      "api_port": 444,
      "type": "peer",
      "network_id": "46fd5f3fb1724c5fb82917ccebc21916",
      "container_id": "5a41f6bc7297ed10ebc6e991697655019a356e9acb28d5560be2f9c99108db0c",
      "id": "46fd5f3fb1724c5fb82917ccebc21916-vp2",
      "api_url": "http://46fd5f3fb1724c5fb82917ccebc21916-vp2.us.blockchain.ibm.com:444"
    },
    {
      "discovery_host": "46fd5f3fb1724c5fb82917ccebc21916-vp1.us.blockchain.ibm.com",
      "discovery_port": 30304,
      "api_host": "46fd5f3fb1724c5fb82917ccebc21916-vp1.us.blockchain.ibm.com",
      "api_port_tls": 444,
      "api_port": 444,
      "type": "peer",
      "network_id": "46fd5f3fb1724c5fb82917ccebc21916",
      "container_id": "2ac23dd924de79218d7734800b547d71762410e0c1c96a21f431a01b4f24b44f",
      "id": "46fd5f3fb1724c5fb82917ccebc21916-vp1",
      "api_url": "http://46fd5f3fb1724c5fb82917ccebc21916-vp1.us.blockchain.ibm.com:444"
    }
  ],
  "ca": {
    "46fd5f3fb1724c5fb82917ccebc21916-ca": {
      "url": "46fd5f3fb1724c5fb82917ccebc21916-ca.us.blockchain.ibm.com:30304",
      "discovery_host": "46fd5f3fb1724c5fb82917ccebc21916-ca.us.blockchain.ibm.com",
      "discovery_port": 30304,
      "api_host": "46fd5f3fb1724c5fb82917ccebc21916-ca.us.blockchain.ibm.com",
      "api_port_tls": 30304,
      "api_port": 30304,
      "type": "ca",
      "network_id": "46fd5f3fb1724c5fb82917ccebc21916",
      "container_id": "7020fbe5f4518a19a277e6f0a08ce7172a0445ee3db27f223366ecf01188b566",
      "newUsersObj": [
        {
          "enrollId": "admin",
          "enrollSecret": "106f4c7548",
          "group": "group1",
          "affiliation": "0001",
          "username": "admin",
          "secret": "106f4c7548"
        },
        {
          "enrollId": "WebAppAdmin",
          "enrollSecret": "a823007889",
          "group": "group1",
          "affiliation": "0001",
          "username": "WebAppAdmin",
          "secret": "a823007889"
        },
        {
          "enrollId": "peer0",
          "enrollSecret": "2c02f409d9",
          "group": "group1",
          "affiliation": "0001",
          "username": "peer0",
          "secret": "2c02f409d9"
        },
        {
          "enrollId": "peer1",
          "enrollSecret": "a9d7ce450d",
          "group": "group1",
          "affiliation": "0001",
          "username": "peer1",
          "secret": "a9d7ce450d"
        },
        {
          "enrollId": "peer2",
          "enrollSecret": "311c5a4ad7",
          "group": "group1",
          "affiliation": "0001",
          "username": "peer2",
          "secret": "311c5a4ad7"
        },
        {
          "enrollId": "peer3",
          "enrollSecret": "5fe68aacf5",
          "group": "group1",
          "affiliation": "0001",
          "username": "peer3",
          "secret": "5fe68aacf5"
        },
        {
          "enrollId": "dashboarduser_type1_0",
          "enrollSecret": "9117946f52",
          "group": "group1",
          "affiliation": "0001",
          "username": "dashboarduser_type1_0",
          "secret": "9117946f52"
        },
        {
          "enrollId": "dashboarduser_type1_1",
          "enrollSecret": "80b543859b",
          "group": "group1",
          "affiliation": "0001",
          "username": "dashboarduser_type1_1",
          "secret": "80b543859b"
        },
        {
          "enrollId": "dashboarduser_type1_2",
          "enrollSecret": "e5db91ebd5",
          "group": "group1",
          "affiliation": "0001",
          "username": "dashboarduser_type1_2",
          "secret": "e5db91ebd5"
        },
        {
          "enrollId": "dashboarduser_type1_3",
          "enrollSecret": "24d503c9c4",
          "group": "group1",
          "affiliation": "0001",
          "username": "dashboarduser_type1_3",
          "secret": "24d503c9c4"
        },
        {
          "enrollId": "user_type1_0",
          "enrollSecret": "86815de9d5",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type1_0",
          "secret": "86815de9d5"
        },
        {
          "enrollId": "user_type1_1",
          "enrollSecret": "3cd1104fbf",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type1_1",
          "secret": "3cd1104fbf"
        },
        {
          "enrollId": "user_type1_2",
          "enrollSecret": "eee35f862a",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type1_2",
          "secret": "eee35f862a"
        },
        {
          "enrollId": "user_type1_3",
          "enrollSecret": "5cb8fe5262",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type1_3",
          "secret": "5cb8fe5262"
        },
        {
          "enrollId": "user_type1_4",
          "enrollSecret": "486c74dcec",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type1_4",
          "secret": "486c74dcec"
        },
        {
          "enrollId": "user_type2_0",
          "enrollSecret": "03dc002ee8",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type2_0",
          "secret": "03dc002ee8"
        },
        {
          "enrollId": "user_type2_1",
          "enrollSecret": "8a5bf0f86c",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type2_1",
          "secret": "8a5bf0f86c"
        },
        {
          "enrollId": "user_type2_2",
          "enrollSecret": "e72f70aadf",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type2_2",
          "secret": "e72f70aadf"
        },
        {
          "enrollId": "user_type2_3",
          "enrollSecret": "a6559a3240",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type2_3",
          "secret": "a6559a3240"
        },
        {
          "enrollId": "user_type2_4",
          "enrollSecret": "8da297a2d4",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type2_4",
          "secret": "8da297a2d4"
        },
        {
          "enrollId": "user_type4_0",
          "enrollSecret": "1b20a5b374",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type4_0",
          "secret": "1b20a5b374"
        },
        {
          "enrollId": "user_type4_1",
          "enrollSecret": "c86f4655dd",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type4_1",
          "secret": "c86f4655dd"
        },
        {
          "enrollId": "user_type4_2",
          "enrollSecret": "56e0348831",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type4_2",
          "secret": "56e0348831"
        },
        {
          "enrollId": "user_type4_3",
          "enrollSecret": "fb0881fb9d",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type4_3",
          "secret": "fb0881fb9d"
        },
        {
          "enrollId": "user_type4_4",
          "enrollSecret": "bd9ae27296",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type4_4",
          "secret": "bd9ae27296"
        },
        {
          "enrollId": "user_type8_0",
          "enrollSecret": "9fabe23316",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type8_0",
          "secret": "9fabe23316"
        },
        {
          "enrollId": "user_type8_1",
          "enrollSecret": "c602a45129",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type8_1",
          "secret": "c602a45129"
        },
        {
          "enrollId": "user_type8_2",
          "enrollSecret": "d2eee7459c",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type8_2",
          "secret": "d2eee7459c"
        },
        {
          "enrollId": "user_type8_3",
          "enrollSecret": "1af59e00c1",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type8_3",
          "secret": "1af59e00c1"
        },
        {
          "enrollId": "user_type8_4",
          "enrollSecret": "1dcd8ac508",
          "group": "group1",
          "affiliation": "0001",
          "username": "user_type8_4",
          "secret": "1dcd8ac508"
        }
      ]
    }
  },
  "users": [
    {
      "username": "admin",
      "secret": "106f4c7548",
      "enrollId": "admin",
      "enrollSecret": "106f4c7548"
    },
    {
      "username": "WebAppAdmin",
      "secret": "a823007889",
      "enrollId": "WebAppAdmin",
      "enrollSecret": "a823007889"
    },
    {
      "username": "user_type1_0",
      "secret": "86815de9d5",
      "enrollId": "user_type1_0",
      "enrollSecret": "86815de9d5"
    },
    {
      "username": "user_type1_1",
      "secret": "3cd1104fbf",
      "enrollId": "user_type1_1",
      "enrollSecret": "3cd1104fbf"
    },
    {
      "username": "user_type1_2",
      "secret": "eee35f862a",
      "enrollId": "user_type1_2",
      "enrollSecret": "eee35f862a"
    },
    {
      "username": "user_type1_3",
      "secret": "5cb8fe5262",
      "enrollId": "user_type1_3",
      "enrollSecret": "5cb8fe5262"
    },
    {
      "username": "user_type1_4",
      "secret": "486c74dcec",
      "enrollId": "user_type1_4",
      "enrollSecret": "486c74dcec"
    },
    {
      "username": "user_type2_0",
      "secret": "03dc002ee8",
      "enrollId": "user_type2_0",
      "enrollSecret": "03dc002ee8"
    },
    {
      "username": "user_type2_1",
      "secret": "8a5bf0f86c",
      "enrollId": "user_type2_1",
      "enrollSecret": "8a5bf0f86c"
    },
    {
      "username": "user_type2_2",
      "secret": "e72f70aadf",
      "enrollId": "user_type2_2",
      "enrollSecret": "e72f70aadf"
    },
    {
      "username": "user_type2_3",
      "secret": "a6559a3240",
      "enrollId": "user_type2_3",
      "enrollSecret": "a6559a3240"
    },
    {
      "username": "user_type2_4",
      "secret": "8da297a2d4",
      "enrollId": "user_type2_4",
      "enrollSecret": "8da297a2d4"
    },
    {
      "username": "user_type4_0",
      "secret": "1b20a5b374",
      "enrollId": "user_type4_0",
      "enrollSecret": "1b20a5b374"
    },
    {
      "username": "user_type4_1",
      "secret": "c86f4655dd",
      "enrollId": "user_type4_1",
      "enrollSecret": "c86f4655dd"
    },
    {
      "username": "user_type4_2",
      "secret": "56e0348831",
      "enrollId": "user_type4_2",
      "enrollSecret": "56e0348831"
    },
    {
      "username": "user_type4_3",
      "secret": "fb0881fb9d",
      "enrollId": "user_type4_3",
      "enrollSecret": "fb0881fb9d"
    },
    {
      "username": "user_type4_4",
      "secret": "bd9ae27296",
      "enrollId": "user_type4_4",
      "enrollSecret": "bd9ae27296"
    },
    {
      "username": "user_type8_0",
      "secret": "9fabe23316",
      "enrollId": "user_type8_0",
      "enrollSecret": "9fabe23316"
    },
    {
      "username": "user_type8_1",
      "secret": "c602a45129",
      "enrollId": "user_type8_1",
      "enrollSecret": "c602a45129"
    },
    {
      "username": "user_type8_2",
      "secret": "d2eee7459c",
      "enrollId": "user_type8_2",
      "enrollSecret": "d2eee7459c"
    },
    {
      "username": "user_type8_3",
      "secret": "1af59e00c1",
      "enrollId": "user_type8_3",
      "enrollSecret": "1af59e00c1"
    },
    {
      "username": "user_type8_4",
      "secret": "1dcd8ac508",
      "enrollId": "user_type8_4",
      "enrollSecret": "1dcd8ac508"
    }
  ],
  "cert": "https://blockchain-certs.mybluemix.net/us.blockchain.ibm.com.cert"
};
var peers = manual.credentials.peers;
console.log('loading hardcoded peers');
var users = null;																		//users are only found if security is on
if(manual.credentials.users) users = manual.credentials.users;
console.log('loading hardcoded users');

if(process.env.VCAP_SERVICES){															//load from vcap, search for service, 1 of the 3 should be found...
	var servicesObject = JSON.parse(process.env.VCAP_SERVICES);
	for(var i in servicesObject){
		if(i.indexOf('ibm-blockchain') >= 0){											//looks close enough
			if(servicesObject[i][0].credentials.error){
				console.log('!\n!\n! Error from Bluemix: \n', servicesObject[i][0].credentials.error, '!\n!\n');
				peers = null;
				users = null;
				process.error = {type: 'network', msg: 'Due to overwhelming demand the IBM Blockchain Network service is at maximum capacity.  Please try recreating this service at a later date.'};
			}
			if(servicesObject[i][0].credentials && servicesObject[i][0].credentials.peers){
				console.log('overwritting peers, loading from a vcap service: ', i);
				peers = servicesObject[i][0].credentials.peers;
				if(servicesObject[i][0].credentials.users){
					console.log('overwritting users, loading from a vcap service: ', i);
					users = servicesObject[i][0].credentials.users;
				} 
				else users = null;														//no security
				break;
			}
		}
	}
}

// ==================================
// configure ibm-blockchain-js sdk
// ==================================
var options = 	{
					network:{
						peers: peers,
						users: users,
						options: {quiet: true, tls:false, maxRetry: 5}
					},
					chaincode:{
						zip_url: 'https://github.com/ruslan120101/marbles-chaincode/archive/master.zip',
						unzip_dir: 'marbles-chaincode-master/part2_v1.0.0',								//subdirectroy name of chaincode after unzipped
						git_url: 'https://github.com/ruslan120101/marbles-chaincode/part2_v1.0.0',				//GO git http url
					
						//hashed cc name from prev deployment
						//deployed_name: 'c5181b2ecd0c291d3bdc692921ba65e58d502aa35db2a06539e8a41398548f30c76990544f2edcc10ba4d25621dd1ef7e4c9f04ccab1b907ddc6914c3bc39a64'
					}
				};
if(process.env.VCAP_SERVICES){
	console.log('\n[!] looks like you are in bluemix, I am going to clear out the deploy_name so that it deploys new cc.\n[!] hope that is ok budddy\n');
	options.chaincode.deployed_name = '';
}
ibc.load(options, cb_ready);																//parse/load chaincode

var chaincode = null;
function cb_ready(err, cc){																	//response has chaincode functions
	if(err != null){
		console.log('! looks like an error loading the chaincode or network, app will fail\n', err);
		if(!process.error) process.error = {type: 'load', msg: err.details};				//if it already exist, keep the last error
	}
	else{
		chaincode = cc;
		part1.setup(ibc, cc);
		part2.setup(ibc, cc);
		if(!cc.details.deployed_name || cc.details.deployed_name === ''){					//decide if i need to deploy
			cc.deploy('init', ['99'], {save_path: './cc_summaries'}, cb_deployed);
		}
		else{
			console.log('chaincode summary file indicates chaincode has been previously deployed');
			cb_deployed();
		}
	}
}

// ============================================================================================================================
// 												WebSocket Communication Madness
// ============================================================================================================================
function cb_deployed(e, d){
	if(e != null){
		//look at tutorial_part1.md in the trouble shooting section for help
		console.log('! looks like a deploy error, holding off on the starting the socket\n', e);
		if(!process.error) process.error = {type: 'deploy', msg: e.details};
	}
	else{
		console.log('------------------------------------------ Websocket Up ------------------------------------------');
		ibc.save('./cc_summaries');														//save it here for chaincode investigator
		
		wss = new ws.Server({server: server});												//start the websocket now
		wss.on('connection', function connection(ws) {
			ws.on('message', function incoming(message) {
				console.log('received ws msg:', message);
				var data = JSON.parse(message);
				part1.process_msg(ws, data);
				part2.process_msg(ws, data);
			});
			
			ws.on('close', function(){});
		});
		
		wss.broadcast = function broadcast(data) {											//send to all connections
			wss.clients.forEach(function each(client) {
				try{
					data.v = '2';
					client.send(JSON.stringify(data));
				}
				catch(e){
					console.log('error broadcast ws', e);
				}
			});
		};
		
		// ========================================================
		// Monitor the height of the blockchain
		// ========================================================
		ibc.monitor_blockheight(function(chain_stats){										//there is a new block, lets refresh everything that has a state
			if(chain_stats && chain_stats.height){
				console.log('hey new block, lets refresh and broadcast to all');
				ibc.block_stats(chain_stats.height - 1, cb_blockstats);
				wss.broadcast({msg: 'reset'});

				console.log("CALLING CHAINCODE READ");

				chaincode.query.read(['_tradeindex'], cb_got_index);
			}
			
			//got the block's stats, lets send the statistics
			function cb_blockstats(e, stats){
				if(chain_stats.height) stats.height = chain_stats.height - 1;
				wss.broadcast({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats});
			}
			
			//got the trade index, lets get each trade
			function cb_got_index(e, index) {

				console.log("SUCCEEDING IN CALLING CB GOT INDEX");

				console.log(index);
				console.log(e);

				if(e != null) console.log('error:', e);
				else{
					try{
						var json = JSON.parse(index);
						console.log("~~~~~");
						console.log(json);
						console.log();
						console.log("~~~~~");

						for(var i in json){
							console.log('!', i, json[i]);
							chaincode.query.read([json[i]], cb_got_trade);							//iter over each, read their values
						}
					}
					catch(e){
						console.log("NO LUCK");
						console.log('error:', e);
					}
				}
			}
			
			//call back for getting a trade, lets send a message
			function cb_got_trade(e, trade) {

				console.log("SUCCEEDING IN CALLING cb_got_trade");

				if(e != null) console.log('error:', e);
				else {
					console.log("BROADCAST");
					wss.broadcast({msg: 'trades', trade: trade});
				}
			}

		});
	}
}
