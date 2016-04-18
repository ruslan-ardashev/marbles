// ==================================
// Part 2 - incoming messages, look for type
// ==================================
var ibc = {};
var chaincode = {};
var async = require('async');

module.exports.setup = function(sdk, cc){
	ibc = sdk;
	chaincode = cc;
};

module.exports.process_msg = function(ws, data) {

	if (data.v === 2) {

		console.log();
		console.log("data:");
		console.log(data);
		console.log();

		if (data.type == 'chainstats') {

			console.log('chainstats msg');
			ibc.chain_stats(cb_chainstats);

		} else if (data.type == 'create_and_submit_trade') {

			console.log('its a create_and_submit_trade!');

			if (data.tradedate && data.valuedate && data.operation && data.quantity && data.security && data.price && data.counterparty && data.user && data.timestamp) {
				chaincode.invoke.create_and_submit_trade([data.tradedate, data.valuedate, data.operation, data.quantity.toString(), data.security, data.price, data.counterparty, data.user, data.timestamp, data.settled.toString(), data.needsrevision.toString()], cb_invoked);				//create a new trade
			} else {
				console.log("forgot an argument in create_and_submit_trade in ws_part2.js");
			}

		} else if (data.type == 'read_all_trades') {

			console.log('ruslan: read_all_trades');
			chaincode.query.read(['_tradeindex'], cb_got_index);

		} else if (data.type == 'enrich_and_settle') {

			console.log('ruslan: enrich_and_settle');
			chaincode.invoke.enrich_and_settle([data.timestamp, data.user], inefficientCallback);

		} else if (data.type == 'mark_revision_needed') {

			console.log('ruslan: mark_revision_needed');
			chaincode.invoke.mark_revision_needed([data.timestamp, data.user], inefficientCallback);

		} else if (data.type == 'mark_revised') {

			console.log('ruslan: mark_revised');
			chaincode.invoke.mark_revised([data.timestamp, data.user], inefficientCallback);

		}

	}

	// for three of the methods above (for now) clear old trades and pull fresh data
	// add callbacks for revision methods to move trades around, for now slightly inefficient re-read
	function inefficientCallback(e, data) {

		sendMsg({msg: 'reset'});
		chaincode.query.read(['_tradeindex'], cb_got_index);

	}
	
	// got the trade index, lets get each trade
	function cb_got_index(e, index) {

		if(e != null) console.log('error:', e);

		else {

			try {

				var json = JSON.parse(index);
				for (var i in json) {
					console.log('!', i, json[i]);
					chaincode.query.read([json[i]], cb_got_trade);												//iter over each, read their values
				}

			}

			catch(e) {
				console.log('error:', e);
			}

		}

	}
	
	//call back for getting a trade, lets send a message
	function cb_got_trade(e, trade) {

		if(e != null) console.log('error:', e);
		else {
			console.log("ruslan: cb_got_trade with trade " + trade + ", sending message to ws");
			sendMsg({msg: 'trades', trade: trade});
		}

	}
	
	function cb_invoked(e, a){
		console.log('response: ', e, a);
	}
	
	//call back for getting the blockchain stats, lets get the block height now
	var chain_stats = {};
	function cb_chainstats(e, stats) {

		chain_stats = stats;
		if(stats && stats.height){
			var list = [];
			for(var i = stats.height - 1; i >= 1; i--){										//create a list of heights we need
				list.push(i);
				if(list.length >= 8) break;
			}
			list.reverse();																//flip it so order is correct in UI
			console.log(list);
			async.eachLimit(list, 1, function(key, cb) {								//iter through each one, and send it
				ibc.block_stats(key, function(e, stats){
					if(e == null){
						stats.height = key;
						sendMsg({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats});
					}
					cb(null);
				});
			}, function() {
			});
		}

	}

	//send a message, socket might be closed...
	function sendMsg(json) {
		if(ws){
			try{
				ws.send(JSON.stringify(json));
			}
			catch(e){
				console.log('error ws', e);
			}
		} else {
			console.log("warning no ws found in sendMsg of ws_part2.js");
		}
	}
};
