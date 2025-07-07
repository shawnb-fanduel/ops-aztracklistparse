// when page finishes loading
window.addEventListener("load", function () {
	new ClipboardJS(".btn");
	// Start grabbing text from the input field, also starts its own timer to repeat
	getTextFromInput();

	// Add custom copy logic for the second button
	const copyAllBtn = document.getElementById("copyAllBtn");

	if (copyAllBtn) {
		copyAllBtn.addEventListener("click", function () {
			const text1 = document.getElementById("outputText1")?.textContent || '';
			const text2 = document.getElementById("outputText2")?.textContent || '';

			const combinedSorted = [...text1.split('\n'), ...text2.split('\n')]
				.map(line => line.trim())
				.filter(line => line.length > 0)
				.sort()
				.join('\n');

			// Fallback copy using a hidden textarea
			const textarea = document.createElement("textarea");
			textarea.value = combinedSorted;
			textarea.style.position = "fixed"; // prevent scroll jump
			textarea.style.opacity = "0";
			document.body.appendChild(textarea);
			textarea.focus();
			textarea.select();

			try {
				document.execCommand("copy");
			} catch (err) {
				console.error("Copy failed", err);
			}

			document.body.removeChild(textarea);
		});
	}
});


// settings and lists
let settingsObj = {spellingThreshold: 0.7}
const arcReplacements = [
	{ pattern: /Gulfstream\/ARC/, replacement: null },
	{ pattern: /Laurel\/ARC/, replacement: null },
	{ pattern: /.*Concepcion.*/, replacement: "CL - Club Hipico Concepcion (simulcast)" },
	{ pattern: /.*Valparaiso.*/, replacement: "CL - Valparaiso Sporting Club (simulcast)" },
	{ pattern: /.*Gavea.*/, replacement: "BR - Gavea (simulcast)" },
	{ pattern: /.*San Isidro.*/, replacement: "AR - San Isidro (simulcast)" },
	{ pattern: /.*Palermo.*/, replacement: "AR - Hipodromo Palermo" },
	{ pattern: /.*Santiago.*/, replacement: "CL - Club Hipico Santiago (simulcast)" },
	{ pattern: /.*Hipodromo.*/, replacement: "CL - Hipodromo Chile" },
	{ pattern: /.*Monterrico.*/, replacement: "PE - Monterrico (simulcast)" },
	{ pattern: /.*Maronas.*/, replacement: "UY - Maronas (simulcast)" }
	// Add more ARC replacements as needed
];

// #region --- MAIN ---
// Function to continuously grab text from input field and apply to output list(s)
function getTextFromInput() {
	setInterval(function() {
		try {
			settingsObj.comparisonThreshold = getComparisonThreshold();
			document.getElementById("comparisonThresholdNum").textContent = settingsObj.comparisonThreshold;

			let inputString = document.getElementById("inputText").value;
			let AZblockList = _.map(document.getElementById("inputBlockList").value.split("\n"), _.trim);
			let AZtracks = fn_convertList(inputString)
			fn_updateText("outputText1", fn_compareLists(AZtracks, AZblockList).join("\n"));
			fn_updateText("outputText2", fn_compareLists(AZtracks, AZblockList, false).join("\n"));
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
		arr[key] = arr[key].replace("Belmont @ Big A", "Belmont at the Big A");
		arr[key] = arr[key].replace("Mountaineer Park", "Mountaineer");
		arr[key] = arr[key].replace("Horseshoe Hat Trick Turf Pick 3", "Horseshoe P3 Turf");
		// Incomplete names
		arr[key] = arr[key].replace("Fanduel", "FanDuel Sportsbook and Horse Racing");
		arr[key] = arr[key].replace("Golden Gate", "Golden Gate Fields");
		arr[key] = arr[key].replace("Saratoga", "Saratoga Race Course");
		// Punctuation
		arr[key] = arr[key].replace("PARX", "Parx");
		// Spelling
		arr = fn_fixSpellingMistakes(arr)


		// ARC
		for (let i = 0; i < arr.length; i++) {
			for (let j = 0; j < arcReplacements.length; j++) {
				if (arcReplacements[j].pattern.test(arr[i])) {
					if (arcReplacements[j].replacement === null) {
						// Remove the element if the replacement is null
						arr.splice(i, 1);
					} else {
						arr[i] = arr[i].replace(arcReplacements[j].pattern, arcReplacements[j].replacement);
					}
					// Stop searching for replacements once one is found
					break;
				}
			}
		}
		// Remove six spaces and any following characters anywhere in the string
		arr[key] = arr[key].replace(/\s{10,99}\S*/g, '');
	}

	// rermove pure numbers and trim whitespace
	arr = _.compact(arr.filter(Boolean).map(str => str.trim()));

	// remove cancelled tracks
	arr = arr.filter(Boolean)
		.map(str => str.trim())
		.filter(str => !/cancelled|canceled/i.test(str))

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

function fn_compareLists(para_list1, para_list2, returnFirst = true) {
	let outputArr = [];

	for (let i = 0; i < para_list1.length; i++) {
		const { bestMatch } = stringSimilarity.findBestMatch(para_list1[i], para_list2);
		// Check if the similarity exceeds the threshold
		if (bestMatch.rating >= settingsObj.comparisonThreshold) {
			if (returnFirst) {
				// Collect allowed items if returnFirst is true
				outputArr.push(para_list1[i]);
			}
		} else {
			if (!returnFirst) {
				// Collect disallowed (non-matching) items if returnFirst is false
				outputArr.push(para_list1[i]);
			}
		}
	}
	// Return ["None"] if no items matched the criteria
	return outputArr.length === 0 ? ["None"] : outputArr.sort();
}

function getComparisonThreshold() {
	let thresholdElement = document.getElementById("comparisonThreshold");
	return thresholdElement ? thresholdElement.value / 100 : 0.75;
}

function fn_removeDoubleWords(para_string) {
	return para_string.replace(/\b(\w+)\s+\1\b/g, '$1');
}
