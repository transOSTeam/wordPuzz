
rowSize = 20;				//global
var puzzle;						//global!
var dictionary;
var clientList;
var gameStarted = false;
var gameTime = 120 * 1000;
var startGameTimeOut = gameTime/2;
var captainName;
var saveServer;
fs = require('fs');


function Player(){};
Player.prototype.name = 'player';
Player.prototype.score = 0;

var PlayerList = function(){};
PlayerList.prototype = new Array();
PlayerList.prototype.incScore = function(name,incFactor){
	var i;
	for(i = 0; i < this.length; i++){
		if(this[i].name === name){
			this[i].score += incFactor;
			break;
		}
	}
}
var playerList;

exports.initGame = function(){
	//generatePuzzle(rowSize);			//populate global variable puzzle
	var rndPuzzFile = Math.floor((Math.random()*5)+1);		//total puzzle files are 5; pick random in 1 to 5
	var puzzleFilePath = "public/puzzles/puzz" + rndPuzzFile + ".txt";
	console.log("random file: " + rndPuzzFile);
	readPuzzle(puzzleFilePath);
	fs.readFile('wordList.txt', 'ascii', function (err,data) {
		if (err) {
			return console.log(err);
		}
		dictionary = data.split("\n");
	});
	if(!clientList)
		clientList = new Array();
	if(typeof(playerList) === 'undefined' || playerList === null)
		playerList = new PlayerList();
}

exports.start = function(req,res){
	if(!req.session.name || playerList.length === 0)
		res.redirect("/");
	else if(gameStarted)
		res.render('error', {errorMsg: "Sorry game has started"});
	else{
		var captain = false;
		var temp, i = 0;
		if(!clientList)
			clientList = new Array();
		if(playerList[0].name === req.session.name){
			captainName = req.session.name;
			captain = true;
			saveServer = setTimeout(function(){							//this is to prevent game lock if captain gets lost.
				clientList = null;									 //delete clientList
				playerList = new PlayerList();									//delete playerList
			},startGameTimeOut);
		}
		res.render('game', {player: req.session.name, captain : captain, hostName : req.headers.host});
	}
}

exports.newUser = function(req, res){				// post on /start
	var playerName = req.body.playerName;
	var newPlayer = new Player();
	newPlayer.name = playerName;
	newPlayer.score = 0;
	playerList.push(newPlayer);
	req.session.name = playerName;
	req.session.score = 0;
	res.redirect("/start")
}

exports.sendPuzz = function(req,res){
	res.json({puzz : puzzle});
}

exports.sockOnConnection = function (socket) {
	clientList.push(socket);

	socket.on('chkAns', function(data){
		if(chkAns(data)){
			updateAll(data);
			playerList.incScore(data.playerName, 1);
		}
	})
	socket.on('startGame', function(data){
		gameStarted = true;	
		var name = data.playerName;
		if(name == captainName){
			for(var i = 0; i < clientList.length; i++){
				clientList[i].emit('startGame',data);
			}
			clearTimeout(saveServer);
			setTimeout(function(){
				if(gameStarted){
					for(var i = 0; i < clientList.length; i++){
						clientList[i].emit('gameOver',playerList);
					}
					clientList = null;									 //delete clientList
					playerList = new PlayerList();									//delete playerList
					gameStarted = false;
				}
			},gameTime);
		}
	});
	function updateAll(data){
		if(clientList){
			for(var i = 0; i < clientList.length; i++){
				clientList[i].emit('update',data);
			}
		}
	}
}

function chkAns(data){
	var startPt = data.startPt.split('-');
	var endPt = data.endPt.split('-');
	var word = getStringFromPuzzle(startPt,endPt);
	word = word.toLowerCase();
	if(dictionary.indexOf(word) != -1)
		return true;
	else
		return false;
}

function getStringFromPuzzle(startPt,endPt){
	startPt[0] = parseInt(startPt[0]);
	startPt[1] = parseInt(startPt[1]);
	endPt[0] = parseInt(endPt[0]);
	endPt[1] = parseInt(endPt[1]);
	var word = '';
	if(startPt[0] == endPt[0]){			//horizontal
		if(startPt[1] < endPt[1]){				//go right
			for(;startPt[1] <= endPt[1]; startPt[1]++){
				word += puzzle[startPt[0]][startPt[1]];
			}
		}
		else {									//go left
			for(;startPt[1] >= endPt[1]; startPt[1]--){
				word += puzzle[startPt[0]][startPt[1]];;
			}
		}
	}
	else if(startPt[1] == endPt[1]){		//vertical
		if(startPt[0] < endPt[0]){
			for(;startPt[0] <= endPt[0]; startPt[0]++){
				word += puzzle[startPt[0]][startPt[1]];
			}
		}
		else {
			for(;startPt[0] >= endPt[0]; startPt[0]--){
				word += puzzle[startPt[0]][startPt[1]];;
			}
		}
	}
	else {									//diagonal
		if(startPt[0] < endPt[0] && startPt[1] < endPt[1]){					//go south east
			for(;startPt[0] <= endPt[0] && startPt[1] <= endPt[1]; startPt[0]++, startPt[1]++){
				word += puzzle[startPt[0]][startPt[1]];
			}
		}
		else if(startPt[0] > endPt[0] && startPt[1] > endPt[1]){					//go north west
			for(;startPt[0] >= endPt[0] && startPt[1] >= endPt[1]; startPt[0]--, startPt[1]--){
				word += puzzle[startPt[0]][startPt[1]];
			}
		}
		else if(startPt[0] < endPt[0] && startPt[1] > endPt[1]){					//go south west
			for(;startPt[0] <= endPt[0] && startPt[1] >= endPt[1]; startPt[0]++, startPt[1]--){
				word += puzzle[startPt[0]][startPt[1]];
			}
		}
		else if(startPt[0] > endPt[0] && startPt[1] < endPt[1]){					//go north east
			for(;startPt[0] >= endPt[0] && startPt[1] <= endPt[1]; startPt[0]--, startPt[1]++){
				word += puzzle[startPt[0]][startPt[1]];
			}
		}
	}
	return word;
}

function generatePuzzle(rowSize){		//in multiplayer we need something like gameID
	var i,j;
	puzzle = new Array();
	for(i = 0; i < rowSize; i++){
		puzzle.push(new Array());
		for(j = 0; j < rowSize; j++)
			puzzle[i].push('a');
	}
}

function readPuzzle(puzzleFilePath){
	var lines;
	var i;
	fs.readFile(puzzleFilePath, 'ascii', function (err,data) {
		if (err) {
			return console.log(err);
		}
		lines = data.split("\n");
		puzzle = new Array();
		for(i = 0; i < lines.length; i++){
			puzzle.push(lines[i].split("\t"));
		}
	});
}
