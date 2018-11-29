var applicationId = '26D3998A';
var namespace = 'urn:x-cast:lv.mixis.cast.monitor';
var session = null;

var $wrapper = $(".js-wrapper"),
    $currentlyCasting = $(".js-currently-casting"),
    $currentlyChromecast = $(".js-currently-chromecast"),
    $urlToCast = $("#urlToCast"),
    $form = $("#toCast");

/**
 * Call initialization for Cast
 */
window["__onGCastApiAvailable"] = function(loaded, errorInfo) {
    if (loaded) {
        initialize();
    } else {
        console.log(errorInfo);
    }
}

function initialize() {
    initializeCastApi();

    $(".btn-cc-cast", $form).on("click", function(event) {
        console.log('Cast button clicked');
        event.preventDefault();
        sendMessage({
            url: $.trim($urlToCast.val())
        });
    });

    $(".btn-cc-disconnect", $form).on("click", function(event) {
        console.log('Disconnect button clicked');
        event.preventDefault();
        if (session != null) {
            session.leave(onSuccess, onError);
            session = null;
        }

        currentlyCasting({});
    });

    $(".btn-cc-stop", $form).on("click", function(event) {
        console.log('Stop button clicked');
        event.preventDefault();
        if (session != null) {
            session.stop(onSuccess, onError);
            session = null;
        }

        currentlyCasting({});
    });
}

function initializeCastApi() {
    chrome.cast.initialize(
        buildCastConfig(),
        function() { console.log("Initialized"); },
        onError
    );
}

function buildCastConfig() {
    var sessionRequest = new chrome.cast.SessionRequest(applicationId);
    return new chrome.cast.ApiConfig(
        sessionRequest,
        sessionListener,
        receiverListener
    );
}

function onError(message) {
    console.log("onError: ", message);
}

function onSuccess(message) {
    console.log("onSuccess: "+message);
}

/**
 * session listener during initialization
 */
function sessionListener(e) {
    console.log('New session ID:' + e.sessionId);
    console.log(e);

    $currentlyChromecast.text(e.receiver.friendlyName);

    session = e;
    session.addUpdateListener(sessionUpdateListener);
    session.addMessageListener(namespace, receiverMessage);
}

/**
 * listener for session updates
 */
function sessionUpdateListener(isAlive) {
    var message = isAlive ? 'Session Updated' : 'Session Removed';
    if(session != null) {
        message += ': ' + session.sessionId;
        console.log(message);
        if (!isAlive) {
            session = null;
        }
    }
};

/**
 * utility function to log messages from the receiver
 * @param {string} namespace The namespace of the message
 * @param {string} message A message string
 */
function receiverMessage(namespace, message) {
    var data = JSON.parse(message);
    $currentlyCasting.text(data.url);
    console.log("receiverMessage: "+namespace, data);
}

/**
 * receiver listener during initialization
 */
function receiverListener(e) {
    $wrapper[(e == "available" ? "remove" : "add") + "Class"]("receiver-not-found");
    $wrapper[(e == "available" ? "add" : "remove") + "Class"]("receiver-found");
}

/**
 * send a message to the receiver using the custom namespace
 * receiver CastMessageBus message handler will be invoked
 * @param {string} message A message string
 */
function sendMessage(message) {

    console.log(session);

    if (session != null) {
        session.sendMessage(
            namespace,
            message,
            //onSuccess.bind(this, "Message sent (1): " + message),
            function() {
                onSuccess("Message sent  (1): " + message);
                currentlyCasting(message, session);
            },
            onError
        );
    }
    else {
        chrome.cast.requestSession(function(e) {
            session = e;
            session.sendMessage(
                namespace,
                message,
                //onSuccess.bind(this, "Message sent  (2): " + message),
                function() {
                    onSuccess("Message sent  (2): " + message);
                    currentlyCasting(message, session);
                },
                onError
            );
        }, onError);
    }
}

function currentlyCasting(message, session) {
    //console.log(message);
    //console.log(session);

    if(message && message.url) {
        $currentlyCasting.text(message.url);
    } else {
        $currentlyCasting.text('...');
    }

    if(session && session.receiver) {
        $currentlyChromecast.text(session.receiver.friendlyName);
    } else {
        $currentlyChromecast.text('...');
    }
}
