
rowSize = 20;				//global
var puzzle;						//global!
var dictionary;
var puzzleFilePath = "public/puzzles/puzz1.txt"
var clientList = new Array();
var scoreList = new Array();
var gameStarted = false;
var gameTime = 30 * 1000;
var captainName;
fs = require('fs');

exports.initGame = function(){
	//generatePuzzle(rowSize);			//populate global variable puzzle
	readPuzzle(puzzleFilePath);
	fs.readFile('wordList.txt', 'ascii', function (err,data) {
		if (err) {
			return console.log(err);
		}
		dictionary = data.split("\n");
	});	
}

exports.start = function(req,res){
	if(!req.session.name)
		res.redirect("/");
	else if(gameStarted)
		res.render('error', {errorMsg: "Sorry game has started"});
	else{
		var captain = true;
		var temp, i = 0;
		for(temp in scoreList){				//just to check if array is empty
			i++;
			if(i > 1){
				captain = false;
				break;
			}
		}
		if(captain)
			captainName = req.session.name;
		res.render('game', {player: req.session.name, captain : captain});
	}
}

exports.newUser = function(req, res){				// post on /start
	var playerName = req.body.playerName;
	scoreList[playerName] = 0;
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
			console.log(scoreList)
			updateAll(data);
			scoreList[data.playerName]++;
		}
	})
	socket.on('startGame', function(data){
		var name = data.playerName;
		if(name == captainName){
			for(var i = 0; i < clientList.length; i++){
				clientList[i].emit('startGame',data);
			}
			setTimeout(function(){
				console.log(scoreList)
				for(var i = 0; i < clientList.length; i++){
					clientList[i].emit('gameOver',scoreList);
					//delete(clientList);
					//delete(scoreList);
					//gameStarted = false;
				}
			},gameTime);
		}
	});
	function updateAll(data){
		for(var i = 0; i < clientList.length; i++){
			clientList[i].emit('update',data);
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