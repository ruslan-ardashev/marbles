/* global new_block,formatDate, randStr, bag, $, clear_blocks, document, WebSocket, escapeHtml */
var ws = {};
var user = {username: bag.setup.USER1};
// var bgcolors = ['whitebg', 'blackbg', 'redbg', 'greenbg', 'bluebg', 'purplebg', 'pinkbg', 'orangebg', 'yellowbg'];

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function() {

	connect_to_server();

	$('input[name="name"]').val('r' + randStr(6));
	$('select option[value="' + bag.setup.USER1 + '"]').attr('selected', true);
	console.log("ruslan: start: " + bag.setup.USER1);
	// =================================================================================
	// jQuery UI Events
	// =================================================================================
	$('#submitTrade').click(function() {

		var dt = new Date();
		var time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();

		var obj = 	{
						type: 'create_and_submit_trade',
						tradedate: $('input[name="tradedate"]').val(),
						valuedate: $('input[name="valuedate"]').val(),
						operation: $('select[name="operation"]').val(),
						quantity: $('input[name="quantity"]').val(),
						security: $('input[name="security"]').val(),
						price: $('input[name="price"]').val(),
						counterparty: $('input[name="counterparty"]').val(),
						user: bag.setup.USER2,
						timestamp: time,
						settled: 0,
						needsrevision: 0,
						v: 2
					};

		if(obj.user && obj.security && obj.timestamp) {

			console.log('creating trade, sending', obj);
			ws.send(JSON.stringify(obj));
			$('.panel').hide();
			$('#homePanel').show();

		}

		return false;

	});

	$('#reviseTrade').click(function() {

		// change to only have two arguments
		var obj = 	{
						type: 'create_and_submit_trade',
						tradedate: $('input[name="tradedate"]').val(),
						valuedate: $('input[name="valuedate"]').val(),
						operation: $('select[name="operation"]').val(),
						quantity: $('input[name="quantity"]').val(),
						security: $('input[name="security"]').val(),
						price: $('input[name="price"]').val(),
						counterparty: $('input[name="counterparty"]').val(),
						user: bag.setup.USER2,
						timestamp: time,
						settled: 0,
						needsrevision: 0,
						v: 2
					};

		if(obj.user && obj.security && obj.timestamp) {

			console.log('creating trade, sending', obj);
			ws.send(JSON.stringify(obj));
			$('.panel').hide();
			$('#homePanel').show();

		}

		return false;

	});

	$('#homeLink').click(function(){

		console.log("homeLink activated");
		console.log('trades:', bag.trades);

	});
	
	$('#submitTradeLink').click(function(){

		console.log("submitTradeLink activated");
		// $('input[name="name"]').val('r' + randStr(6));

	});

	$('#enrichSettleTradeButton').click(function(){

		console.log("enrichSettleLink activated");
		ws.send(JSON.stringify({type: 'enrich_and_settle', timestamp: bag.clickedTradeBoxTimestamp, user: bag.setup.USER1, v: 2}));

	});

	$('#markRevisionNecessaryButton').click(function(){

		console.log("mark_revision_needed activated");
		ws.send(JSON.stringify({type: 'mark_revision_needed', timestamp: bag.clickedTradeBoxTimestamp, user: bag.setup.USER1, v: 2}));

	});

	// listen to clicks on the trade boxes that we move around
	$(document).on("click", ".clickableTradeBox", function(){

		var trade = bag.trades[this.id];

		if (bag.clickedTradeBoxTimestamp == null) bag.clickedTradeBoxTimestamp = "";
		bag.clickedTradeBoxTimestamp = this.id;

		console.log();console.log("found trade", trade);console.log();

		if (user.username == bag.setup.USER1) {

			console.log(this.id + " got clicked by client");

		} else if (user.username == bag.setup.USER2) {

			console.log(this.id + " got clicked by broker");	// (only) logical next step = settle screen

			$('.panel').hide();
			$('#settlePanel').show(0).delay(500, function() {

				$("#settlePanelTradeDate")[0].value = trade.tradedate;
				$("#settlePanelValueDate")[0].value = trade.valuedate;

				var optionsNodes = $("#settlePanelOperation")[0].childNodes;
				if (trade.option == 'buy') {
					optionsNodes[0].selected = false;
					optionsNodes[1].selected = true;
					optionsNodes[2].selected = false;
				} else {
					optionsNodes[0].selected = false;
					optionsNodes[1].selected = false;
					optionsNodes[2].selected = true;
				}

				$("#settlePanelQuantity")[0].value = trade.quantity;
				$("#settlePanelSecurity")[0].value = trade.security;
				$("#settlePanelPrice")[0].value = trade.price;
				$("#settlePanelCounterparty")[0].value = trade.counterparty;

			});

		} else if (user.username == bag.setup.USER3) {

			console.log(this.id + " got clicked by observer");

		}

		// homePanel, submitPanel, revisePanel, settlePanel
		// $('.panel').hide();
		// $('#homePanel').show();

	});

	//marble color picker
	// $(document).on('click', '.colorInput', function(){
	// 	$('.colorOptionsWrap').hide();											//hide any others
	// 	$(this).parent().find('.colorOptionsWrap').show();
	// });
	
	//drag and drop marble
	// $('#user2wrap, #user1wrap, #trashbin').sortable({connectWith: '.sortable'}).disableSelection();
	// $('#user2wrap').droppable({drop:
	// 	function( event, ui ) {
	// 		var marble_user = $(ui.draggable).attr('user');
	// 		if(marble_user.toLowerCase() != bag.setup.USER2){						//marble transfered users
	// 			if(marble_user.toLowerCase() != user.username.toLowerCase()){		//do not let users steal marbles
	// 				move_back(ui.draggable);
	// 			}
	// 			else{
	// 				$(ui.draggable).addClass('invalid');
	// 				transfer($(ui.draggable).attr('id'), bag.setup.USER2);
	// 			}
	// 		}
	// 	}
	// });

	// $('#user1wrap').droppable({drop:
	// 	function( event, ui ) {
	// 		var marble_user = $(ui.draggable).attr('user');
	// 		if(marble_user.toLowerCase() != bag.setup.USER1){						//marble transfered users
	// 			if(marble_user.toLowerCase() != user.username.toLowerCase()){		//do not let users steal marbles
	// 				move_back(ui.draggable);
	// 			}
	// 			else{
	// 				$(ui.draggable).addClass('invalid');
	// 				transfer($(ui.draggable).attr('id'), bag.setup.USER1);
	// 			}
	// 		}
	// 		return false;
	// 	}
	// });

	// $('#trashbin').droppable({drop:
	// 	function( event, ui ) {
	// 		var id = $(ui.draggable).attr('id');
	// 		var marble_user = $(ui.draggable).attr('user');
	// 		if(marble_user.toLowerCase() != user.username.toLowerCase()){			//do not let users delete other user's marbles
	// 			move_back(ui.draggable);
	// 		}
	// 		else{
	// 			if(id){
	// 				console.log('removing marble', id);
	// 				var obj = 	{
	// 								type: 'remove',
	// 								name: id,
	// 								v: 2
	// 							};
	// 				ws.send(JSON.stringify(obj));
	// 				$(ui.draggable).fadeOut();
	// 				setTimeout(function(){
	// 					$(ui.draggable).remove();
	// 				}, 300);
	// 			}
	// 		}
	// 	}
	// });

	// function move_back(dragged){
	// 	console.log('move it back');
	// 	$(dragged).remove();
	// 	var name = $(dragged).attr('id');
	// 	build_ball({name: name, user: bag.marbles[name].user, color:bag.marbles[name].color, size: bag.marbles[name].size});
		
	// 	$('#whoAmI').addClass('flash');
	// 	setTimeout(function(){$('#whoAmI').removeClass('flash');}, 1500);
	// }
	
	
	//login events
	$('#whoAmI').click(function(){												//drop down for login
		
		$('.panel').hide();
		$('#homePanel').show();

		if ($('#userSelect').is(':visible')) {

			$('#userSelect').fadeOut();

		} else {

			$('#userSelect').fadeIn();

		}

	});
	
	$('.userLine').click(function(){												//log in as someone else
		
		var name = $(this).attr('name');
		user.username = name.toLowerCase();

		$('#userField').html('HI ' + user.username.toUpperCase() + ' ');
		$('#userSelect').fadeOut(300);
		$('select option[value="' + user.username + '"]').attr('selected', true);

		// appropriately hide elements
		if (user.username == bag.setup.USER1) {

			// nav_part
			if($('#submitTradeLink').is(':hidden')){
				$('#submitTradeLink').fadeIn(0);
			}

			if($('#reviseTradeLink').is(':hidden')){
				$('#reviseTradeLink').fadeIn(0);
			}

			if($('#enrichSettleLink').is(':visible')){
				$('#enrichSettleLink').fadeOut(0);
			}

			// homePanel
			if($('#user2wrap').is(':visible')){
				$('#user2wrap').fadeOut(0);
			}

			if($('#user3wrap').is(':visible')){
				$('#user3wrap').fadeOut(0);
			}

			if($('#user1wrap').is(':hidden')){
				$('#user1wrap').fadeIn(0);
			}

		} else if (user.username == bag.setup.USER2) {

			// nav_part
			if($('#enrichSettleLink').is(':hidden')){
				$('#enrichSettleLink').fadeIn(0);
			}

			if($('#submitTradeLink').is(':visible')){
				$('#submitTradeLink').fadeOut(0);
			}

			if($('#reviseTradeLink').is(':visible')){
				$('#reviseTradeLink').fadeOut(0);
			}

			// homePanel
			if($('#user1wrap').is(':visible')){
				$('#user1wrap').fadeOut(0);
			}

			if($('#user3wrap').is(':visible')){
				$('#user3wrap').fadeOut(0);
			}

			if($('#user2wrap').is(':hidden')){
				$('#user2wrap').fadeIn(0);
			}

		} else if (user.username == bag.setup.USER3) {

			// nav_part
			if($('#submitTradeLink').is(':visible')){
				$('#submitTradeLink').fadeOut(0);
			}

			if($('#enrichSettleLink').is(':visible')){
				$('#enrichSettleLink').fadeOut(0);
			}

			if($('#reviseTradeLink').is(':visible')){
				$('#reviseTradeLink').fadeOut(0);
			}

			// homePanel
			if($('#user2wrap').is(':visible')){
				$('#user2wrap').fadeOut(0);
			}

			if($('#user1wrap').is(':visible')){
				$('#user1wrap').fadeOut(0);
			}

			if($('#user3wrap').is(':hidden')){
				$('#user3wrap').fadeIn(0);
			}

		}

	});
	
	// ruslan: use inactiveButton on navBar perhaps
	//trade events
	// $('#setupTradeButton').click(function(){

	// 	build_trades(bag.trades);
	// 	$('.inactiveButton').removeClass('inactiveButton');
	// 	$('#viewTradeButton').addClass('inactiveButton');
	// 	$('#openTrades').fadeOut();
	// 	$('#createTrade').fadeIn();

	// });
	
	// $('#viewTradeButton').click(function(){

	// 	build_trades(bag.trades);

	// 	$('.inactiveButton').removeClass('inactiveButton');
	// 	$('#setupTradeButton').addClass('inactiveButton');
	// 	$('#openTrades').fadeIn();
	// 	$('#createTrade').fadeOut();

	// });
	
	// $('.removeWilling:first').hide();

	// $('#addMarbleButton').click(function(){

	// 	var count = 0;
	// 	var marble_count = 0;
	// 	$('.willingWrap').each(function(){
	// 		count++;
	// 	});
	// 	for(var i in bag.marbles){
	// 		if(bag.marbles[i].user.toLowerCase() == user.username.toLowerCase()){
	// 			marble_count++;
	// 		}
	// 	}
	// 	if(count+1 <= marble_count && count <= 3){									//lets limit the total number... might get out of hand
	// 		var temp = $('.willingWrap:first').html();
	// 		$('.willingWrap:first').parent().append('<div class="willingWrap">' + temp + '</div>');
	// 		$('.removeWilling').show();
	// 		$('.removeWilling:first').hide();
	// 	}
	// 	else{
	// 		$('#cannotAdd').fadeIn();
	// 		setTimeout(function(){ $('#cannotAdd').fadeOut(); }, 1500);
	// 	}

	// });
	
	// $(document).on('click', '.removeWilling', function(){
	// 	$(this).parent().remove();
	// });
	
	// $('#tradeSubmit').click(function(){
	// 	var msg = 	{
	// 					type: 'open_trade',
	// 					v: 2,
	// 					user: user.username,
	// 					want: {
	// 						color: $('#wantColorWrap').find('.colorSelected').attr('color'),
	// 						size: $('select[name="want_size"]').val()
	// 					},
	// 					willing: []
	// 				};
					
	// 	$('.willingWrap').each(function(){
	// 		//var q = $(this).find('select[name='will_quantity']').val();
	// 		var color = $(this).find('.colorSelected').attr('color');
	// 		var size = $(this).find('select[name="will_size"]').val();
	// 		//console.log('!', q, color, size);
	// 		var temp = 	{
	// 						color: color,
	// 						size: size
	// 					};
	// 		msg.willing.push(temp);
	// 	});
		
	// 	console.log('sending', msg);
	// 	ws.send(JSON.stringify(msg));
	// 	$('.panel').hide();
	// 	$('#homePanel').show();
	// 	$('.colorValue').html('Color');
	// });
	
	// $(document).on('click', '.confirmTrade', function(){
	// 	console.log('trading...');
	// 	var i = $(this).attr('trade_pos');
	// 	var x = $(this).attr('willing_pos');
	// 	var msg = 	{
	// 					type: 'perform_trade',
	// 					v: 2,
	// 					id: bag.trades[i].timestamp.toString(),
	// 					opener:{											//marble he is giving up
	// 						user: bag.trades[i].user,
	// 						color: bag.trades[i].willing[x].color,
	// 						size: bag.trades[i].willing[x].size.toString(),
	// 					},
	// 					closer:{											//marble hs ig giving up
	// 						user: user.username,							//guy who is logged in
	// 						name: $(this).attr('name'),
	// 						color: '',										//dsh to do, add these and remove above
	// 						size: ''
	// 					}
	// 				};
	// 	ws.send(JSON.stringify(msg));
	// 	$('#notificationPanel').animate({width:'toggle'});
	// });
	
	// $(document).on('click', '.willingWrap .colorOption', function(){
	// 	set_my_size_options(user.username, this);
	// });
	
	// $('input[name="showMyTrades"]').change(function(){
	// 	if($(this).is(':checked')){
	// 		$('#myTradesTable').fadeIn();
	// 	}
	// 	else{
	// 		$('#myTradesTable').fadeOut();
	// 	}
	// });
	
	// $(document).on('click', '.removeTrade', function(){
	// 	var trade = find_trade($(this).attr('trade_timestamp'));
	// 	$(this).parent().parent().addClass('invalid');
	// 	console.log('trade', trade);
	// 	var msg = 	{
	// 					type: 'remove_trade',
	// 					v: 2,
	// 					id: trade.timestamp.toString(),
	// 				};
	// 	ws.send(JSON.stringify(msg));
	// });
});


// =================================================================================
// Helper Fun
// =================================================================================
//transfer selected ball to user

// ruslan: USE THIS TO INITIATE TRANSFERS ON SUBMIT

// function transfer(marbleName, user){
// 	if(marbleName){
// 		console.log('transfering', marbleName);
// 		var obj = 	{
// 						type: 'transfer',
// 						name: marbleName,
// 						user: user,
// 						v: 2
// 					};
// 		ws.send(JSON.stringify(obj));
// 	}
// }

// modified, all trades are represented as "Large"
function sizeMe(mm){
	return 'Large';
}

function find_trade(timestamp){

	for(var i in bag.trades){

		if(bag.trades[i].timestamp){
			return bag.trades[i];
		}

	}

	return null;

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

				$('#user3wrap').html('');
				$('#user2wrap').html('');
				$('#user1wrap').html('');

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
		if(!connected && bag.e == null){											//don't overwrite an error message
			$('#errorName').html('Warning');
			$('#errorNoticeText').html('Waiting on the node server to open up so we can talk to the blockchain. ');
			$('#errorNoticeText').append('This app is likely still starting up. ');
			$('#errorNoticeText').append('Check the server logs if this message does not go away in 1 minute. ');
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

	if (trade.timestamp != null) {

		timestamp = String(trade.timestamp);
		bag.trades[timestamp] = trade;								//store the trade for posterity

	} else {
		console.log("ruslan: ERROR creating bag.trades[key], no timestamp present");
	}

	html += '<span id = "' + timestamp + '" title = "' + trade.security + '" class="clickableTradeBox nav fa fa-5x fa-border"><p class="fa fa-fw white" style="width: 175px; height: 75px; text-align: center;">' + trade.security.toUpperCase() + '</p><br/><p class="hint" style="font-size: 16px;">Time: ' +timestamp + '</p><p class="hint" style="font-size: 16px;">Price: ' + trade.price + '</p><p class="hint" style="font-size: 16px;">Quantity: ' + trade.quantity + '</p><p class="hint" style="font-size: 16px;">Trade Date: ' + trade.tradedate + '</p><p class="hint" style="font-size: 16px;">Value Date: ' + trade.valuedate + '</p></span>';

	if (trade.user == bag.setup.USER1) {
		$('#user1wrap').append(html);
		$('#user3wrap').append(html);
	} else if (trade.user == bag.setup.USER2) {
		$('#user2wrap').append(html);
	}

	console.log('trades', bag.trades);

}

// function build_trades(trades){
// 	var html = '';
// 	bag.trades = trades;						//store the trades for posterity
// 	console.log('trades:', bag.trades);
	
// 	for(var i in trades){
// 		for(var x in trades[i].willing){
// 			//console.log(trades[i]);
// 			var style = ' ';
// 			var buttonStatus = '';
			
// 			if(user.username.toLowerCase() != trades[i].user.toLowerCase()){				//don't show trades with myself
// 				var name = find_valid_marble(user.username, trades[i].want.color, trades[i].want.size);
// 				if(name == null) {								//don't allow trade if I don't have the correct marble
// 					style = 'invalid';
// 					buttonStatus = 'disabled="disabled"';
// 				}
// 				html += '<tr class="' + style + '">';
// 				html +=		'<td>' + formatDate(Number(trades[i].timestamp), '%M/%d %I:%m%P') + '</td>';
// 				html +=		'<td>1</td>';
// 				html +=		'<td><span class="fa fa-2x fa-circle ' + trades[i].want.color + '"></span></td>';
// 				html +=		'<td>' + sizeMe(trades[i].want.size) + '</td>';
// 				html +=		'<td>1</td>';
// 				html +=		'<td><span class="fa fa-2x fa-circle ' + trades[i].willing[x].color + '"></span></td>';
// 				html +=		'<td>' + sizeMe(trades[i].willing[x].size) + '</td>';
// 				html +=		'<td>';
// 				html +=			'<button type="button" class="confirmTrade altButton" ' + buttonStatus + ' name="' + name + '" trade_pos="' + i + '" willing_pos="' + x + '">';
// 				html +=				'<span class="fa fa-exchange"> &nbsp;&nbsp;TRADE</span>';
// 				html +=			'</button>';
// 				html += 	'</td>';
// 				html += '</tr>';
// 			}
// 		}
// 	}
// 	if(html === '') html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
// 	$('#openTradesBody').html(html);
	
// 	build_my_trades(trades);
// }

// function build_my_trades(trades){
// 	var html = '';
// 	for(var i in trades){
// 		//console.log(trades[i]);
// 		var style = ' ';
		
// 		if(user.username.toLowerCase() == trades[i].user.toLowerCase()){				//only show trades with myself
// 			html += '<tr class="' + style + '">';
// 			html +=		'<td>' + formatDate(Number(trades[i].timestamp), '%M/%d %I:%m%P') + '</td>';
// 			html +=		'<td>1</td>';
// 			html +=		'<td><span class="fa fa-2x fa-circle ' + trades[i].want.color + '"></span></td>';
// 			html +=		'<td>' + sizeMe(trades[i].want.size) + '</td>';
// 			html +=		'<td>';
// 			for(var x in trades[i].willing){
// 				html +=		'<p>1 <span class="fa fa-2x fa-circle ' + trades[i].willing[x].color + '"></span>&nbsp; &nbsp;' + sizeMe(trades[i].willing[x].size) + '</p>';
// 			}
// 			html += 	'</td>';
// 			html +=		'<td><span class="fa fa-remove removeTrade" trade_timestamp="' + trades[i].timestamp + '"></span></td>';
// 			html += '</tr>';
// 		}
// 	}
// 	if(html === '') html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td></tr>';
// 	$('#myTradesBody').html(html);
// }

// function set_my_color_options(username){
// 	var has_colors = {};
// 	for(var i in bag.marbles){
// 		if(bag.marbles[i].user.toLowerCase() == username.toLowerCase()){		//mark it as needed
// 			has_colors[bag.marbles[i].color] = true;
// 		}
// 	}
	
// 	//console.log('has_colors', has_colors);
// 	var colors = ['white', 'black', 'red', 'green', 'blue', 'purple', 'pink', 'orange', 'yellow'];
// 	$('.willingWrap').each(function(){
// 		for(var i in colors){
// 			//console.log('checking if user has', colors[i]);
// 			if(!has_colors[colors[i]]) {
// 				//console.log('removing', colors[i]);
// 				$(this).find('.' + colors[i] + ':first').hide();
// 			}
// 			else {
// 				$(this).find('.' + colors[i] + ':first').show();
// 				//console.log('yep');
// 			}
// 		}
// 	});
// }

// function set_my_size_options(username, colorOption){
// 	var color = $(colorOption).attr('color');
// 	//console.log('color', color);
// 	var html = '';
// 	var sizes = {};
// 	for(var i in bag.marbles){
// 		if(bag.marbles[i].user.toLowerCase() == username.toLowerCase()){		//mark it as needed
// 			if(bag.marbles[i].color.toLowerCase() == color.toLowerCase()){
// 				sizes[bag.marbles[i].size] = true;
// 			}
// 		}
// 	}
	
// 	console.log('valid sizes:', sizes);
// 	for(i in sizes){
// 		html += '<option value="' + i + '">' + sizeMe(i) + '</option>';					//build it
// 	}
// 	$(colorOption).parent().parent().next('select[name="will_size"]').html(html);
// }
