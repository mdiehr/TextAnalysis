(function() {
    var statusElement = document.getElementById('status');
    if (!window.FileReader) {
        if (statusElement) {
            statusElement.innerHTML = 'Your browser does not support the HTML5 FileReader.';
        }
        return;
    }

    var drop = document.getElementById('status');
    var status = document.getElementById('status');
    var filesContainer = document.getElementById('files-container');
    var resultsContainer = document.getElementById('results-container');
    var filesList = document.getElementById('files-body');
    var resultsList = document.getElementById('results-body');

    var allowedTypes = {
        'text/plain': true,
        'text/html': true,
        'text/css': true,
        'application/javascript': true
    };

    var classUn = 'alert-warning';
    var classHi = 'alert-info';
    var classSuccess = 'alert-success';
    var messageDefault = "Drag and drop a text file here to analyze it.";
    var messageDrop = "Drop the file to begin.";

    var resultTabulator = null;

    var initializeDropTarget = function() {
        // Initial status message
        setStatus(classUn, messageDefault);

        // Tells the browser that we *can* drop on this target
        addEventHandler(drop, 'dragover', cancel);
        addEventHandler(drop, 'dragenter', cancel);

        // Highlighting/instruction events
        addEventHandler(drop, 'dragenter', setStatus.bind(null, classHi, messageDrop));
        addEventHandler(drop, 'dragexit', setStatus.bind(null, classUn, messageDefault));
        addEventHandler(drop, 'dragleave', setStatus.bind(null, classUn, messageDefault));
        addEventHandler(drop, 'dragcancel', setStatus.bind(null, classUn, messageDefault));

        addEventHandler(drop, 'drop', handleDrop);
    }

    var handleDrop = function(e) {
        e = e || window.event; // get window.event if e argument missing (in IE)   
        cancel(e);

        // Remove items
        clearResultsAndFiles();

        // Create tabulator with custom dictionary
        resultTabulator = new Tabulator(dictionary_whitelist);

        var dt = e.dataTransfer;
        var files = dt.files;
        var plural = files.length === 1 ? '' : 's';
        setStatus(classHi, 'Loading ' + files.length + ' file' + plural + '...');
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var reader = new FileReader();
            reader.readAsDataURL(file);
            var groupName = String.fromCharCode("A".charCodeAt(0)+i);
            addEventHandler(reader, 'loadend', processFile.bindToEventHandler(files, file, groupName));
        }

        return false;
    }

    var processFile = function(e, files, file, groupName) {
        var success = true;
        if (allowedTypes[file.type] !== true) {
            success = false;
        } else {
            var bin = this.result;
            var fileInfo = bin.split(',');
            var text = atob(fileInfo[fileInfo.length - 1]);
            resultTabulator.addText(text, file.name, groupName);
            success = true;
        }

        var kb = Math.ceil(file.size / 1024);
        var text = (success ? '<b>+</b>' : '<b>-</b>') + ' ' + file.type + ' ' + file.name + ' ' + kb + ' kB';
        var className = "group-"+groupName;
        addFile(text, className);

        var fileNumber = filesList.getElementsByTagName('div').length;
        if (files.length === fileNumber) {
            processDone();
        }
    };

    var processDone = function() {
        setStatus(classSuccess, 'Done loading. ' + messageDefault);
        var information = resultTabulator.tabulate();

        addResult("Number of proper nouns: " + information.length);
        addResult("<h4>Top names:</h4>");
        var topInfos = information.slice(0, 1000);
        for (var i = 0, imax = topInfos.length; i < imax; ++i) {
            var info = topInfos[i];
            addResult("<b>" + (i + 1).toString() + ".</b> " + " " + info.word
                + " (<span class='group'>" + info.getCounts() + "</span>)");
        }
    }

    var addResult = function(text) {
        resultsContainer.style.display = "block";
        var newDiv = document.createElement('div');
        newDiv.innerHTML = text;
        resultsList.appendChild(newDiv);
    }

    var addFile = function(text, className) {
        filesContainer.style.display = "block";
        var newDiv = document.createElement('div');
        newDiv.innerHTML = text;
        if (className != undefined) {
            newDiv.classList.add(className);
        }
        filesList.appendChild(newDiv);
    }

    var clearResultsAndFiles = function() {
        while (resultsList.firstChild)
            resultsList.removeChild(resultsList.firstChild);
        while (filesList.firstChild)
            filesList.removeChild(filesList.firstChild);
    }

    var setStatus = function(className, text) {
        if (className != classHi)
            status.classList.remove(classHi);
        if (className != classUn)
            status.classList.remove(classUn);
        if (className != classSuccess)
            status.classList.remove(classSuccess);
        status.classList.add(className);
        status.innerHTML = text;
    }

    function cancel(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        return false;
    }

    Function.prototype.bindToEventHandler = function bindToEventHandler() {
        var handler = this;
        var boundParameters = Array.prototype.slice.call(arguments);
        //create closure
        return function(e) {
            e = e || window.event; // get window.event if e argument missing (in IE)   
            boundParameters.unshift(e);
            handler.apply(this, boundParameters);
        }
    };

    function addEventHandler(obj, evt, handler) {
        if (obj.addEventListener) {
            // W3C method
            obj.addEventListener(evt, handler, false);
        } else if (obj.attachEvent) {
            // IE method.
            obj.attachEvent('on' + evt, handler);
        } else {
            // Old school method.
            obj['on' + evt] = handler;
        }
    }

    // Start everything
    addEventHandler(window, 'load', initializeDropTarget);
})();
