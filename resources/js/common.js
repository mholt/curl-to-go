initAnalytics();
function initAnalytics()
{
	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

	ga('create', 'UA-86578-22', 'auto');
	ga('send', 'pageview');
}

$(function()
{
	var emptyOutputMsg = "Go code will appear here";
	var formattedEmptyOutputMsg = '<span style="color: #777;">'+emptyOutputMsg+'</span>';

	// Hides placeholder text
	$('#input').on('focus', function() {
		if (!$(this).val())
			$('#output').html(formattedEmptyOutputMsg);
	});

	// Shows placeholder text
	$('#input').on('blur', function() {
		if (!$(this).val())
			$('#output').html(formattedEmptyOutputMsg);
	}).blur();

	// Automatically do the conversion
	$('#input').keyup(function()
	{
		var input = $(this).val();
		if (!input)
		{
			$('#output').html(formattedEmptyOutputMsg);
			return;
		}

		try {
			var output = curlToGo(input);
			if (output) {
				if (typeof gofmt === 'function')
					output = gofmt(output);
				var coloredOutput = hljs.highlight("go", output);
				$('#output').html(coloredOutput.value);
			}
		} catch (e) {
			$('#output').html('<span class="clr-red">'+e+'</span>');
		}
	});

	// Highlights the output for the user
	$('#output').click(function()
	{
		if (document.selection)
		{
			var range = document.body.createTextRange();
			range.moveToElementText(this);
			range.select();
		}
		else if (window.getSelection)
		{
			var range = document.createRange();
			range.selectNode(this);
			var sel = window.getSelection();
			sel.removeAllRanges(); // Required as of Chrome 58: https://www.chromestatus.com/features/6680566019653632
			sel.addRange(range);
		}
	});

	// Fill in examples
	$('#example1').click(function() {
		$('#input').val('curl canhazip.com').keyup();
	});
	$('#example2').click(function() {
		$('#input').val('curl https://api.example.com/surprise \\\n     -u banana:coconuts \\\n     -d "sample data"').keyup();
	});
	$('#example3').click(function() {
		$('#input').val('curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer b7d03a6947b217efb6f3ec3bd3504582" -d \'{"type":"A","name":"www","data":"162.10.66.0","priority":null,"port":null,"weight":null}\' "https://api.digitalocean.com/v2/domains/example.com/records"').keyup();
	});
	$('#example4').click(function() {
		$('#input').val('curl -u "demo" -X POST -d @file1.txt -d @file2.txt https://example.com/upload').keyup();
	});
	$('#example5').click(function() {
		$('#input').val("curl -X POST https://api.easypost.com/v2/shipments \\\n     -u API_KEY: \\\n     -d 'shipment[to_address][id]=adr_HrBKVA85' \\\n     -d 'shipment[from_address][id]=adr_VtuTOj7o' \\\n     -d 'shipment[parcel][id]=prcl_WDv2VzHp' \\\n     -d 'shipment[is_return]=true' \\\n     -d 'shipment[customs_info][id]=cstinfo_bl5sE20Y'").keyup();
	});

});
