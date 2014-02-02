
rowSize = 20;				//global
var puzzle;						//global!
var dictionary;
var puzzleFilePath = "public/puzzles/puzz1.txt"
var clientList = new Array();
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
	res.render('game', {team:'orange'});
}

exports.sendPuzz = function(req,res){
	res.json({puzz : puzzle});
}

exports.sockOnConnection = function (socket) {
	console.log('got socket.io connection - id: %s', socket.id);
	clientList.push(socket);

	socket.on('chkAns', function(data){
		console.log(data);
		if(chkAns(data))
			updateAll(data);
	})
	function updateAll(data){
		console.log("word found->updating" + clientList)
		for(var i = 0; i < clientList.length; i++){
			console.log("updating -> " + clientList[i])
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