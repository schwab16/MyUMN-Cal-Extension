//////////////////////////////////////////////////////////
// University of Minnesota Schedule to Calendar Export	//								
// (c) 2016 Isaac Schwab								//	
// Allows users to download an ICS calendar file		//							
//														//
//////////////////////////////////////////////////////////
//$(document.body).append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.96.1/css/materialize.min.css">');
//Load document and initalize jQuery
$(function(){
  	//$('.modal-trigger').leanModal();
  	//The following functions are used to format data for ICS format//

	var timezone = 'America/Chicago';

  	// Date object -> '19920517'
  	function getDateString(date) {
    	var m = date.getMonth() + 1;
    	if (m < 10) m = '0' + m;

    	var d = date.getDate();
    	if (d < 10) d = '0' + d;
    
    	return '' + date.getFullYear() + m + d;
  	}

  	// '4:30PM' -> '163000'
  	function getTimeString(time) {
    	var timeString = time.substr(0, time.length - 2);
    	var parts = timeString.split(':');
    	if (parts[0].length != 2) {
      		parts[0] = '0' + parts[0];
    	}
    	timeString = parts.join('') + '00';
    	if (time.match(/PM/) && parts[0] != 12) {
      		timeString = (parseInt(timeString, 10) + 120000).toString();
    	}
    	return timeString;
  	}

  	// Date object, '4:30PM' -> '19920517T163000'
  	function getDateTimeString(date, time) {
    	return getDateString(date) + 'T' + getTimeString(time);
  	}

	// Default webpage: MTWThF convert to ICS: MO,TU,WE,TH,FR
  	function formatDays(x) {
		var ans = [];
		if (x.match(/S[^a]/)) 
			ans.push('SU');

		if (x.match(/M/))     
			ans.push('MO');

		if (x.match(/T[^h]/)) 
			ans.push('TU');

		if (x.match(/W/))     
			ans.push('WE');

		if (x.match(/Th/))    
			ans.push('TH');

		if (x.match(/F/))     
			ans.push('FR');

		if (x.match(/S[^u]/)) 
			ans.push('SA');

		return ans.join(',');
	}

	//this is the generic template required for the ICS file format
	function packageICS(icsData)
	{
		var icsFinal = checkCheckbox(icsData); //gets the raw data for the checked classes and inserts it into template
		var result = 'BEGIN:VCALENDAR\n' +
      				'VERSION:2.0\n' +
      				'PRODID:-//Isaac S./UMN Class Schedule Export//EN\n' +
      				icsFinal +
      				'END:VCALENDAR\n';
      	return result;
	}

	//checks the state of the checkboxes in the modal popup
	function checkCheckbox(icsData){
		var finalData = '';
		for(var i = 0; i < icsData.length; i++)//iterates through dictionary
		{
			var classValue = icsData[i].key; //unique value for checkbox
			console.log(classValue);
			$('input[value="' + classValue + '"]');
			console.log($('input[value="' + classValue + '"]').is(':checked'));
			//console.log($("input[value='" + classValue + "']").prop("checked"));
			// var isChecked = $("input[value='" + classValue + "']").is(":checked"); //checks if specific checkbox is checked
			// if(isChecked)
			// {
			 	finalData += icsData[i].value; //if it is checked we add the value data to the finalICS content
			// }
		}
		return finalData;
	}

	//Create a list html element for modal display
	function makeUL(elements) {
	    // Create the list element:
	    var form = document.createElement('form');

	    /*for(var i = 0; i < array.length; i++) {
	        // Create the list item
	        var input = '<input type="checkbox" name="class" value="' + i + '"" > '+ classDisp + '(' + component + ')' + '<br>';
	        var item = document.createElement('input');

	        // Set its contents:
	        //item.appendChild(document.createTextNode(array[i]));

	        // Add it to the list:
	        
	    }*/
	    form.appendChild(elements);
	    // Finally, return the constructed list:
	    return form;
	}



	//this array will contain all the classes that we will parse through below
	var icsFile = [];
	var modalArray = [];
	var modalContent = '<form>';
	console.log("Here");

	//selects each class element
   $('.PSGROUPBOXWBO').each(function() {
   		console.log("true");
	   	//first grab the name of the class
	   	var className = $(this).find('.PAGROUPDIVIDER').text().split('-');
	   	var classDisp = className[0];
	   	var classDesc = className[1];
	   	console.log(className);
	   	//next we grab the container with all the class data
	   	var classData = $(this).find('.PSLEVEL3GRIDNBO').find('tr');
	   	var makeNewColumn = $(this).find('.PSLEVEL3GRIDCOLUMNHDR');
	   	// makeNewColumn.each(function(){
	   	// 	var colCheck = $(this).text();
	   	// 	if(colCheck == "Start/End Date")
	   	// 	{
	   	// 		$('<th scope="col" abbr="Download" width="80" align="left" class="PSLEVEL3GRIDCOLUMNHDR">Download</th>').after(this);
	   	// 	}
	   	// })
	   	//iterate through class data to get details
	   	classData.each(function() 
	   	{
      
		  	var classNumber = $(this).find('span[id*="DERIVED_CLS_DTL_CLASS_NBR"]').text();   
		  	if(classNumber)//makes sure we have valid data
		  	{
		  		var datetime = $(this).find('span[id*="MTG_SCHED"]').text();
		  		var times = datetime.match(/\d\d?:\d\d[AP]M/g); //use regex to grab start and end time in array

		      	if(times)//again check if we have data
		      	{
		      		var days = formatDays(datetime.match(/[A-Za-z]*/)[0]);
		      		console.log(days);
		      		var startTime = times[0];
		      		var endTime = times[1];

		      		var section       = $(this).find('a[id*="MTG_SECTION"]').text();
		          	var component     = $(this).find('span[id*="MTG_COMP"]').text();
		          	var room          = $(this).find('span[id*="MTG_LOC"]').text();
		          	var instructor    = $(this).find('span[id*="DERIVED_CLS_DTL_SSR_INSTR_LONG"]').text();

		          	//here we begin to parse the start and end date of the class
		          	var startEndDate  = $(this).find('span[id*="MTG_DATES"]').text();
		          	//first 10 characters encompass the start time in format of 09/06/2016 -> then set this as a date object
		          	var startDate = new Date(startEndDate.substring(0, 10));
          			//handles issue if the start date does not line up with day of week
          			//example being this semester starts on a Tuesday, however the class is a MWF class
          			startDate.setDate(startDate.getDate() - 1);

          			//get end date of class handling similar error as above by adding 1 to end date
          			var endDate = new Date(startEndDate.substring(13, 23));
          			endDate.setDate(endDate.getDate() + 1);


          			var icsSingle =
			            'BEGIN:VEVENT\n' +
			            'DTSTART;TZID=' + timezone + ':' + getDateTimeString(startDate, startTime) + '\n' +
			            'DTEND;TZID=' + timezone + ':' + getDateTimeString(startDate, endTime) + '\n' +
			            'LOCATION:' + room + '\n' +
			            'RRULE:FREQ=WEEKLY;UNTIL=' + getDateTimeString(endDate, endTime) + 'Z;BYDAY=' + days + '\n' +
			            'EXDATE;TZID=' + timezone + ':' + getDateTimeString(startDate, startTime) + '\n' +
			            'SUMMARY:'  + classDisp + '(' + component + ')\n' +
			            'DESCRIPTION:' +
			              'Course Name: '    + className + '\\n' +
			              'Section: '        + section + '\\n' +
			              'Instructor: '     + instructor + '\\n' +
			              'Component: '      + component + '\\n' +
			              'Class Number: '   + classNumber + '\\n' +
			              'Days/Times: '     + datetime + '\\n' +
			              'Start/End Date: ' + startEndDate + '\\n' +
			              'Location: '       + room + '\\n\n' +
			            'END:VEVENT\n';

			        //delete any acidental double spaces
			        icsSingle = icsSingle.replace(/\s{2,}/g, ' ');
			        console.log(icsSingle);

			        //var modalElement = 
			        modalContent += '<input type="checkbox" name="class" value="' + classNumber + '" checked="checked"> '+ classDisp + '(' + component + ') - ' + datetime + '<br>';
			        //modalArray.push()

			        //add the individual class to the download file
			        icsFile.push({key:classNumber,value:icsSingle});
			        console.log(icsFile);
			        console.log("Key: " + icsFile[0].key);
			        console.log("Value: " + icsFile[0].value);


			        $(this).find('span[id*="MTG_DATES"]').append(
            			'<br><a href="#" onclick="window.open(\'data:text/calendar;charset=utf8,' +
            			encodeURIComponent(packageICS(icsFile)) +
            			'\');">Download Class</a>'
          			);

		      	}	      
		    }
		});


  	});

	console.log(packageICS(icsFile));

	//var formList = makeUL(modalContent);
	modalContent += '</form>';
	console.log(modalContent);
	//console.log(formList);




	//HTML for modal popup
  	var html = '<!-- Trigger the modal with a button -->' +
				'<button type="button" class="btn btn-info btn-lg" data-toggle="modal" data-target="#myModal">Export Calendar</button>' +

				'<!-- Modal -->' +
				'<div id="myModal" class="modal fade" role="dialog">' +
				  '<div class="modal-dialog">' +

				    '<!-- Modal content-->' +
				    '<div class="modal-content">' +
				      '<div class="modal-header">' +
				        '<button type="button" class="close" data-dismiss="modal">&times;</button>' +
				        '<h4 class="modal-title">UMN Calendar Export for Google Calendar or iCal</h4>' +
				      '</div>' +
				      '<div class="modal-body">' +
				        modalContent +
				      '</div>' +
				      '<div class="modal-footer">' +
				        '<button type="button" class="btn btn-default" data-dismiss="modal">Export</button>' +
				        '<button type="button" class="btn btn-default" data-dismiss="modal">Download for iCal</button>' +
				      '</div>' +
				    '</div>' +

				  '</div>' +
				'</div>'


  	console.log(html);
  	//Insert modal html under My Class Schedule text
	$('.PATRANSACTIONTITLE').append(html);

});
