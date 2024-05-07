// when page finishes loading
window.addEventListener("load", function () {
	new ClipboardJS(".btn");
	// Start grabbing text from the input field, also starts its own timer to repeat
	getTextFromInput();
});

// variables and lists
let settingsObj = {threshold: 0.75}

// #region --- MAIN ---
// Function to continuously grab text from input field and apply to output list(s)
function getTextFromInput() {
	setInterval(function() {
		try {
			let inputString = document.getElementById("inputText").value;
			let AZblockList = _.map(document.getElementById("inputAZBlockList").value.split("\n"), _.trim);
			let AZtracks = fn_convertList(inputString)
			fn_updateText("outputText1", AZtracks.join("\n"));
			fn_updateText("outputText2", fn_compareLists(AZtracks, AZblockList).join("\n"));
		  } catch (error) {
			console.error(error);
		  }
	}, 500); // 500 milliseconds interval
}



// #region --- functions ---
function fn_convertList(inputString) {
	let arr = _.compact(inputString.split("\n"));
  
	// check for australia's that need to be combined with the following trackname
	for (let i = 0; i < arr.length - 1; i++) {
		// Check if the current line contains "Australia" and the next line contains "Gosford"
		if (arr[i].includes("Australia") && _.isString(arr[i + 1]) ) {
			// Example; Combine "Australia" and "Gosford" to form "AU - Gosford"
			arr[i] = "AU - " + arr[i + 1].trim();
			// Remove the next line as it's already combined with the current line
			arr.splice(i + 1, 1);
		}
	}
	
	// check for leg races need to be removed (extraneous detail)
	for (let i = 0; i < arr.length - 1; i++) {
		if (arr[i].match(/Leg\s*\w/)) {
			arr[i] = "";
		}
	}

	// remove tracknames preceeded by their ARC actual names
	for (let i = 1; i < arr.length; i++) {
		if (arr[i].startsWith("   ") && i != 0) { // Check if the row starts with spaces
			arr.splice(i - 1, 1); // Remove the row above if the current row starts with spaces
		}
	}
  
	for (let key in arr) {
		// Preferences
		arr[key] = arr[key].replace("Fanduel", "FanDuel Sportsbook and Horse Racing");
		arr[key] = arr[key].replace("Belmont @ Big A", "Belmont at the Big A");
	  

		// Punctuation
		arr[key] = arr[key].replace("PARX", "Parx");

		// Spelling
		arr = fn_fixSpellingMistakes(arr)

		// Incomplete names
		arr[key] = arr[key].replace("Golden Gate", "Golden Gate Fields");

		// ARC
		arr[key] = arr[key].replace("Gulfstream/ARC", "");
		arr[key] = arr[key].replace("Laurel/ARC", "");
		arr[key] = arr[key].replace(/.*Concepcion.*/, "CL - Club Hipico Concepcion (simulcast)");
		arr[key] = arr[key].replace(/.*Valparaiso.*/, "CL - Valparaiso Sporting Club (simulcast)");
		arr[key] = arr[key].replace(/.*Gavea.*/, "BR - Gavea (simulcast)");
		arr[key] = arr[key].replace(/.*San Isidro.*/, "AR - San Isidro (simulcast)");
		arr[key] = arr[key].replace(/.*Palermo.*/, "AR - Hipodromo Palermo");
		arr[key] = arr[key].replace(/.*Santiago.*/, "CL - Club Hipico Santiago (simulcast)");
		arr[key] = arr[key].replace(/.*Hipodromo.*/, "CL - Hipodromo Chile");
		arr[key] = arr[key].replace(/.*Monterrico.*/, "PE - Monterrico (simulcast)");
		arr[key] = arr[key].replace(/.*Maronas.*/, "UY - Maronas (simulcast)");
	  
		// Remove six spaces and any following characters anywhere in the string
		arr[key] = arr[key].replace(/\s{10,99}\S*/g, '');
	}

	// rermove pure numbers and trim whitespace
	arr = _.compact(arr.filter(Boolean).map(str => str.trim()));

	// put each element through removeDoubleWords
	arr = _.map(arr, fn_removeDoubleWords)
	return arr.sort();
}

function fn_updateText(id, text) {
	// Get the element to change
	let element = document.getElementById(id);
	// Change the text content of the element
	element.textContent = text;
}

function fn_fixSpellingMistakes(arr) {
	// Words to match against
	const referenceWords = ["Valley", "Indianapolis", "Grounds", "Louisiana"];

	for (let i = 0; i < arr.length; i++) {
		const words = _.words(arr[i]);
		for (let j = 0; j < words.length; j++) {
			const word = words[j];
			for (let k = 0; k < referenceWords.length; k++) {
				const referenceWord = referenceWords[k];
				const matches = stringSimilarity.findBestMatch(referenceWord, [word]);
				const similarity = matches.bestMatch.rating;
				if (similarity > settingsObj.spellingThreshold) {
					// Replace the word with the reference word and break
					arr[i] = arr[i].replace(word, referenceWord);
					break;
				}
			}
		}
	}
	return arr;
}

function fn_compareLists(para_list1, para_list2) {
	let outputArr = [];

	for (let i = 0; i < para_list1.length; i++) {
		const { bestMatch } = stringSimilarity.findBestMatch(para_list1[i], para_list2);
		// console.log(`Comparing "${para_list1[i]}" to "${bestMatch.target}". Similarity: ${bestMatch.rating}`);
		if (bestMatch.rating >= settingsObj.threshold) {
			outputArr.push(bestMatch.target);
		}
	}
	if (outputArr.length == 0) {
		return ["None"]
	}
	// sorting not super neccisary as the incomming AZ list is already sorted
	return outputArr.sort();
}

function fn_removeDoubleWords(para_string) {
	return para_string.replace(/\b(\w+)\s+\1\b/g, '$1');
}
