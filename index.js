var dataView;
var gData;
var grid;

// this downloads the current data table as a CSV file to the client
function toText()
{
  var data = gData;
  var tmpArr = [];
  var tmpStr = '';
  tmpArr.push('start');
  tmpArr.push('end');
  tmpArr.push('title');
  tmpArr.push('duration');
  tmpArr.push('distance');
  tmpStr += tmpArr.join('\t')+"\n";
  for (var i = 0; i < data.length; i++) {
    tmpArr = [];
    tmpArr.push(data[i].start);
    tmpArr.push(data[i].end);
    tmpArr.push(data[i].title);
    tmpArr.push(data[i].distance);
    tmpStr += tmpArr.join('\t')+"\n";
    
  }
  $('#text').html( '<pre>'+tmpStr +'<pre>');
  
}
function toCSV() {
  var data = gData;
  var csvData = [];
  var tmpArr = [];
  var tmpStr = '';
  /*for (var i = 0; i < data.getNumberOfColumns(); i++) {
    // replace double-quotes with double-double quotes for CSV compatibility
    tmpStr = data.getColumnLabel(i).replace(/"/g, '""');
    tmpArr.push('"' + tmpStr + '"');
  }
  */
  tmpArr.push('"start"');
  tmpArr.push('"end"');
  tmpArr.push('"title"');
  tmpArr.push('"duration"');
  tmpArr.push('"distance"');
  csvData.push(tmpArr);
  for (var i = 0; i < data.length; i++) {
    tmpArr = [];
    if( data[i].title == 'TOTALS') break;
    tmpArr.push('"'+data[i].start+'"');
    tmpArr.push('"'+data[i].end+'"');
    tmpArr.push('"'+data[i].title+'"');
    tmpArr.push('"'+data[i].distance+'"');
    
    /*
    for (var j = 0; j < data.getNumberOfColumns(); j++) {
      switch(data.getColumnType(j)) {
        case 'string':
          // replace double-quotes with double-double quotes for CSV compat
          tmpStr = data.getValue(i, j).replace(/"/g, '""');
          tmpArr.push('"' + tmpStr + '"');
          break;
        case 'number':
          tmpArr.push(data.getValue(i, j));
          break;
        case 'boolean':
          tmpArr.push((data.getValue(i, j)) ? 'True' : 'False');
          break;
        case 'date':
          // decide what to do here, as there is no universal date format
          break;
        case 'datetime':
          // decide what to do here, as there is no universal date format
          break;
        case 'timeofday':
          // decide what to do here, as there is no universal date format
          break;
        default:
          // should never trigger
      }
    }*/
    csvData.push(tmpArr.join(','));
  }
  var output = csvData.join('\n');
 
  var uri = 'data:application/csv;charset=UTF-8,' + encodeURIComponent(output);
  var downloadLink = document.createElement("a");
  downloadLink.href = uri;
  downloadLink.download = "data.csv";

  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}
$(document).ready(function() {
    
    var dateFormat='YYYY-MM-DD HH:mm';
    var rangeStart = moment();
    var rangeEnd = moment();
    var Config;
    var ignoreKeys = [];
    var publicHolidayCalendars;
    var publicHolidays;
    //fetch configurations
    $.getJSON('config.json', null, function(data){
      Config = data;
      ignoreKeys = data.ignoreKeys;
    });
    //fetch holiday calendars
    $.getJSON('holidays.json', null, function(data){
      publicHolidayCalendars = data.publicHolidayCalendars;
    });
    
    $('#wage').change( function(){
        refreshData(rangeStart, rangeEnd);
    });
    $('#tax').change( function(){
        refreshData(rangeStart, rangeEnd);
    });
    $('#distance').change( function(){
        refreshData(rangeStart, rangeEnd);
    });
    $('#calendarfeed').change( function(){
        refreshData(rangeStart, rangeEnd);
    });
    $('#download').click( function(){
        toCSV();
    });
    
    $('#grouping').select2({
      placeholder: "Group by",
      allowClear: true,
      data:[
        {id:0,text:'Year', by: 'year'},
        {id:1,text:'month', by: 'month'},
        {id:2,text:'week', by: 'week'},
        {id:3,text:'day', by: 'day'}
      ]
    });
    $('#grouping').change( function(){
      var data = $('#grouping').select2('data');
      group(data?data.by:false);
      dataView.collapseAllGroups();
      dataView.refresh();
    });
    $('#createText').click( function(){
        toText();
    });
    function getWage()
    {
        return parseFloat( $('#wage').val() );
    }
    function getTax()
    {
        return parseFloat( $('#tax').val() );
    }
    function getSingleDistance()
    {
        return parseFloat( $('#distance').val() );
    }
    function getDistanceWage(year)
    {
        return Config.distanceWage;
    }
    function getFeedUrl()
    {
      var data = $('#calendarfeed').select2('data');
      return data?data.url:false;
    }
    function translatePublicHolidays(title){
      return title;
    }
    function getWeekHours(){
      var data = $('#calendarfeed').select2('data');
      if( !data ) return false;
      return data.weekHours;
    }
    function getSelectedHolidayCalendar(){
      var data = $('#calendarfeed').select2('data');
      if( !data ) return false;
      var cal = data["holiday-cal"];
      cal = publicHolidayCalendars[ cal ]
      return encodeURIComponent( cal );
    }
                   
    var myService;
    
    // Call function once the client has loaded
    google.setOnLoadCallback(function(){
      myService = new google.gdata.calendar.CalendarService('WorkingDiary');
    });
    function ucwords(str) {
      return (str + '')
        .replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function($1) {
          return $1.toUpperCase();
        });
    }
    
    function group(by) {
      if( !by ) {
        dataView.setGrouping([]);
        return;
      } 
      
      dataView.setGrouping([{
        getter:  function(g){ 
          return g[by]; 
        },
        formatter: function (g) {
          var totalDuration = 0;
          for( var i=0;i<g.rows.length;i++){
            if( g.rows[i].duration ) totalDuration+= g.rows[i].duration;
          }
          return ucwords(by)+": "+g.value+" Duration: "+(totalDuration/60/60).toFixed(1)+"h <span style='color:green'>(" + g.count + " items)</span>";
        }
      }]);
    }
    var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
    dataView = new Slick.Data.DataView({
      groupItemMetadataProvider: groupItemMetadataProvider,
      inlineFilters: true
    });
    
    function dateFormatter(row, cell, value, columnDef, dataContext) {
      return value.format(dateFormat)
    }
    function numberFormatter(multipler, fixed){
      return function durationFormatter(row, cell, value, columnDef, dataContext) {
        return (value*multipler).toFixed(fixed);
      }
    }
    
    var columns = [
      {id: "start", name: "Start", sortable: true, width: 130, field: "start", formatter: dateFormatter},
      {id: "end", name: "End",  sortable: true, width: 130, field: "end", formatter: dateFormatter},
      {id: "title", name: "Title",  sortable: true, width: 250, field: "title"},
      {id: "duration", name: "Duration [h:min]",  sortable: true, width: 100, field: "duration", formatter: numberFormatter(1/60/60, 1)},
      {id: "distance", name: "distance [km]",  sortable: true, width: 90, field: "distance"},
      {id: "twage", name: "wage [€]",  sortable: true, width: 80, field: "wage", formatter: numberFormatter(1, 1)},
      {id: "tTracelExp", name: "traveling expenses [€] (0.45€/km)",  sortable: true, width: 200, field: "travelExp"}
    ];

    var options = {
      enableCellNavigation: true,
      enableColumnReorder: false
    };
    grid = new Slick.Grid("#myGrid", dataView, columns, options);
    
    grid.registerPlugin(groupItemMetadataProvider);
    // wire up model events to drive the grid
    dataView.onRowCountChanged.subscribe(function (e, args) {
      grid.updateRowCount();
      grid.render();
    });

    dataView.onRowsChanged.subscribe(function (e, args) {
      grid.invalidateRows(args.rows);
      grid.render();
    });
    grid.onSort.subscribe(function (e, args) {
      sortcol = args.sortCol.field;  // Maybe args.sortcol.field ???
      dataView.sort(comparer, args.sortAsc);
    });
    function comparer(a, b) {
      var x = a[sortcol], y = b[sortcol];
      return (x == y ? 0 : (x > y ? 1 : -1));
    }
    grid.setSortColumn('start', true);
    //grid.setInitialSortColumn("start", true);
    
    $('#daterange').daterangepicker( {
        minDate: '01/01/2010',
        maxDate: '12/31/2015',
        showDropdowns: true,
        showWeekNumbers: true,
        maxDate: new Date(),
    }, function(start, end) {
        rangeStart = start;
        rangeEnd = end;
        refreshData(start, end, true);        
    });
    $("#calendarfeed").select2({
      allowClear: true,
      blurOnChange: true,
      openOnEnter: false,
      placeholder: "Select Calendar",
      ajax: { // instead of writing the function to execute the request we use Select2's convenient helper
        url: "config.json",
        dataType: 'json',
        data: function (term, page) {
          return {};
        },
        results: function (data, page) { // parse the results into the format expected by Select2.
          // since we are using custom formatting functions we do not need to alter remote JSON data
          return {results: data.feeds};
        }
      },
      dropdownCssClass: "bigdrop", // apply css that makes the dropdown taller
      formatResult: function (data) {
          return "<div class='select2-user-result'>" + data.text + "</div>";
      },
      formatSelection: function (data) {
          return data.text;
      }
    });
    
    
    function days_between(date1, date2) {

        // The number of milliseconds in one day
        var ONE_DAY = 1000 * 60 * 60 * 24

        // Convert both dates to milliseconds
        var date1_ms = date1.getTime()
        var date2_ms = date2.getTime()

        // Calculate the difference in milliseconds
        var difference_ms = Math.abs(date1_ms - date2_ms)

        // Convert back to days and return
        return Math.round(difference_ms/ONE_DAY)

    }
    
    function writer(data)
    {
      dataView.beginUpdate();
      gData = $.extend([],data);
      dataView.setItems(gData);
      dataView.endUpdate();
      
      dataView.refresh();
      grid.render();
    }
    var summary = {}
    function toHourAndMinuteStr(sec){
      return (sec/60/60).toFixed(1);
      /*var h = (sec/60/60).toFixed(0);
      sec -= parseInt(h)*100;
      var m = (100/60*sec).toFixed(0);
      return h+':'+m;*/
    }
    
    function renderSummary(){
      summary.cumulative = 0;
      for(var i=0;i<gData.length;i++){
        summary.cumulative += gData[i].duration;
      }
      var days = days_between(new Date(rangeStart), new Date(rangeEnd));
      if( days < 7 ) days = 7;
      summary.cumulative -= (Math.round(days / 7)*getWeekHours()*60*60);
      
      $('#summary').html(
      "<pre>SUMMARY:\n"+
      'Period:       '+ rangeStart.format('YYYY-MM-DD') + ' - ' + rangeEnd.format('YYYY-MM-DD') + "\n" +
      "Total       Day       Night     Weekend   Summary\n"+
      'Duration:   '+ toHourAndMinuteStr(summary.dayDurations/1000) +
                       '       '+ toHourAndMinuteStr(summary.nightDurations/1000) +
                       '       '+toHourAndMinuteStr(summary.weekendDurations/1000) +
                       '       '+toHourAndMinuteStr(summary.duration/1000)+ "\n"+
      'Distance:   '+ summary.dayDistances.toFixed(1)+
                    '      '+summary.nightDistances.toFixed(1)+
                    '       '+summary.weekendDistances.toFixed(1)+
                    '       '+summary.distance.toFixed(1)+"\n\n" +
      'Cumulative summary: '+toHourAndMinuteStr(summary.cumulative)+
      '</pre>');
      
      /*
      $('#summary').html(
      "<pre>SUMMARY:\n"+
      'Period:       '+ rangeStart.format('YYYY-MM-DD') + ' - ' + rangeEnd.format('YYYY-MM-DD') + "\n" +
      'Total         Duration: '+ toHourAndMinuteStr(summary.duration/1000) + " h\n"+
      'Total Day     Duration: '+ toHourAndMinuteStr(summary.dayDurations/1000) + " h\n"+
      'Total Night   Duration: '+ toHourAndMinuteStr(summary.nightDurations/1000) + " h\n"+
      'Total Weekend Duration: '+ toHourAndMinuteStr(summary.weekendDurations/1000) + " h\n"+
      'Total         Distance: '+ summary.distance.toFixed(1) + " km\n" +
      'Total Night   Distance: '+ summary.nightDistances.toFixed(1) + " km\n"+
      'Total Weekend Distance: '+ summary.weekendDistances.toFixed(1) + " km\n"+
      '</pre>');
      */
    }
    function clearSummary()
    {
        summary = {
            duration: 0,
            distance: 0,
            
            dayDurations: 0,
            nightDurations: 0,
            dayDistances: 0,
            nightDistances: 0,
            weekendDurations: 0,
            weekendDistances: 0,
            
            wage: 0,
            travelExp: 0
            
        }
    }
    function uuid(){
        var d = new Date().getTime();
        var _uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x7|0x8)).toString(16);
        });
        return _uuid;
    };
    function convert(entries)
    {
        
        var data = [];
        var len = entries.length;
        
        clearSummary();
        var i=0;
        var rowI=0;
        var theWage = getWage();
        var theDistanceWage = getDistanceWage();
        for (var len=entries.length; i < len; i++) {
            var entry = entries[i];
            
            var title = entry.getTitle().getText();
            
            var skip=false;
            parts = title.split(' ');
            for(var key in parts)
            {
                if( ignoreKeys.indexOf( parts[key].toLowerCase() ) >= 0 ){
                    skip=true; break;
                 }
            }
            if(skip)continue;
            
            
            var duration = 0;
            var startJSDate = null;
            var endJSDate = null;
            var times = entry.getTimes();
            var locations = entry.getLocations();
            if (times.length > 0) {
              startDateTime = times[0].getStartTime();
              startJSDate = moment(startDateTime.getDate());
              
              endDateTime = times[0].getEndTime();
              endJSDate = moment(endDateTime.getDate());
              duration = endJSDate-startJSDate;
            }
            var distance = getSingleDistance()*2;
            
            if( startJSDate.day() == 0 || startJSDate.day() == 6 )
            { //weekend time belong only to weekend section
              summary.weekendDurations += duration;
              summary.weekendDistances += distance;
            } else if( startJSDate.hour() <= Config.nightStart && endJSDate.hour() <= Config.nightStart) {
                summary.dayDurations += duration;
                summary.dayDistances += distance;
            } else if( startJSDate.hour() < Config.nightStart && endJSDate.hour() > Config.nightStart) {
                
                summary.dayDurations += (Config.nightStart-startJSDate.hour())*60*60000;
                summary.nightDurations -= startJSDate.minute()*60000;
                
                summary.nightDurations += (endJSDate.hour()-Config.nightStart)*60*60000;
                summary.nightDurations += endJSDate.minute()*60000;
                
                summary.dayDistances += distance/2;
                summary.nightDistances += distance/2;
            } else {
                summary.nightDurations += duration;
                summary.nightDistances += distance;
            }
            
            var wage = duration/1000/60/60*theWage;
            var travelExp = distance*theDistanceWage;
            summary.wage += wage;
            
            summary.travelExp += travelExp;
            summary.distance += distance;
            summary.duration += duration;
            data[rowI++] = {
                id: uuid(),
                week: startJSDate.format("w"),
                year: startJSDate.format("yyyy"),
                month: startJSDate.format("M"),
                day: startJSDate.format("d"),
                start: startJSDate,
                end: endJSDate,
                title: title,
                duration: (duration/1000),
                distance: distance,
                wage: wage,
                travelExp: travelExp
            };
        }
        
        /* SUMMARY OF DATA
        data[rowI++] = {
            id: uuid(),
            start: '',
            end: '',
            title: 'TOTALS',
                //moment(totalDuration).hour()+':'+moment(totalDuration).format('mm'),
            duration: (summary.duration/1000/60/60),
            distance: summary.distance,
            wage: summary.wage,
            travelExp: summary.travelExp
            
          };
          
        data[rowI++] = {
            id: uuid(),
            start: '',
            end: '',
            title: 'dayTime ( < 17:00)',
                //moment(totalDuration).hour()+':'+moment(totalDuration).format('mm'),
            duration: summary.dayDurations/1000/60/60,
            distance: summary.dayDistances,
            wage: summary.dayDurations/1000/60/60*2*getWage()
          };
        data[rowI++] = {
            id: uuid(),
            start: '',
            end: '',
            title: 'nightTime ( > 17:00)',
                //moment(totalDuration).hour()+':'+moment(totalDuration).format('mm'),
            duration: summary.nightDurations/1000/60/60,
            distance: summary.nightDistances,
            
            wage: summary.nightDurations/1000/60/60*2*getWage()
          };
        data[rowI++] = {
            id: uuid(),
            start: '',
            end: '',
            title: 'weekend',
                //moment(totalDuration).hour()+':'+moment(totalDuration).format('mm'),
            duration: summary.weekendDurations/1000/60/60,
            distance: summary.weekendDistances,
            
            wage: summary.weekendDurations/1000/60/60*2*getWage()
          };
         */
        return data;
    }
    
    
    function handleError(error)
    {
        console.log(error);
    }
    function getEvents(start, end, callback)
    {
      var handleMyFeed = function(myResultsFeedRoot) {
        //alert("This feed's title is: " + myResultsFeedRoot.feed.getTitle().getText());
        entries =  convert( myResultsFeedRoot.feed.entry );
        if( callback ) {
          callback(null, entries);
        } else {
          var combined = $.extend(true, [], holidays, entries);
          writer(combined);
        }
      }
      var url = getFeedUrl();
      if( url===false) {
        console.log('No calendar selected');
        return;
      }
      url += "?orderby=starttime&max-results=1000";
      // 2005-08-09T10:57:00-08:00.
      var frm='YYYY-MM-DD';
      url += "&start-min="+moment(start).format(frm)+'T00:00:00-00:00';
      url += "&start-max="+moment(end).format(frm)+'T24:00:00-00:00';
      myService.getEventsFeed(url, handleMyFeed, handleError);
    }
    
    function refreshData(start, end, reloadHolidays){
      var mergeData = function(error, holidays){
        if( error ){
          console.log(error);
          return;
        }
        console.log( 'There was '+holidays.length +' holidays in given period');
        getEvents(start, end, function(error, data){
          if( error ){
            console.log(error);
            return;
          }
          console.log( 'There was '+data.length +' events in given period');
          var combined = $.merge(data, holidays);
          console.log( 'Totally '+combined.length +' events in given period');
          writer(combined);
          renderSummary();
        });
      }
      if( !publicHolidays || reloadHolidays)  {
        getPublicHolidays(start, end, function(error, holidays){
          publicHolidays = holidays;
          mergeData(error, holidays);
        });
      } else {
        mergeData(false, publicHolidays);
      }
    }
    
    
    
    
    function getPublicHolidays(start, end, callback){
      
      var cal = getSelectedHolidayCalendar();
      if( !cal ){
        callback('period missing');
        return;
      }
      var url = 'https://www.google.com/calendar/feeds/'+cal+'/public/full';
      url += "?alt=json&orderby=starttime&max-results=1000";
      frm='YYYY-MM-DD'; // 2005-08-09T10:57:00-08:00.
      url += "&start-min="+moment(start).format(frm)+'T00:00:00-00:00';
      url += "&start-max="+moment(end).format(frm)+'T24:00:00-00:00';
      function handleMyHolidaysFeed(myResultsFeedRoot){
        var entry = myResultsFeedRoot.feed.entry;
        var list = [];
        if( !entry ){ 
          callback(null, list); //no public holidays in given period
          return;
        }
        for(var i=0;i<entry.length;i++){
          var startTime = moment.utc(entry[i]['gd$when'][0].startTime);
          var endTime = moment.utc(entry[i]['gd$when'][0].endTime);
          var item = {
            id: uuid(),
            start: startTime,
            end: endTime,
            title: translatePublicHolidays(entry[i].title.$t),
            duration: (startTime-endTime),
            distance: 0,
            wage: 0,
            travelExp: 0
          }
          list.push(item);
        }
        callback(null, list);
      }
      $.ajax({
        url: url,
        type: 'get',
        dataType: 'jsonp'
      }).done( handleMyHolidaysFeed );
    }
});
