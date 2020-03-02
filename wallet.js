/*
 * EarthCoin web wallet implementation in javascript
 * (c) 2008 by Sandokaaan. All rights reserved.
 * http://github.com/...
 */

var myAddress;
var myPrivKey;
var myPassPhrase;
var myBalance;
var lastBlockHeight = 0;
var lastBlockData;
var mySelected = 0;
var APIURL="http://bck.deveac.com:3000/";

var needReload = false;
function reloadBlockCount() {
	needReload = true;
	getBlockCount();	
}

function getBlockCount() {
    // read block height from the block explorer
    var request = APIURL+"getblockcount";
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", request, true);
    xmlhttp.send();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200)
            showHeight(this.responseText);
    }
}

function showHeight(nHeight) {
	if (lastBlockHeight != nHeight) {
		document.getElementById("spHeight").innerHTML = nHeight;
		lastBlockHeight = nHeight;
		// read the block hash from the second explorer
		var request = APIURL+"getblockhash/"+nHeight;
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("GET", request, true);
		xmlhttp.send();
		xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200)
			showAge(JSON.parse(this.responseText));
		}   
		if (needReload) {
			needReload = false;
			if (validateAddress(myAddress))
				rdOpen();
		} 
	}
}

function showAge(bHash) {
    // read the block from the second explorer
    var request = APIURL+"getblock/"+bHash;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", request, true);
    xmlhttp.send();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            lastBlockData = this.responseText;
            decodeBlockTime();
        }
    }    
}

function decodeBlockTime() {
	var block = JSON.parse(lastBlockData);
        if (block.time) {
            var delta = Math.round((Date.now()/1000 - Number(block.time))/60);
            document.getElementById("spAge").innerHTML = delta;
            setTimeout(decodeBlockTime, 60000);
        }
        else
            document.getElementById("spAge").innerHTML = '<font color="red"><B>Error - please wait for a while and refresh the page</b></font>';
}



function validateAddress(address) {
	try {
		var pubKey = bitjs.Base58.decode(address);
		// the lenght of valid public key is 25 bytes
		if (pubKey.length != 25) return false;
		// the first character of valid EAC address must be 'e'
		if (pubKey[0] != 93) return false;		
		var readchecksum = Crypto.util.bytesToHex(pubKey.slice(pubKey.length-4));
		var hash = Crypto.util.bytesToHex(Crypto.SHA256(Crypto.SHA256(pubKey.slice(0, pubKey.length-4), {asBytes: true}), {asBytes: true}));
		return (readchecksum == hash.substring(0,8));
	}
	catch(err) {
   	return false;
	}
}

function detectCompression(key) {
	var flag = key.substring(0,1);
	return ( flag != "8" );
}

function validatePrivkey(key) {
	try {
		bitjs.compressed = detectCompression(key);
		var purekey = bitjs.wif2privkey(key).privkey;
		return (bitjs.privkey2wif(purekey) == key);
	}
	catch(err) {
   	return false;
   }
}

function hideElement(elementId) {
    var element = document.getElementById(elementId);
    if (element) element.style.display = "none";
}

function showElement(elementId) {
    var element = document.getElementById(elementId);
    if (element) element.style.display = "block";
} 

function enableElement(elementId) {
    var element = document.getElementById(elementId);
    if (element) {
	element.disabled = false;
	element.style.cursor = "pointer";
	element.style.background = "green";
    }
} 

function disableElement(elementId) {
    var element = document.getElementById(elementId);
    if (element) {
	element.disabled = true;
	element.style.cursor = "not-allowed";
	element.style.background = "gray";
    }
} 

function resetPage() {
    disableElement("btBalance");
    disableElement("btReceive");
    disableElement("btSend");
    disableElement("cbComp");
    hideElement("divList");
    hideElement("cameraQR");
    hideElement("scConfirm");
    clKeys();
    getBlockCount();
}

function clKeys() {
	hideElement("scBalance");
	hideElement("scReceive");
	hideElement("scSend");
	hideElement("scHelp");
	hideElement("cameraQR");
	hideElement("scConfirm");
	showElement("scWallet");
}

function clBalance() {
	hideElement("scWallet");
	hideElement("scReceive");
	hideElement("scSend");
	hideElement("scHelp");
	hideElement("cameraQR");
	hideElement("scConfirm");
	showElement("scBalance");
}

function clReceive() {
	hideElement("scWallet");
	hideElement("scSend");
	hideElement("scHelp");
	hideElement("scBalance");
	hideElement("cameraQR");
	hideElement("scConfirm");
	showElement("scReceive");
}

function clSend() {
	hideElement("scWallet");
	hideElement("scHelp");
	hideElement("scBalance");
	hideElement("scReceive");
	hideElement("cameraQR");
	hideElement("scConfirm");
	showElement("scSend");
	resetSign();
}

function clHelp() {
	hideElement("scWallet");
	hideElement("scBalance");
	hideElement("scReceive");
	hideElement("scSend");
	hideElement("scConfirm");
	showElement("scHelp");
}

function rdAddr() {
	var element = document.getElementById("someKey");
	disableElement("cbComp");
	if (element) {
		element.placeholder = "Enter a valid EarthCoin address";
	}
	verifyKey();
}

function rdPriv() {
	var element = document.getElementById("someKey");
	disableElement("cbComp");
	if (element) {
		element.placeholder = "Enter your private key (wif)";
	}
	verifyKey();
}

function rdBrain() {
	var element = document.getElementById("someKey");
	enableElement("cbComp");
	if (element) {
		element.placeholder = "Enter your brain-wallet passphrase (more than 14 characters)";
	}
	verifyKey();
}

function autodetectKey() {
	someKeyString = document.getElementById('someKey').value;
	if (validateAddress(someKeyString))
		document.getElementById("tpPublic").checked = true;
	else if (validatePrivkey(someKeyString))
		document.getElementById("tpPrivate").checked = true;
	else
		document.getElementById("tpBrain").checked = true;
	verifyKey();
}

function verifyKey() {
	someKeyString = document.getElementById('someKey').value;
	if (document.getElementById("tpPublic").checked) {
		if (validateAddress(someKeyString))
		{
			enableElement("verifyKey");
			myAddress = someKeyString;
			myPrivKey = "";
			myPassPhrase = "";			
		}
		else
			disableElement("verifyKey");
	}
	else if (document.getElementById("tpPrivate").checked) {
		if (validatePrivkey(someKeyString)) {
			enableElement("verifyKey");
			myPrivKey = someKeyString;			
			myAddress = bitjs.wif2address(myPrivKey).address;
			myPassPhrase = "";
			document.getElementById("cbComp").checked = detectCompression(someKeyString);
		}
		else
			disableElement("verifyKey");
	}
	else if (document.getElementById("tpBrain").checked) {
		if (someKeyString.length>=15) {
			enableElement("verifyKey");
			myPassPhrase = someKeyString;
			var bytes = Crypto.SHA256(myPassPhrase, { asBytes: true });
			bitjs.compressed = document.getElementById("cbComp").checked;
			myPrivKey = bitjs.privkey2wif(Crypto.util.bytesToHex(bytes));		
			myAddress = bitjs.wif2address(myPrivKey).address;
		}
		else
			disableElement("verifyKey");
	}
	else 
		disableElement("verifyKey");
}

function rdOpen() {
	document.getElementById("shAddress").innerHTML = '<H1>'+myAddress+'</H1>';
	makeCode();
	if (myPrivKey == "") {
		document.getElementById("shAddress").innerHTML += '<br> (read only)';
    	disableElement("btSend");
	}
	else {
		enableElement("btSend");
		createRecipients();
	}
	document.getElementById('someKey').value = "";
	document.getElementById('tpAutodetect').checked = true;
	document.getElementById("someKey").placeholder="Chose the wallet type..."
	disableElement("verifyKey");
	disableElement("cbComp");
	enableElement("btBalance");
	enableElement("btReceive");
	// read balance from the block explorer
	var request = APIURL+"unspent/"+myAddress;
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", request, true);
	xmlhttp.send();
	xmlhttp.onreadystatechange = function() {
	    if (this.readyState == 4 && this.status == 200) {
		myBalances = JSON.parse(this.responseText);
                showBalance();
	    }
	}
}

function showBalance() {
	var total = Number("0.00000000");
	var confirmed = total;
	var unconfirmed = total
	var element = document.getElementById("insertTx");
	element.innerHTML = "";
	for (var i in myBalances.unspents) {
		var amount = Number(myBalances.unspents[i].amount);
		var confs = lastBlockHeight - myBalances.unspents[i].height + 1;
		var txid = myBalances.unspents[i].txid;
		var nout = myBalances.unspents[i].vout;
		var isConfirmed = (Number(confs) >= 6);
		total += amount;
		if (isConfirmed)
			confirmed += amount;
		else 
		unconfirmed += amount;
		// fill advanced balance details 
		isDissabled = isConfirmed ? 'checked' : 'disabled';
		element.innerHTML += '<input name="'+i+'" id="checkBox_' + i + '" onInput="recalcSelection()" type="checkbox" ' + isDissabled + ' value="' +  amount + '"><B>' + amount + ' EAC</B> {txid: ' +  txid + ', conf: ' + confs + '} </input><BR>'; 
	}
	mySelected = confirmed;
	document.getElementById("spTotal").innerHTML = total.toFixed(8) + ' EAC';
	document.getElementById("spReceiving").innerHTML = unconfirmed.toFixed(8) + ' EAC';
	document.getElementById("spAvaiable").innerHTML = confirmed.toFixed(8) + ' EAC';
	document.getElementById("spSelected").innerHTML = mySelected.toFixed(8) + ' EAC';
}


function makeCode() {	
	document.getElementById("qrcode").innerHTML = "";		
	var qrcode = new QRCode(document.getElementById("qrcode"), {width : 150, height : 150});
	var amount = Number(document.getElementById("receiveAmount").value);
	var request='earthcoin:' + myAddress;
	if (amount > 0) {
		request += '?amount=' + amount;
		hideElement("spInvalid");
	}
	else if (amount == 0) hideElement("spInvalid");
	else showElement("spInvalid");
	qrcode.makeCode(request);
}

function showAdvanced()
{
	showElement('divList');
	document.getElementById("advShow").className = "inactiveImage";
	document.getElementById("advHide").className = "activeImage";
	document.getElementById("advAll").className = "activeImage";
	document.getElementById("advNone").className = "activeImage";
}

function hideAdvanced()
{
	hideElement('divList');
	document.getElementById("advHide").className = "inactiveImage";
	document.getElementById("advShow").className = "activeImage";
	document.getElementById("advAll").className = "inactiveImage";
	document.getElementById("advNone").className = "inactiveImage";
}

function uncheckAll() {
	var i = 0;
	while(true) {
		var element = document.getElementById("checkBox_"+i);
		if (!element) break;
		element.checked = false;
		i++;
	}
	mySelected = 0.0;
	document.getElementById("spSelected").innerHTML = mySelected;
}

function checkAll() {
	var i = 0;
	while(true) {
		var element = document.getElementById("checkBox_"+i);
		if (!element) break;
		if (!(element.disabled))
			element.checked = true;
		i++;
	}
	recalcSelection();
}

function recalcSelection() {
	mySelected = 0.0;
	var i = 0;
	while(true) {
		var element = document.getElementById("checkBox_"+i);
		if (!element) break;
		if (element.checked) mySelected += Number(element.value);
		i++;
	}
	document.getElementById("spSelected").innerHTML = mySelected;
}

// outputs
var j = 0;                  
function addKids() {
	j++;	
	var div = document.createElement('div');
	div.innerHTML = '<div><input type="image" class="activeImageCam" id="webcamimg'+j+'" src="cam.png" height="20" onclick="readAddrQR('+j+')"/>&nbsp;&nbsp;<input type="text" size="55" id="addr_'+j+'" name="addrs[]" onInput="resetSign()" placeholder="Address #'+j+'"><input size="7" name="amts[]" id="amt_'+j+'" type="text" onInput="resetSign()" placeholder="EAC #'+j+'"><button type="button" id="remove_kids_'+j+'" onClick="removeKids(this)">-</button><button type="button" id="add_kids_'+j+'" onClick="addKids()">+</button><button type="button" onClick="addMax('+j+')">MAX</button></div>';
	document.getElementById('indiv').appendChild(div);
	var oldbt = document.getElementById('add_kids_'+(j-1));
	if (oldbt) oldbt.disabled = true;
	oldbt = document.getElementById('remove_kids_'+(j-1));
	if (oldbt) oldbt.disabled = true;
}

function removeKids(div) {
	document.getElementById('indiv').removeChild(div.parentNode.parentNode);
	j--;
	var oldbt = document.getElementById('add_kids_'+j);
	if (oldbt) oldbt.disabled = false;
	oldbt = document.getElementById('remove_kids_'+j);
	if (oldbt) oldbt.disabled = false;
}

function createRecipients() {
	j = 1;
	document.getElementById("recipients").innerHTML = '<input id="cbCustom" type="checkbox" onInput="customize()">Change your address for a "send back" transaction (experts only).</input><BR>';
	document.getElementById("recipients").innerHTML += '<div><input type="image" class="disabledImageCam" id="webcamimg0" src="cam.png" onclick="readAddrQR(0)"/>&nbsp;&nbsp;<input type="text" size="55" class="inputBlack" onInput="resetSign()" id="addr_0" name="addrs[] " value="'+myAddress+'" disabled><input size="7" name="amts[]" class="inputBlack" id="amt_0" type="text" value="0" disabled><button type="button" disabled>-</button><button type="button" disabled>+</button><button type="button" disabled>MAX</button></div>';
	document.getElementById("recipients").innerHTML += '<div id="indiv"><input type="image" class="activeImageCam" id="webcamimg1" src="cam.png" onclick="readAddrQR(1)"/>&nbsp;&nbsp;<input type="text" size="55" class="inputBlack" onInput="resetSign()" id="addr_1" name="addrs[]" placeholder="Address #1"><input size="7" name="amts[]" class="inputBlack" onInput="resetSign()" id="amt_1" type="text" placeholder="EAC #1"><button type="button" id="remove_kids_not" disabled>-</button><button type="button" id="add_kids_1" onClick="addKids()">+</button><button type="button" onClick="addMax(1)">MAX</button></div>';
	document.getElementById("recipients").innerHTML += '<div><input id="cbFee" onInput="setFee()" type="checkbox" checked=true disabled> Include </input> <input type="text" class="inputBlack" onInput="resetSign()" size="2" id="valFee" value="0.01"> EAC fee to support the network</div>';
	document.getElementById("recipients").innerHTML += '<div>TxComment: <input type="text" size="30" class="inputBlack" onInput="resetSign()" id="comment" name="comment" placeholder="transaction message (optional)"></input></div>';
	setFee();
}

function customize() {
	var notCustomize = !(document.getElementById("cbCustom").checked);
	document.getElementById("addr_0").disabled = notCustomize;
	if (notCustomize) { 
		document.getElementById("addr_0").value = myAddress;
		document.getElementById("webcamimg0").className = "disabledImageCam";
	}
	else
		document.getElementById("webcamimg0").className = "activeImageCam";
	resetSign();
}

function setFee() {
	document.getElementById("valFee").disabled = !(document.getElementById("cbFee").checked);
	resetSign();
}

var totalToSend;
function resetSign() {
	var i = 0;
	var passAll = true;
	totalToSend = 0.0;
	document.getElementById("amt_0").value = totalToSend;
	while(true) {
		var element = document.getElementById("addr_"+i);
		if (!element) break;
		var toAddress = element.value;
		var amount = document.getElementById("amt_"+i).value;
		var toSend = Number(amount);
		if (amount>0) {
			document.getElementById("amt_"+i).className = "inputBlack";
		}
		else {
			if ( amount == 0 ) {
				document.getElementById("amt_"+i).className = "inputBlue";
			}
			else {
				document.getElementById("amt_"+i).className = "inputRed";
				passAll = false;
			}
		}
		if (validateAddress(toAddress)) {
			document.getElementById("addr_"+i).className = "inputBlack";
			if ((toSend.toString() == amount) && amount>0)
				totalToSend += toSend;
		}
		else if (toAddress=='') {
			document.getElementById("addr_"+i).className = "inputBlue";
		}
		else {
			document.getElementById("addr_"+i).className = "inputRed";
			passAll = false;
		}
		i++;		
	}
	// calculate fee
	var realFee = 0.0;
	if (document.getElementById("cbFee").checked) {
		var readFee = document.getElementById("valFee").value;
		realFee = Number(readFee);
		if ((realFee.toString() != readFee) || (realFee<0)) { 
			document.getElementById("valFee").className = "inputRed";
			passAll = false;			
		}
		else { 
			var colora = (realFee == 0) ? "inputBlue" : "inputBlack"
			document.getElementById("valFee").className = colora;
			totalToSend += realFee;
		}                    
	}
	var backValue = mySelected - totalToSend;
	document.getElementById("amt_0").value = backValue;
	if (backValue == 0 )
		document.getElementById("amt_0").className = "inputBlue";
	else if (backValue > 0 )
		document.getElementById("amt_0").className = "inputBlack";
	else {
		document.getElementById("amt_0").className = "inputRed";
		passAll = false;
	}
	if ( passAll && ( (totalToSend-realFee)>0.0 ) )
		enableElement("btSingSend");
	else
		disableElement("btSingSend");
}

function addMax(i)
{
	var element = document.getElementById("amt_"+i);
	if (element) {
		element.value = 0;
		resetSign();
		var toAddress = document.getElementById("addr_"+i).value;
		if (validateAddress(toAddress)) 
		{	
			var amount = document.getElementById("amt_0").value;
			var toSend = Number(amount);
			if (toSend < 0 )
				toSend = 0;
			element.value = toSend;
			resetSign();
		}
	}
}

var indexOfElement;
function readAddrQR(i) {
	if (i==0)
		if (document.getElementById("cbCustom").checked == false)
			return;
	var srcFrame = (i<0) ? "scWallet" : "scSend" 
	hideElement(srcFrame);
	showElement("cameraQR");
	indexOfElement = i;
	resumeCamera(srcFrame);
}

function clSignSend() {
	var canBeSend = clSign();
	if (!canBeSend) {
		document.getElementById("confirmOutput").innerHTML += '</br>&nbsp;Transaction can not be seend, please check your inputs and try again.';
		disableElement("btSendConfirm");
	}
	else {
		document.getElementById("confirmOutput").innerHTML += '</br>&nbsp;If you click Confirm, transaction will be invariably send to the network.';
		enableElement("btSendConfirm");
	}		
	clConfirm();
}

var signedTx;
function clSign() {
	var trx = bitjs.transaction();
	var message = document.getElementById("comment").value;
	trx.addcomment(message);
	var i = 0;
	var inputsToSend = 0.0;
	document.getElementById("confirmOutput").innerHTML = '</br>';
// recalculate returned amount
	while(inputsToSend < totalToSend) {
		var element = document.getElementById("checkBox_"+i);
		if (!element) 
			break;
		if (element.checked) 
			inputsToSend += Number(document.getElementById("checkBox_"+i).value);
		i++;
	}
	if (inputsToSend < totalToSend) {
		document.getElementById("confirmOutput").innerHTML += '&nbsp;Error - low balance </br>';
		return false;
	}
	document.getElementById("amt_0").value = inputsToSend - totalToSend; 
// add inputs
	i = 0;
	inputsToSend = 0.0;
	while(inputsToSend < totalToSend) {
		var element = document.getElementById("checkBox_"+i);
		if (!element) 
			break;
		if (element.checked) { 
			var j = Number(element.name);
			var txid = myBalances.unspents[j].txid;
			var index = myBalances.unspents[j].vout;
			var script = myBalances.unspents[j].scriptPubKey;
			trx.addinput(txid,index,script);
			inputsToSend += Number(myBalances.unspents[j].amount);
		}
		i++;
	}
	if (inputsToSend < totalToSend) {
		document.getElementById("confirmOutput").innerHTML += 'Error - low balance <br>';	
		return false;	
	}
	document.getElementById("confirmOutput").innerHTML += '&nbsp;Unspent balance used: ' + inputsToSend.toFixed(8) + ' EAC <br><br>';
	var calcFee = inputsToSend;
// add outputs
	i = 0;	
	while(true) {
		var element = document.getElementById("amt_"+i);
		if (!element) 
			break;
		var toSend = Number(element.value);
		if (toSend > 0.0) {
			var toAddr = document.getElementById("addr_"+i).value;
			if (validateAddress(toAddr)) {
				trx.addoutput(toAddr, toSend.toString());
				calcFee -= toSend;
				document.getElementById("confirmOutput").innerHTML += '&nbsp;' + toSend.toFixed(8) + ' EAC → ' + toAddr;
				if (i == 0)
					document.getElementById("confirmOutput").innerHTML += ' - this is your address for the "go back" transaction <br>';
				else
					document.getElementById("confirmOutput").innerHTML += ' <br>';
			}
			else
				document.getElementById("confirmOutput").innerHTML += '&nbsp; # ' + i + ' ignored for invalid address <br>';	
		}
		else
			document.getElementById("confirmOutput").innerHTML += '&nbsp; # ' + i + ' ignored for amount=0 <br>';
		i++;
	}
	document.getElementById("confirmOutput").innerHTML += '<br>&nbsp; Network fee: ' + (calcFee+1e-9).toFixed(8) + ' EAC <br>';
	if (trx.iswithcomment())
		document.getElementById("confirmOutput").innerHTML += '<br>&nbsp; Transaction message (txComment): <font color="red">' + trx.getcomment() + '</font><br>';

// sign it
	if (validatePrivkey(myPrivKey)){
		try {
			signedTx = trx.sign(myPrivKey,1); //SIGHASH_ALL DEFAULT 1
			return true;
		}
		catch(err) {
			return false;
		}
	}
}

function clConfirm() {
	hideElement("scSend");
	showElement("scConfirm");
}

function clSendCancel() {
	hideElement("scConfirm");
	showElement("scSend");
}

function clSendConfirm() {
	disableElement("btSendConfirm");
	var broadcastURL = APIURL+"sendrawtransaction/" + signedTx;
	var request = new XMLHttpRequest();
	request.open('GET', broadcastURL, true);
	request.onload = function () {
		if (this.response == "There was an error. Check your console.")
			document.getElementById("confirmOutput").innerHTML += "</br></br><FONT color='red'><B>There was an error in the transaction broadcasting.</B></FONT>";
		else {
			document.getElementById("confirmOutput").innerHTML += "</br></br>Transaction send. Your transaction ID is:</br><b>" + this.response + '</b>';
			createRecipients();
		}
	}           
	request.send();
}

