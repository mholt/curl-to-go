/*
	curl-to-Go
	by Matt Holt

	https://github.com/mholt/curl-to-go

	A simple utility to convert curl commands into Go code.
*/

function curlToGo(curl) {
	var err = 'if err != nil {\n\t// handle err\n}\n';
	var deferClose = 'defer resp.Body.Close()\n';
	var promo = "// Generated by curl-to-Go: https://mholt.github.io/curl-to-go";
	var originalCmd = curl.split(/\r\n?|\n/).map((line) => `// ${line}`).join('\n');
	var header = `${promo}\n\n${originalCmd}\n\n`;

	// List of curl flags that are boolean typed; this helps with parsing
	// a command like `curl -abc value` to know whether 'value' belongs to '-c'
	// or is just a positional argument instead.
	var boolOptions = new Set([
		'disable-epsv', 'no-disable-epsv', 'disallow-username-in-url',
		'no-disallow-username-in-url', 'epsv', 'no-epsv', 'npn', 'no-npn', 'alpn', 'no-alpn',
		'compressed', 'no-compressed', 'tr-encoding', 'no-tr-encoding', 'digest', 'no-digest',
		'negotiate', 'no-negotiate', 'ntlm', 'no-ntlm', 'ntlm-wb', 'no-ntlm-wb', 'basic',
		'no-basic', 'anyauth', 'no-anyauth', 'wdebug', 'no-wdebug', 'ftp-create-dirs',
		'no-ftp-create-dirs', 'create-dirs', 'no-create-dirs', 'proxy-ntlm', 'no-proxy-ntlm',
		'crlf', 'no-crlf', 'haproxy-protocol', 'no-haproxy-protocol', 'disable-eprt',
		'no-disable-eprt', 'eprt', 'no-eprt', 'xattr', 'no-xattr', 'ftp-ssl', 'no-ftp-ssl',
		'ssl', 'no-ssl', 'ftp-pasv', 'no-ftp-pasv', 'tcp-nodelay', 'no-tcp-nodelay', 'proxy-digest',
		'no-proxy-digest', 'proxy-basic', 'no-proxy-basic', 'retry-connrefused',
		'no-retry-connrefused', 'proxy-negotiate', 'no-proxy-negotiate', 'proxy-anyauth',
		'no-proxy-anyauth', 'trace-time', 'no-trace-time', 'ignore-content-length',
		'no-ignore-content-length', 'ftp-skip-pasv-ip', 'no-ftp-skip-pasv-ip', 'ftp-ssl-reqd',
		'no-ftp-ssl-reqd', 'ssl-reqd', 'no-ssl-reqd', 'sessionid', 'no-sessionid', 'ftp-ssl-control',
		'no-ftp-ssl-control', 'ftp-ssl-ccc', 'no-ftp-ssl-ccc', 'raw', 'no-raw', 'post301',
		'no-post301', 'keepalive', 'no-keepalive', 'post302', 'no-post302', 'socks5-gssapi-nec',
		'no-socks5-gssapi-nec', 'ftp-pret', 'no-ftp-pret', 'post303', 'no-post303', 'metalink',
		'no-metalink', 'sasl-ir', 'no-sasl-ir', 'test-event', 'no-test-event', 'path-as-is',
		'no-path-as-is', 'tftp-no-options', 'no-tftp-no-options', 'suppress-connect-headers',
		'no-suppress-connect-headers', 'compressed-ssh', 'no-compressed-ssh', 'retry-all-errors',
		'no-retry-all-errors', '0', 'http1.0', 'http1.1', 'http2', 'http2-prior-knowledge',
		'http3', 'http0.9', 'no-http0.9', '1', 'tlsv1', 'tlsv1.0', 'tlsv1.1', 'tlsv1.2', 'tlsv1.3',
		'2', 'sslv2', '3', 'sslv3', '4', 'ipv4', '6', 'ipv6', 'a', 'append', 'no-append', 'B',
		'use-ascii', 'no-use-ascii', 'ssl-allow-beast', 'no-ssl-allow-beast', 'ssl-auto-client-cert',
		'no-ssl-auto-client-cert', 'proxy-ssl-auto-client-cert', 'no-proxy-ssl-auto-client-cert',
		'cert-status', 'no-cert-status', 'doh-cert-status', 'no-doh-cert-status', 'false-start',
		'no-false-start', 'ssl-no-revoke', 'no-ssl-no-revoke', 'ssl-revoke-best-effort',
		'no-ssl-revoke-best-effort', 'tcp-fastopen', 'no-tcp-fastopen', 'proxy-ssl-allow-beast',
		'no-proxy-ssl-allow-beast', 'proxy-insecure', 'no-proxy-insecure', 'proxy-tlsv1',
		'socks5-basic', 'no-socks5-basic', 'socks5-gssapi', 'no-socks5-gssapi', 'f', 'fail',
		'no-fail', 'fail-early', 'no-fail-early', 'styled-output', 'no-styled-output',
		'mail-rcpt-allowfails', 'no-mail-rcpt-allowfails', 'fail-with-body', 'no-fail-with-body',
		'g', 'globoff', 'no-globoff', 'G', 'get', 'h', 'help', 'no-help', 'i', 'include',
		'no-include', 'I', 'head', 'no-head', 'j', 'junk-session-cookies', 'no-junk-session-cookies',
		'J', 'remote-header-name', 'no-remote-header-name', 'k', 'insecure', 'no-insecure',
		'doh-insecure', 'no-doh-insecure', 'l', 'list-only', 'no-list-only', 'L', 'location',
		'no-location', 'location-trusted', 'no-location-trusted', 'M', 'manual', 'no-manual',
		'n', 'netrc', 'no-netrc', 'netrc-optional', 'no-netrc-optional', 'N', 'buffer', 'no-buffer',
		'O', 'remote-name', 'remote-name-all', 'no-remote-name-all', 'p', 'proxytunnel',
		'no-proxytunnel', 'q', 'disable', 'no-disable', 'R', 'remote-time', 'no-remote-time',
		's', 'silent', 'no-silent', 'S', 'show-error', 'no-show-error', 'v', 'verbose', 'no-verbose',
		'V', 'version', 'no-version', 'Z', 'parallel', 'no-parallel', 'parallel-immediate',
		'no-parallel-immediate', '#', 'progress-bar', 'no-progress-bar',
		'progress-meter', 'no-progress-meter', ':', 'next',
		// renamed to --http3 in https://github.com/curl/curl/commit/026840e3
		'http3-direct',
		// replaced by --request-target in https://github.com/curl/curl/commit/9b167fd0
		'strip-path-slash', 'no-strip-path-slash',
		// removed in https://github.com/curl/curl/commit/a8e388dd
		'environment', 'no-environment',
		// curl technically accepted these non-sensical options, they were removed in
		// https://github.com/curl/curl/commit/913c3c8f
		'no-http1.0', 'no-http1.1', 'no-http2', 'no-http2-prior-knowledge',
		'no-tlsv1', 'no-tlsv1.0', 'no-tlsv1.1', 'no-tlsv1.2', 'no-tlsv1.3', 'no-sslv2', 'no-sslv3',
		'no-ipv4', 'no-ipv6', 'no-proxy-tlsv1', 'no-get', 'no-remote-name', 'no-next',
		// removed in https://github.com/curl/curl/commit/720ea577
		'proxy-sslv2', 'no-proxy-sslv2', 'proxy-sslv3', 'no-proxy-sslv3',
		// removed in https://github.com/curl/curl/commit/388c6b5e
		// I don't think this was ever a real short option
		// '~',
		// renamed to --http2 in https://github.com/curl/curl/commit/0952c9ab
		'http2.0', 'no-http2.0',
		// removed in https://github.com/curl/curl/commit/ebf31389
		// I don't think this option was ever released, it was renamed the same day
		// it was introduced
		// 'ssl-no-empty-fragments', 'no-ssl-no-empty-fragments',
		// renamed to --ntlm-wb in https://github.com/curl/curl/commit/b4f6319c
		'ntlm-sso', 'no-ntlm-sso',
		// all options got "--no-" versions in https://github.com/curl/curl/commit/5abfdc01
		// renamed to --no-keepalive in https://github.com/curl/curl/commit/f866af91
		'no-keep-alive',
		// may've been short for --crlf until https://github.com/curl/curl/commit/16643faa
		// '9',
		// removed in https://github.com/curl/curl/commit/07660eea
		// -@ used to be short for --create-dirs
		'ftp-ascii', // '@',
		// removed in https://github.com/curl/curl/commit/c13dbf7b
		// 'c', 'continue',
		// removed in https://github.com/curl/curl/commit/a1d6ad26
		// -t used to be short for --upload
		// 't', 'upload',
	]);

	if (!curl.trim())
		return;
	var cmd = parseCommand(curl, { boolFlags: boolOptions });

	if (cmd._[0] != "curl")
		throw "Not a curl command";

	var req = extractRelevantPieces(cmd);

	if (Object.keys(req.headers).length == 0 && !req.data.ascii && !req.data.files && !req.basicauth && !req.insecure) {
		return header+renderSimple(req.method, req.url);
	} else {
		return header+renderComplex(req);
	}


	// renderSimple renders a simple HTTP request using net/http convenience methods
	function renderSimple(method, url) {
		if (method == "GET")
			return 'resp, err := http.Get('+goExpandEnv(url)+')\n'+err+deferClose;
		else if (method == "POST")
			return 'resp, err := http.Post('+goExpandEnv(url)+', "", nil)\n'+err+deferClose;
		else if (method == "HEAD")
			return 'resp, err := http.Head('+goExpandEnv(url)+')\n'+err+deferClose;
		else
			return 'req, err := http.NewRequest('+goExpandEnv(method)+', '+goExpandEnv(url)+', nil)\n'+err+'resp, err := http.DefaultClient.Do(req)\n'+err+deferClose;
	}

	// renderComplex renders Go code that requires making a http.Request.
	function renderComplex(req) {
		var go = "";

		// init client name
		var clientName = "http.DefaultClient";

		// insecure
		// -k or --insecure
		if (req.insecure) {
			go += '// TODO: This is insecure; use only in dev environments.\n';
			go += 'tr := &http.Transport{\n' +
				'        TLSClientConfig: &tls.Config{InsecureSkipVerify: true},\n' +
				'    }\n' +
				'    client := &http.Client{Transport: tr}\n\n';

			clientName = "client";
		}

		// load body data
		// KNOWN ISSUE: -d and --data are treated like --data-binary in
		// that we don't strip out carriage returns and newlines.
		var defaultPayloadVar = "body";
		if (!req.data.ascii && !req.data.files) {
			// no data; this is easy
			go += 'req, err := http.NewRequest("'+req.method+'", '+goExpandEnv(req.url)+', nil)\n'+err;
		} else {
			var ioReaders = [];

			// if there's text data...
			if (req.data.ascii) {
				var stringBody = function() {
					if (req.dataType == "raw" ) {
						go += defaultPayloadVar+' := strings.NewReader("'+req.data.ascii.replace(/\"/g, "\\\"") +'")\n'
					} else {
						go += defaultPayloadVar+' := strings.NewReader(`'+req.data.ascii+'`)\n'
					}
					ioReaders.push(defaultPayloadVar);
				}

				if (req.headers["Content-Type"] && req.headers["Content-Type"].indexOf("json") > -1) {
					// create a struct for the JSON
					var result = jsonToGo(req.data.ascii, "Payload");
					if (result.error)
						stringBody(); // not valid JSON, so just treat as a regular string
					else if (result.go) {
						// valid JSON, so create a struct to hold it
						go += result.go+'\n\ndata := Payload {\n\t// fill struct\n}\n';
						go += 'payloadBytes, err := json.Marshal(data)\n'+err;
						go += defaultPayloadVar+' := bytes.NewReader(payloadBytes)\n\n';
					}
				} else if(req.headers["Content-Type"] && req.headers["Content-Type"] == "application/x-www-form-urlencoded") {
						go += "params := url.Values{}\n"
						var params = new URLSearchParams(req.data.ascii);
						params.forEach(function(fvalue, fkey){
							go += 'params.Add("' + fkey + '", `' + fvalue + '`)\n' 
						});
						go += defaultPayloadVar+ ' := strings.NewReader(params.Encode())\n\n'
				}else {
					// not a json Content-Type, so treat as string
					stringBody();
				}
			}

			// if file data...
			if (req.data.files && req.data.files.length > 0) {
				var varName = "f";
				for (var i = 0; i < req.data.files.length; i++) {
					var thisVarName = (req.data.files.length > 1 ? varName+(i+1) : varName);
					go += thisVarName+', err := os.Open('+goExpandEnv(req.data.files[i])+')\n'+err;
					go += 'defer '+thisVarName+'.Close()\n';
					ioReaders.push(thisVarName);
				}
			}

			// render go code to put all the data in the body, concatenating if necessary
			var payloadVar = defaultPayloadVar;
			if (ioReaders.length > 0)
				payloadVar = ioReaders[0];
			if (ioReaders.length > 1) {
				payloadVar = "payload";
				// KNOWN ISSUE: The way we separate file and ascii data values
				// loses the order between them... our code above just puts the
				// ascii values first, followed by the files.
				go += 'payload := io.MultiReader('+ioReaders.join(", ")+')\n';
			}
			go += 'req, err := http.NewRequest("'+req.method+'", '+goExpandEnv(req.url)+', '+payloadVar+')\n'+err;
		}

		// set basic auth
		if (req.basicauth) {
			go += 'req.SetBasicAuth('+goExpandEnv(req.basicauth.user)+', '+goExpandEnv(req.basicauth.pass)+')\n';
		}

		// if a Host header was set, we need to specify that specially
		// (see the godoc for the http.Request.Host field) - issue #15
		if (req.headers["Host"]) {
			go += 'req.Host = "'+req.headers["Host"]+'"\n';
			delete req.headers["Host"];
		}

		// set headers
		for (var name in req.headers) {
			go += 'req.Header.Set('+goExpandEnv(name)+', '+goExpandEnv(req.headers[name])+')\n';
		}

		// execute request
		go += "\nresp, err := "+clientName+".Do(req)\n";
		go += err+deferClose;

		return go;
	}

	// extractRelevantPieces returns an object with relevant pieces
	// extracted from cmd, the parsed command. This accounts for
	// multiple flags that do the same thing and return structured
	// data that makes it easy to spit out Go code.
	function extractRelevantPieces(cmd) {
		var relevant = {
			url: "",
			method: "",
			headers: [],
			data: {},
			dataType: "string",
			insecure: false
		};

		// prefer --url over unnamed parameter, if it exists; keep first one only
		if (cmd.url && cmd.url.length > 0)
			relevant.url = cmd.url[0];
		else if (cmd._.length > 1)
			relevant.url = cmd._[1]; // position 1 because index 0 is the curl command itself

		// gather the headers together
		if (cmd.H)
			relevant.headers = relevant.headers.concat(cmd.H);
		if (cmd.header)
			relevant.headers = relevant.headers.concat(cmd.header);
		relevant.headers = parseHeaders(relevant.headers)

		// set method to HEAD?
		if (cmd.I || cmd.head)
			relevant.method = "HEAD";

		// between -X and --request, prefer the long form I guess
		if (cmd.request && cmd.request.length > 0)
			relevant.method = cmd.request[cmd.request.length-1].toUpperCase();
		else if (cmd.X && cmd.X.length > 0)
			relevant.method = cmd.X[cmd.X.length-1].toUpperCase(); // if multiple, use last (according to curl docs)
		else if (
			(cmd["data-binary"] && cmd["data-binary"].length > 0)
			|| (cmd["data-raw"] && cmd["data-raw"].length > 0)
		 ) {
			 // for --data-binary and --data-raw, use method POST & data-type raw
			relevant.method = "POST";
			relevant.dataType = "raw";
		}

		// join multiple request body data, if any
		var dataAscii = [];
		var dataFiles = [];
		var loadData = function (d, dataRawFlag = false) {
			if (!relevant.method)
				relevant.method = "POST";

			// according to issue #8, curl adds a default Content-Type
			// header if one is not set explicitly
			if (!relevant.headers["Content-Type"])
				relevant.headers["Content-Type"] = "application/x-www-form-urlencoded";

			for (var i = 0; i < d.length; i++) {
				if (
					d[i].length > 0 && d[i][0] == "@"
					&& !dataRawFlag // data-raw flag ignores '@' character
				) {
					dataFiles.push(d[i].substr(1));
				} else {
					dataAscii.push(d[i]);
				}
			}
		};
		if (cmd.d)
			loadData(cmd.d);
		if (cmd.data)
			loadData(cmd.data);
		if (cmd["data-binary"])
			loadData(cmd["data-binary"]);
		if (cmd["data-raw"])
			loadData(cmd["data-raw"], true)
		if (dataAscii.length > 0)
			relevant.data.ascii = dataAscii.join("&");
		if (dataFiles.length > 0)
			relevant.data.files = dataFiles;

		// between -u and --user, choose the long form...
		var basicAuthString = "";
		if (cmd.user && cmd.user.length > 0)
			basicAuthString = cmd.user[cmd.user.length-1];
		else if (cmd.u && cmd.u.length > 0)
			basicAuthString = cmd.u[cmd.u.length-1];
		// if the -u or --user flags haven't been set then don't set the
		// basicauth property.
		if (basicAuthString) {
			var basicAuthSplit = basicAuthString.indexOf(":");
			if (basicAuthSplit > -1) {
				relevant.basicauth = {
					user: basicAuthString.substr(0, basicAuthSplit),
					pass: basicAuthString.substr(basicAuthSplit+1)
				};
			} else {
				// the user has not provided a password
				relevant.basicauth = { user: basicAuthString, pass: "<PASSWORD>" };
			}
		}

		// default to GET if nothing else specified
		if (!relevant.method)
			relevant.method = "GET";

		if (cmd.k || cmd.insecure) {
			relevant.insecure = true;
		}

		return relevant;
	}

	// parseHeaders converts an array of header strings (like "Content-Type: foo")
	// into a map of key/values. It assumes header field names are unique.
	function parseHeaders(stringHeaders) {
		var headers = {};
		for (var i = 0; i < stringHeaders.length; i++) {
			var split = stringHeaders[i].indexOf(":");
			if (split == -1) continue;
			var name = stringHeaders[i].substr(0, split).trim();
			var value = stringHeaders[i].substr(split+1).trim();
			headers[toTitleCase(name)] = value;
		}
		return headers;
	}

	function toTitleCase(str) {
		return str.replace(/\w*/g, function(txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
	}

	// goExpandEnv adds surrounding quotes around s to make it a Go string,
	// escaping any characters as needed. It checks to see if s has an
	// environment variable in it. If so, it returns s wrapped in a Go
	// function that expands the environment variable. Otherwise, it
	// returns s wrapped in quotes and escaped for use in Go strings.
	// s should not already be escaped! This function always returns a Go
	// string value.
	function goExpandEnv(s) {
		var pos = s.indexOf("$");
		if (pos > -1)
		{
			if (pos > 0 && s[pos-1] == '\\') {
				// The $ is escaped, so strip the escaping backslash
				s = s.substr(0, pos-1) + s.substr(pos);
			} else {
				// $ is not escaped, so treat it as an env variable
				return 'os.ExpandEnv("'+goEsc(s)+'")';
			}
		}
		return '"'+goEsc(s)+'"';
	}

	// goEsc escapes characters in s so that it is safe to use s in
	// a "quoted string" in a Go program
	function goEsc(s) {
		return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
	}
}


function parseCommand(input, options) {
	if (typeof options === 'undefined') {
		options = {};
	}

	var result = {_: []}, // what we return
	    cursor = 0,       // iterator position
	    token = "";       // current token (word or quoted string) being built

	// trim leading $ or # that may have been left in
	input = input.trim();
	if (input.length > 2 && (input[0] == '$' || input[0] == '#') && whitespace(input[1]))
		input = input.substr(1).trim();

	for (cursor = 0; cursor < input.length; cursor++) {
		skipWhitespace();
		if (input[cursor] == "-") {
			flagSet();
		} else {
			unflagged();
		}
	}

	return result;




	// flagSet handles flags and it assumes the current cursor
	// points to a first dash.
	function flagSet() {
		// long flag form?
		if (cursor < input.length-1 && input[cursor+1] == "-") {
			return longFlag();
		}

		// if not, parse short flag form
		cursor++; // skip leading dash
		while (cursor < input.length && !whitespace(input[cursor]))
		{
			var flagName = input[cursor];
			if (typeof result[flagName] == 'undefined') {
				result[flagName] = [];
			}
			cursor++; // skip the flag name
			if (boolFlag(flagName))
				result[flagName] = true;
			else if (Array.isArray(result[flagName]))
				result[flagName].push(nextString());
		}
	}

	// longFlag consumes a "--long-flag" sequence and
	// stores it in result.
	function longFlag() {
		cursor += 2; // skip leading dashes
		var flagName = nextString("=");
		if (boolFlag(flagName))
			result[flagName] = true;
		else {
			if (typeof result[flagName] == 'undefined') {
				result[flagName] = [];
			}
			if (Array.isArray(result[flagName])) {
				result[flagName].push(nextString());
			}
		}
	}

	// unflagged consumes the next string as an unflagged value,
	// storing it in the result.
	function unflagged() {
		result._.push(nextString());
	}

	// boolFlag returns whether a flag is known to be boolean type
	function boolFlag(flag) {
		if (options.boolFlags instanceof Set) {
			return options.boolFlags.has(flag);
		}
		if (Array.isArray(options.boolFlags)) {
			for (var i = 0; i < options.boolFlags.length; i++) {
				if (options.boolFlags[i] == flag)
					return true;
			}
		}
		return false;
	}

	// nextString skips any leading whitespace and consumes the next
	// space-delimited string value and returns it. If endChar is set,
	// it will be used to determine the end of the string. Normally just
	// unescaped whitespace is the end of the string, but endChar can
	// be used to specify another end-of-string. This function honors \
	// as an escape character and does not include it in the value, except
	// in the special case of the \$ sequence, the backslash is retained
	// so other code can decide whether to treat as an env var or not.
	function nextString(endChar) {
		skipWhitespace();

		var str = "";

		var quoted = false,
			quoteCh = "",
			escaped = false;
		quoteDS = false; // Dollar-Single-Quotes

		for (; cursor < input.length; cursor++) {
			if (quoted) {
				if (input[cursor] == quoteCh && !escaped && input[cursor -1] != "\\") {
					quoted = false;
					continue;
				}
			}
			if (!quoted) {
				if (!escaped) {
					if (whitespace(input[cursor])) {
						return str;
					}
					if (input[cursor] == '"' || input[cursor] == "'") {
						quoted = true;
						quoteCh = input[cursor];
						if (str + quoteCh == "$'") {
							quoteDS = true
							str = ""
						}
						cursor++;
					}
					if (endChar && input[cursor] == endChar) {
						cursor++; // skip the endChar
						return str;
					}
				}
			}
			if (!escaped && !quoteDS && input[cursor] == "\\") {
				escaped = true;
				// skip the backslash unless the next character is $
				if (!(cursor < input.length-1 && input[cursor+1] == '$'))
					continue;
			}

			str += input[cursor];
			escaped = false;
		}

		return str;
	}

	// skipWhitespace skips whitespace between tokens, taking into account escaped whitespace.
	function skipWhitespace() {
		for (; cursor < input.length; cursor++) {
			while (input[cursor] == "\\" && (cursor < input.length-1 && whitespace(input[cursor+1])))
				cursor++;
			if (!whitespace(input[cursor]))
				break;
		}
	}

	// whitespace returns true if ch is a whitespace character.
	function whitespace(ch) {
		return ch == " " || ch == "\t" || ch == "\n" || ch == "\r";
	}
}
