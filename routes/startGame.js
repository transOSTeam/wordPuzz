
/*
 * GET home page.
 */

rowSize = 10;
exports.start = function(req,res){
	var newPuzzle = generatePuzzle(rowSize);
	console.log(newPuzzle);
	res.render('game', {team:'orange', rowSize : rowSize});
}

function generatePuzzle(rowSize){
	var i,j;
	puzzle = new Array();
	for(i = 0; i < rowSize; i++){
		puzzle.push(new Array());
		for(j = 0; j < rowSize; j++)
			puzzle[i].push('a');
	}
	return puzzle;
}

exports.sendPuzz = function(req,res){
	var newPuzz = generatePuzzle(rowSize);
	res.json({puzz : newPuzz});
}