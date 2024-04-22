// when page finishes loading
window.addEventListener("load", function () {
	new ClipboardJS(".btn");
	// Start grabbing text from the input field, also starts its own timer to repeat
	getTextFromInput();
});

// variables and lists
let settingsObj = {threshold: 0.75}
let NYTracks = ["Alcorn", "Aqueduct", "Batavia Downs", "BEL FM Two-Day DD", "BEL Friday Card", "BEL Gold Cup-Belmont Stakes DD", "BEL Met Mile-Belmont Stakes DD", "BEL NY Stakes-Met Mile DD", "BEL Sprint Two-Day DD", "BEL Triple Play", "BEL Two-Day P6", "BEL Two-Day Pick 4", "Belmont at the Big A", "Belmont Stakes 2-Day Pick 5", "Belmont Stakes Day", "Belmont Yonkers Pick 4", "Big 3 Pick 3", "Big Apple BG Pk 4 Adv", "Big Apple Blue Grass Pk 4", "Breeders Cup Challenge Pick 6", "Brooklyn Belmont Double", "Buffalo Raceway", "Cross Country Pick 4", "Cross Country Pick 4 & Pick 5", "Cross Country Pick 5", "Del Mar Saratoga Pick 4", "Elmira Raceway", "Finger Lakes", "Monmouth Cross Country Pick 4", "Monticello Raceway", "New York Los Alamitos P4", "New York New York Double", "NTRA Pick 4", "Saratoga Harness", "Saratoga Harness B", "Saratoga Race Course", "Saratoga Race Course 2-Day Double", "Saratoga Race Course 2-Day Pick 4", "Saratoga-Monmouth Pick 6", "Tioga Downs", "Tioga Downs Card 2", "Toga Toga Double", "Travers 2-Day Pick 6", "Travers Advance", "Travers Per Ensign DBL", "Vernon Downs", "Yonkers Raceway"]

// #region --- MAIN ---
// Function to continuously grab text from input field and apply to output list(s)
function getTextFromInput() {
	setInterval(function() {
		let inputString = document.getElementById("inputText").value;
		// console.log(fn_convertList(inputString))
		let AZtracks = fn_convertList(inputString)
		fn_updateText("outputText1", AZtracks.join("\n"));
		fn_updateText("outputText2", fn_compareLists(AZtracks, NYTracks).join("\n"));
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
		arr = fixSpellingMistakes(arr)

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
	return arr.sort();
}

function fn_updateText(id, text) {
	// Get the element to change
	let element = document.getElementById(id);
	// Change the text content of the element
	element.textContent = text;
}

function fixSpellingMistakes(arr) {
	const misspellings = {
		"valeey": "Valley",
		"inidianapolis": "Indianapolis",
		"groudns": "Grounds"
		// Add more misspellings and their corrections as needed
	};

	// Constructing the regular expression pattern dynamically
	const pattern = new RegExp('\\b(?:' + Object.keys(misspellings).join('|') + ')\\b', 'gi');
	for (let key in arr) {
		if (arr.hasOwnProperty(key)) {
			arr[key] = arr[key].replace(pattern, function(matched) {
				return misspellings[matched.toLowerCase()];
			});
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
