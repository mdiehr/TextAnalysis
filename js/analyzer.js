var Tabulator = (function() {
    var WordInfo = function(group, word, count) {
        this.count = count;
        this.counts = {};
        this.numGroups = 1;
        this.word = word;
        this.wordLower = word.toLowerCase();

        this.counts[group] = count;

        this.increment = function(group, count) {
            // Overall count
            this.count += count;

            // Group count
            if (this.counts[group] === undefined) {
                this.numGroups++;
                this.counts[group] = count;
            } else {
                this.counts[group] += count;
            }
        }

        this.toString = function() {
            return "[" + this.count.toString() + "] " + this.word;
        }

        this.getCounts = function() {
            var result = "";
            var number = 0;
            for (var groupKey in this.counts) {
                if (this.counts.hasOwnProperty(groupKey)) {
                    result += '<span class="group-'+groupKey+'">'+this.counts[groupKey].toString()+'</span>';
                    number++;
                    if (number < this.numGroups) {
                        result += ", ";
                    }
                }
            }
            return result;
        }

        return this;
    };

    var compareWordInfo = function(a, b) {
        if (a.count < b.count) {
            return 1;
        } else if (a.count > b.count) {
            return -1;
        } else {
            if (a.wordLower < b.wordLower) {
                return -1;
            } else if (a.wordLower > b.wordLower) {
                return 1;
            }
        }
        
        return 0;
    };

    var Tabulator = function(initialDictionary) {
        console.info("New tabulator created.");
        this.texts = [];
        this.fileNames = [];
        this.groupNames = [];
        this.wordInfos = [];
        this.wordInfoDict = {};
        this.dictionary = initialDictionary;
        this.capitalizedWords = {};
        this.regexWord = /\b[a-zA-Z]\w*-?\w*\b/g;
        this.verbose = false;

        this.addText = function(text, fileName, groupName) {
            this.texts.push(text);
            this.fileNames.push(fileName);
            this.groupNames.push(groupName);
            console.log("Added text from " + fileName);
        }

        this.tabulate = function() {
            for (var i = 0, imax = this.texts.length; i < imax; ++i) {
                this.tabulateText(this.groupNames[i], this.texts[i]);
            }

            // Select words in the capitalized dict that aren't in the regular dict
            // Iterate through group dictionaries
            for (var groupKey in this.capitalizedWords) {
                if (this.capitalizedWords.hasOwnProperty(groupKey)) {
                    var groupDict = this.capitalizedWords[groupKey];
                    // Iterate through words in the group dictionary
                    for (var wordKey in groupDict) {
                        if (groupDict.hasOwnProperty(wordKey)) {
                            // Skip regular words
                            if (this.isInDictionary(wordKey, this.dictionary)) {
                                continue;
                            }
                            // Include in results
                            var count = groupDict[wordKey];
                            this.countWordInfo(groupKey, wordKey, count)
                        }
                    }
                }
            }

            // Collect dictionary into flat array
            for (var wordInfoKey in this.wordInfoDict) {
                if (this.wordInfoDict.hasOwnProperty(wordInfoKey)) {
                    this.wordInfos.push(this.wordInfoDict[wordInfoKey]);
                }
            }

            // Sort
            this.wordInfos.sort(compareWordInfo);

            // Debug output, if needed
            if (this.verbose) {
                console.log("=================== properNouns: ===================");
                console.log("properNounCount: " + this.wordInfos.length);
                for (var i = 0, imax = this.wordInfos.length; i < imax; ++i) {
                    console.log(this.wordInfos[i].toString());
                }
            }

            return this.wordInfos;
        }

        this.countWordInfo = function(group, word, count) {
            var wordLower = word.toLowerCase();
            if (typeof this.wordInfoDict[wordLower] === 'object') {
                // Add to existing info
                this.wordInfoDict[wordLower].increment(group, count);
            } else {
                // Add new info
                var wordInfo = new WordInfo(group, word, count);
                this.wordInfoDict[wordLower] = wordInfo;
            }
        }

        this.tabulateText = function(groupName, text) {
            var resultArray;
            var groupDict = {};

            // Find all words in the text
            while (true) {
                resultArray = this.regexWord.exec(text);
                if (resultArray === null)
                    break;
                var word = resultArray[0];
                this.addWord(groupDict, word);
            }

            // Copy group dictionary into capitalized words dictionary
            this.capitalizedWords[groupName] = groupDict;
        }

        this.addWord = function(groupDict, word) {
            if (typeof word === "string" && word.length >= 2) {
                var firstLetter = word[0];
                var firstCaps = (firstLetter === firstLetter.toUpperCase());

                if (firstCaps) {
                    this.tabulateWordInDict(groupDict, word);
                } else {
                    this.tabulateWordInDict(this.dictionary, word.toLowerCase());
                }
            }
        }

        this.isInDictionary = function(word, dict) {
            return dict.hasOwnProperty(word.toLowerCase());
        }

        this.countDictionary = function(dict) {
            var sum = 0;
            for (var key in dict) {
                if (dict.hasOwnProperty(key)) {
                    ++sum;
                }
            }
            return sum;
        }

        this.tabulateWordInDict = function(dict, word, count) {
            if (count === undefined)
                count = 1;

            if (dict[word] === undefined) {
                dict[word] = count;
            } else {
                dict[word] += count;
            }
        }

        this.debugWords = function(dict) {
            for (var key in dict) {
                if (dict.hasOwnProperty(key)) {
                    console.log(">> " + dict[key] + " " + key);
                }
            }
        }

        return this;
    }

    return Tabulator;
})();