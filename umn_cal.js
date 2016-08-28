//////////////////////////////////////////////////////////
// University of Minnesota Schedule to Calendar Export	//								
// (c) 2016 Isaac Schwab								//	
// Allows users to download an ICS calendar file		//							
//														//
//////////////////////////////////////////////////////////
//Load document and initalize jQuery
$(function(){
  	
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

	//checks the state of the checkboxes in the modal popup, and then selects data of for checked class
	function checkCheckbox(icsData){
		var finalData = '';
		for(var i = 0; i < icsData.length; i++)//iterates through dictionary
		{
			var classValue = icsData[i].key; //unique value for checkbox
			var isChecked = document.getElementById(classValue).checked; //checks if specific checkbox is checked
			if(isChecked)
			{
				finalData += icsData[i].value; //if it is checked we add the value data to the finalICS content
			}
		}
		return finalData;
	}


	//Main part of the script, first we check to make sure we are on the correct tab within the MyU system. We want to be on My Class Schedule
	//If we are then we run the script, otherwise do nothing because we are on the incorrect tab
	if($('.PATRANSACTIONTITLE:contains("My Class Schedule")').text()== "My Class Schedule")
	{
		//this array will contain all the classes that we will parse through below, is an array that acts like a dict
		var icsFile = [];

		//modal content will contain html for checkbox list, we will inject it into the modal
		var modalContent = '<form>';

		//selects each class element
		$('.PSGROUPBOXWBO').each(function() {
		   	//first grab the name of the class
		   	var className = $(this).find('.PAGROUPDIVIDER').text().split('-');
		   	var classDisp = className[0];
		   	var classDesc = className[1];

		   	//next we grab the container with all the class data
		   	var classData = $(this).find('.PSLEVEL3GRIDNBO').find('tr');

		   	//iterate through class data to get details (breaks up class block into lecture and discussion)
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

				        //add each class element to the checkbox list for theh modal
				        modalContent += '<input type="checkbox" name="class" id="' + classNumber + '" checked="checked"> '+ classDisp + '(' + component + ') - ' + datetime + '<br>';

				        //add the individual class to the download file, using dict object to easily search by class number for checkbox selection
				        icsFile.push({key:classNumber,value:icsSingle});
				        
				        //console.log(icsFile);
			      	}//end of times if     
			    }//end of classNumber if
			});//end of iterating through a class block
			});//end of iterating through schedule (should have all the data we need now)



		//finish the modalConent html
		modalContent += '</form>';
		// console.log(modalContent);

		//HTML for modal popup, modalContent is inserted into the body
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
				        //'<button type="button" class="btn btn-default" data-dismiss="modal" id="Export">Export</button>' +
				        '<button type="button" class="btn btn-default" data-dismiss="modal" id="Download">Download Calendar File</button>' +
				      '</div>' +
				    '</div>' +

				  '</div>' +
				'</div>';



		//Insert modal html under My Class Schedule text
		$('.PATRANSACTIONTITLE:contains("My Class Schedule")').append(html);

		//Handle on click events for button
		var download = document.getElementById("Download");
		download.addEventListener('click', function(event) {
		window.open('data:text/calendar;charset=utf8,' + encodeURIComponent(packageICS(icsFile)));
		});

		console.log(packageICS(icsFile));

	}//End of if checking that we are on the My Class Schedule Tab
});//End of file
