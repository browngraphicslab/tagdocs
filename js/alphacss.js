/**
 * Gets sets of rules in css file. Splits baced on two newline
 * characters. This isn't a good way to get sets in general.
 */
function getSections() {
	var css = $("#textarea")[0].value.replace(/\n\n+/g,'\n\n'); // replace any long blocks of white space
	return css.split('\n\n');
}

/**
 * Alphabetizes css based on first line of selectors for each set of rules.
 * Different sets of rules should be separated by at least one blank line if they
 * are to be sorted separately.
 */
function alphabetize() {
	var sections = getSections();
	sections.sort(function(a,b) {
		return (getSortString(a) > getSortString(b)) ? 1 : -1;
	});
	$("#textarea")[0].value = sections.join('\n\n');
}

/**
 * Returns alphanumeric characters of first line of selectors.
 */
function getSortString(block) {
	var firstline = block.split("\n")[0],
	    reg = /[^\w]/g; // matches all non-alphanumeric characters
	return firstline.replace(reg,''); // remove these characters for sorting
}

/**
 * Alphabetizes the properties in each set of rules
 */
function alphabetizeProperties() {
	var sections = getSections(),
	    newSections = [],
	    i, j, lines, line,
	    selectors = [], rules = [];
	for(i=0; i<sections.length; i++) {
		isRightBracket = false;
		hasBeenBracket = false;
		rules.length = 0;
		selectors.length = 0;
		lines = sections[i].split('\n');
		for(j=0; j<lines.length; j++) { // separate the rules and selectors
			line = lines[j];
			if(line.match(/\}/)) {
				line = line.replace(/\}/,'');
				isRightBracket = true;
			}
			// rules start with either a space or a tab for indentation or a previous line has a {
			if(line[0] !== ' ' && line[0] !== '\t' && !hasBeenBracket) {
				line.match(/[^\n\t ]/) && selectors.push(cleanLine(line)); // push if it's not a blank line
			}
			else {
				line.match(/[^\n\t ]/) && rules.push("    "+cleanLine(line));
			}
			hasBeenBracket = hasBeenBracket || (line.match(/\{/) ? true : false);
		}
		rules.sort(function(a,b) {
			return (getPropertySortString(a) > getPropertySortString(b)) ? 1 : -1;
		});
		// recreate the section using sorted rules list
		newSections.push(selectors.join('\n')+'\n'+rules.join('\n')+((isRightBracket) ? '\n}' : '')); 
	}
	$("#textarea")[0].value = newSections.join('\n\n');
}

/**
 * Alphabetize selectors and properties
 */
function alphabetizeAll() {
	alphabetizeProperties();
	alphabetize();
}

/**
 * Gets alphanumerics of property name in line
 */
function getPropertySortString(line) {
	return line.match(/[^: ]+/)[0].replace(/[^\w]/g,''); // matches property name, replaces non-alphanumerics with ''
}

/**
 * Replaces extra new lines and trims white space
 */
function cleanLine(line) {
	var spacesReplaced = line.replace(/  +/g,' ');
	return spacesReplaced.trim();
}