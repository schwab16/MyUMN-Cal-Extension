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
		var result = 'BEGIN:VCALENDAR\n' +
      				'VERSION:2.0\n' +
      				'PRODID:-//Isaac S./UMN Class Schedule Export//EN\n' +
      				icsData +
      				'END:VCALENDAR\n';
	}


	//this array will contain all the classes that we will parse through below
	var icsFile = [];

	//selects each class element
   $('.PSGROUPBOXWBO').each(function() {
	   	//first grab the name of the class
	   	var className = $(this).find('.PAGROUPDIVIDER').text().split('-');
	   	var classDisp = className[0];
	   	var classDesc = className[1];
	   	console.log(className);
	   	//next we grab the container with all the class data
	   	var classData = $(this).find('.PSLEVEL3GRIDNBO').find('tr');
	   	var makeNewColumn = $(this).find('.PSLEVEL3GRIDCOLUMNHDR');
	   	makeNewColumn.each(function(){
	   		var colCheck = $(this).text();
	   		if(colCheck == "Start/End Date")
	   		{
	   			$('<th scope="col" abbr="Download" width="80" align="left" class="PSLEVEL3GRIDCOLUMNHDR">Download</th>').after(this);
	   		}
	   	})
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

			        //add the individual class to the download file
			        icsFile.push(icsSingle);

			        var format = document.createElement('br');
			        var checkbox = document.createElement('input');
					checkbox.type = "checkbox";
					checkbox.name = "name";
					checkbox.value = "value";
					checkbox.id = "id";

					var label = document.createElement('label');
					label.htmlFor = "id";
					label.appendChild(document.createTextNode('text for label after checkbox'));

					//$(this).find('>Start/End Date</th>').append('<th scope="col" abbr="Start/End Date" width="80" align="left" class="PSLEVEL3GRIDCOLUMNHDR">Fuck</th>');
					//id='span[id*="trCLASS_MTG_VW"]'

					$(this).find('span[id*="MTG_DATES"]').append(format);
					$(this).find('span[id*="MTG_DATES"]').append(checkbox);
					$().find('[id^="trCLASS_MTG_VW"]').append('<br><a href="#" onclick="window.open(\'data:text/calendar;charset=utf8,' +
            			encodeURIComponent(packageICS(icsFile)) +
            			'\');">Download Class</a>');

			        /*$(this).find('span[id*="MTG_DATES"]').append(
            			'<br><a href="#" onclick="window.open(\'data:text/calendar;charset=utf8,' +
            			encodeURIComponent(packageICS(icsFile)) +
            			'\');">Download Class</a>'
          			);*/

		      	}	      
		    }
		});
  	});
})();
