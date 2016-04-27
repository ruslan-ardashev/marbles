/* global new_block,formatDate, randStr, bag, $, clear_blocks, document, WebSocket, escapeHtml */
var ws = {};
var user = {username: bag.setup.USER1};
// var bgcolors = ['whitebg', 'blackbg', 'redbg', 'greenbg', 'bluebg', 'purplebg', 'pinkbg', 'orangebg', 'yellowbg'];

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function() {

	connect_to_server();

	// =================================================================================
	// jQuery UI Events
	// =================================================================================
	// HOME button on nav bar
	$('#homeLink').click(function(){

		$('#tradePanel').hide();
		$('#homePanel').show();

	});

	// TRADE button on nav bar
	$('#tradeLink').click(function(){
		
		disableTradePanelButtons();
		clearTradePanelInputFields();
		setTradePanelFieldsEnabled(true);

		// enable create button
		var button = $('button[id="tradePanelButtonCreate"]')[0];
		button.hidden = false;

		// display
		$('#homePanel').hide();
		$('#tradePanel').show();

	});

	$('#tradePanelButtonCreate').click(function(){
		
		var obj = getTradeInformationFromTradePanel();
		obj.type = 'create_and_submit_trade';

		if(obj.timestamp && obj.user && obj.security) {

			console.log('creating trade, sending', obj);
			ws.send(JSON.stringify(obj));
			$('#tradePanel').hide();
			$('#homePanel').show();

		} else {

			$('#errorName').html('Warning');
			$('#errorNoticeText').html('Please do not leave any fields blank.');
			$('#errorNotificationpHint').html('Please double check all entries and hit submit again.');
			$('#errorNotificationPanel').fadeIn().delay(2000).fadeOut();

		}

		return false;

	});

	$('#tradePanelButtonRevise').click(function(){
		
		console.log("revised activated");
		ws.send(JSON.stringify({type: 'mark_revised', timestamp: bag.clickedTradeBoxTimestamp, user: bag.setup.USER2, v: 2}));
		$('#tradePanel').hide();
		$('#homePanel').show();

	});

	$('#tradePanelButtonRevisionNecessary').click(function(){
		
		console.log("revisionNecessary activated");
		ws.send(JSON.stringify({type: 'mark_revision_needed', timestamp: bag.clickedTradeBoxTimestamp, user: bag.setup.USER1, v: 2}));
		$('#tradePanel').hide();
		$('#homePanel').show();

	});

	$('#tradePanelButtonSettle').click(function(){
		
		console.log("enrichSettleLink activated");
		ws.send(JSON.stringify({type: 'enrich_and_settle', timestamp: bag.clickedTradeBoxTimestamp, user: bag.setup.USER1, v: 2}));
		$('#tradePanel').hide();
		$('#homePanel').show();

	});

	// listen to clicks on the trade boxes that we move around
	$(document).on("click", ".clickableTradeBox", function(){
		
		var trade = bag.trades[this.id];

		if (bag.clickedTradeBoxTimestamp == null) bag.clickedTradeBoxTimestamp = "";
		bag.clickedTradeBoxTimestamp = this.id;
		
		if (trade) {

			if (user.username == bag.setup.USER1) {

				console.log(this.id + " got clicked by client");

				// handle if awaiting revision, otherwise (for now) nothing needs to appear, trade's settled

				// TODO ONLY IF AWAITING REVISION, OTHERWISE SHOW WARNING
				if ((trade.settled == "0") && (trade.needsrevision == "1")) {

					$('#homePanel').hide();
					$('#tradePanel').show(0).delay(500, function() {

						disableTradePanelButtons();
						clearTradePanelInputFields();
						setTradePanelFieldsEnabled(true);
						prepopulateTradePanelWithTrade(trade);

						var button = $('button[id="tradePanelButtonRevise"]')[0];
						button.hidden = false;

					});

				} else {

					$('#errorName').html('Wrong User');
					$('#errorNoticeText').html('The trade you are selecting is either settled or is awaiting another user&#39;s input.');
					$('#errorNotificationpHint').html('If Pending Back Office Action, try logging in as ' + bag.setup.USER2);
					$('#errorNotificationPanel').fadeIn().delay(2000).fadeOut();
					
				}

			} else if (user.username == bag.setup.USER2) {

				console.log(this.id + " got clicked by broker");	// (only) logical next step = settle screen

				// TODO ONLY IF AWAITING ENRICHMENT OR MARKING FOR REVISION, OTHERWISE SHOW WARNING
				if ((trade.settled == "0") && (trade.needsrevision == "0")) {

					$('#homePanel').hide();
					$('#tradePanel').show(0).delay(500, function() {

						disableTradePanelButtons();
						clearTradePanelInputFields();
						setTradePanelFieldsEnabled(true);
						prepopulateTradePanelWithTrade(trade);

						var button = $('button[id="tradePanelButtonRevisionNecessary"]')[0];
						button.hidden = false;

						button = $('button[id="tradePanelButtonSettle"]')[0];
						button.hidden = false;

					});

				} else {

					$('#errorName').html('Wrong User');
					$('#errorNoticeText').html('The trade you are selecting is either settled or is awaiting another user&#39;s input.');
					$('#errorNotificationpHint').html('If Needs Revision, try logging in as ' + bag.setup.USER1);
					$('#errorNotificationPanel').fadeIn().delay(2000).fadeOut();
					
				}

			} else if (user.username == bag.setup.USER3) {

				// here we show relevant blocks
				// go through visual blocks, highlight relevant ones
				// first, clear old highlights if present
				var blockWrap = $('#blockWrap')[0];
				var children = blockWrap.children;

				for (var childIndex in children) {

					var block = children[childIndex];	// div

					if (block.id != "details") {
						block.className = "block";	
					}

				}

				// present
				if ($("#footerWrap").is(":visible")) {

					// no need to pull up

				} else {

					// pull up BC footer
					$("#viewBCWrap").click();

				}

				

				var relevantIDs = [];

				// go through blocks, remember ids relevant to us
				for (var i in blocks) {

					// get payload
					var payload = atob(blocks[i].blockstats.transactions[0].payload);
					var payloadLowerCase = payload.toLowerCase();
					var contains = payloadLowerCase.indexOf(trade.timestamp.toLowerCase());
				
					if (contains != -1) {

						relevantIDs.push(parseInt(i));

					}

				}

				// go through visual blocks, highlight relevant ones
				var blockWrap = $('#blockWrap')[0];
				var children = blockWrap.children;

				for (var childIndex in children) {

					var block = children[childIndex];	// div
					var numberHTML = block.innerHTML;
					var value = parseInt(numberHTML);

					var notNumber = isNaN(value);
					var foundInArray = (jQuery.inArray(value, relevantIDs) !== -1);

					if (!notNumber && foundInArray) {

						console.log(value + " found in " + relevantIDs);

						block.className += " lastblock";

					}

				}

	// $('#blockWrap').append('<div class="block">' +  nDig(id, 3) + '</div>');
	// $('.block:last').animate({opacity: 1, left: (block * 36)}, 600, function(){
	// 	$('.lastblock').removeClass('lastblock');
	// 	$('.block:last').addClass('lastblock');
	// });
	// block++;




			}

		} else {

			$('#errorName').html('Error');
			$('#errorNoticeText').html('Internal error occurred locating trade information.');
			$('#errorNotificationpHint').html('');
			$('#errorNotificationPanel').fadeIn().delay(2000).fadeOut();

		}

	});

	// login events
	// drop down for login
	$('#whoAmI').click(function(){

		if ($('#userSelect').is(':visible')) {

			$('#userSelect').fadeOut();

		} else {

			$('#userSelect').fadeIn();

		}

	});
	
	// log in as someone else
	$('.userLine').click(function(){												
		
		var name = $(this).attr('name');
		user.username = name.toLowerCase();

		if (user.username == bag.setup.USER1) {
			$('#tradeLink').fadeIn(0);
		} else {
			$('#tradeLink').fadeOut(0);
		}

		$('#userField').html('HI ' + user.username.toUpperCase() + ' ');
		$('#userSelect').fadeOut(300);
		$('select option[value="' + user.username + '"]').attr('selected', true);

		// $('#errorName').html('Home');
		// $('#errorNoticeText').html('Please use the Home button on the left to continue correct operation.');
		// $('#errorNotificationpHint').html('');
		// $('#errorNotificationPanel').fadeIn().delay(2000).fadeOut();

		// ruslan: maybe refresh all trades on home panel here

	});
	
});


// =================================================================================
// Handler Funcs
// =================================================================================
// Convenience "Variable" - array of all input & select fields on Trade Panel
function tradePanelFields() {

	return [
		$('input[id="tradePanelInputTradeDate"]')[0],
		$('input[id="tradePanelInputValueDate"]')[0],
		$('select[id="tradePanelSelectOperation"]')[0],
		$('input[id="tradePanelInputQuantity"]')[0],
		$('input[id="tradePanelInputSecurity"]')[0],
		$('input[id="tradePanelInputPrice"]')[0],
		$('input[id="tradePanelInputCounterParty"]')[0]
	];

}

function setTradePanelFieldsEnabled(isEnabled) {

	var fields = tradePanelFields();

	for (var i in fields) {

		fields[i].disabled = !isEnabled;

	}

}


function disableTradePanelButtons() {

	$('button[id="tradePanelButtonCreate"]')[0].hidden = true;
	$('button[id="tradePanelButtonRevise"]')[0].hidden = true;
	$('button[id="tradePanelButtonRevisionNecessary"]')[0].hidden = true;
	$('button[id="tradePanelButtonSettle"]')[0].hidden = true;

}

function clearTradePanelInputFields() {

	$('input[id="tradePanelInputTradeDate"]')[0].value = "";
	$('input[id="tradePanelInputValueDate"]')[0].value = "";
	$('input[id="tradePanelInputQuantity"]')[0].value = "";
	$('input[id="tradePanelInputSecurity"]')[0].value = "";
	$('input[id="tradePanelInputPrice"]')[0].value = "";
	$('input[id="tradePanelInputCounterParty"]')[0].value = "";

}

function prepopulateTradePanelWithTrade(trade) {

	$('input[id="tradePanelInputTradeDate"]')[0].value = trade.tradedate;
	$('input[id="tradePanelInputValueDate"]')[0].value = trade.valuedate;
	$('input[id="tradePanelInputQuantity"]')[0].value = trade.quantity;
	$('input[id="tradePanelInputSecurity"]')[0].value = trade.security;
	$('input[id="tradePanelInputPrice"]')[0].value = trade.price;
	$('input[id="tradePanelInputCounterParty"]')[0].value = trade.counterparty;
	$('select[id="tradePanelSelectOperation"]').value = trade.operation;

}

// =================================================================================
// Helper Fun
// =================================================================================
function getTradeInformationFromTradePanel() {

	console.log("oi");

	var dt = new Date();
	var time = dt.getMonth() + "M:" + dt.getDay() + "D:" + dt.getHours() + "H:" + dt.getMinutes() + "M:" + dt.getSeconds() + "S";
 
	var returnObject = {
			tradedate: $('input[id="tradePanelInputTradeDate"]').val(),
			valuedate: $('input[id="tradePanelInputValueDate"]').val(),
			operation: $('select[id="tradePanelSelectOperation"]').val(),
			quantity: $('input[id="tradePanelInputQuantity"]').val(),
			security: $('input[id="tradePanelInputSecurity"]').val(),
			price: $('input[id="tradePanelInputPrice"]').val(),
			counterparty: $('input[id="tradePanelInputCounterParty"]').val(),
			user: user.username,
			timestamp: time,
			settled: 0,
			needsrevision: 0,
			v: 2
	};

	console.log(returnObject);

	return returnObject;

}


// =================================================================================
// Socket Stuff
// =================================================================================
function connect_to_server() {

	var connected = false;

	connect();
		
	function connect(){

		var wsUri = 'ws://' + bag.setup.SERVER.EXTURI;
		ws = new WebSocket(wsUri);
		ws.onopen = function(evt) { onOpen(evt); };
		ws.onclose = function(evt) { onClose(evt); };
		ws.onmessage = function(evt) { onMessage(evt); };
		ws.onerror = function(evt) { onError(evt); };

		console.log("part2.js - connect() - ws:");
		console.log(ws);
		console.log();

	}
	
	function onOpen(evt){

		console.log('WS CONNECTED');
		connected = true;
		clear_blocks();
		$('#errorNotificationPanel').fadeOut();
		ws.send(JSON.stringify({type: 'chainstats', v:2}));
		ws.send(JSON.stringify({type: 'read_all_trades', v:2}));
		// ws.send(JSON.stringify({type: 'get_open_trades', v: 2}));

	}

	function onClose(evt) {

		console.log('WS DISCONNECTED', evt);
		connected = false;
		setTimeout(function(){ connect(); }, 5000);					//try again one more time, server restarts are quick

	}

	function onMessage(msg) {

		try {

			var data = JSON.parse(msg.data);
			console.log("ruslan onMessage: " + data.msg);

			if (data.msg === 'chainstats') {

				console.log("ruslan: REACHING HERE 1");

				var e = formatDate(data.blockstats.transactions[0].timestamp.seconds * 1000, '%M/%d/%Y &nbsp;%I:%m%P');
				$('#blockdate').html('<span style="color:#fff">TIME</span>&nbsp;&nbsp;' + e + ' UTC');

				var temp = { 
								id: data.blockstats.height, 
								blockstats: data.blockstats
							};

				new_block(temp);									//send to blockchain.js

			} else if (data.msg === 'reset') {							//clear marble knowledge, prepare of incoming marble states

				console.log("ruslan: REACHING HERE 2");

				$('#userwrap').html('');

			} else if (data.msg === 'trades') {

				console.log("ruslan: REACHING HERE 3");

				if (data.trade) {

					console.log("data.trade present, building");
					build_trade(data.trade);
					// set_my_color_options(user.username);

				} else {

					console.log("ERROR calling onMessage(msg) to build trade without data.trade");

				}

			}

		}

		catch(e){
			console.log('ERROR', e);
			//ws.close();
		}

	}

	function onError(evt){

		console.log('ERROR ', evt);

		if(!connected && bag.e == null) {											//don't overwrite an error message

			$('#errorName').html('Warning');
			$('#errorNoticeText').html('Waiting on the node server to open up so we can talk to the blockchain. ');
			$('#errorNoticeText').append('This app is likely still starting up. ');
			$('#errorNoticeText').append('Check the server logs if this message does not go away in 1 minute. ');
			$('#errorNotificationpHint').html = "This application cannot run without the blockchain network :(";
			$('#errorNotificationPanel').fadeIn();

		}

	}

}


// =================================================================================
//	UI Building
// =================================================================================
function build_trade(trade) {

	var html = '';
	
	if(!bag.trades) bag.trades = {};

	var timestamp = "";

	if (trade.timestamp) {

		console.log("ruslan created bag.trades[key]");
		timestamp = String(trade.timestamp);
		bag.trades[timestamp] = trade;

		console.log(bag.trades[timestamp]);
		console.log();

	} else {
		console.log("ruslan: ERROR creating bag.trades[key], no timestamp present");
	}

	var tradeStatus = '';

	// if adding again, remove older version
	$(document.getElementById(timestamp)).remove();

	// add new version
	if (parseInt(trade.settled) == 1) {

		// at client, settled
		tradeStatus = '<p class="valid" style="text-align: center; font-size: 16px;">Captured</p>';

	} else if (parseInt(trade.needsrevision) == 1) {

		// at client, settled
		tradeStatus = '<p class="error" style="text-align: center; font-size: 16px;">Pending Client Revision</p>';

	} else {

		// at back_office, awaiting marking for revision or enrichment & settlement
		tradeStatus = '<p class="php_error" style="text-align: center; font-size: 16px;">Pending Back Office Action</p>';

	}

	var tradeBoxClasses = 'clickableTradeBox nav fa fa-5x fa-border';
	var tradeBoxStyle = 'width: 225px; text-align: center;';

	html += '<span id = "' + timestamp + '" class="' + tradeBoxClasses + '" style="' + tradeBoxStyle + '"><p class="fa white">' + trade.security.toUpperCase() + '</p><br/>';

	html += tradeStatus;

	html += '<p class="hint" style="font-size: 16px;">Time: ' +timestamp + '</p><p class="hint" style="font-size: 16px;">Price: ' + trade.price + '</p><p class="hint" style="font-size: 16px;">Quantity: ' + trade.quantity + '</p><p class="hint" style="font-size: 16px;">Trade Date: ' + trade.tradedate + '</p><p class="hint" style="font-size: 16px;">Value Date: ' + trade.valuedate + '</p></span>';

	$('#userwrap').append(html);

	// console.log('trades', bag.trades);

}
