Work Time Monitor
=================

Simple web page, which can be used to monitor working hours and wages. Based on google calendar.
![Screenshot](https://raw.github.com/jupe/work_time_monitor/master/screenshot/page.png "Example")

# Features
* Read your Google Calendar events (*)
* User Selectable time period
* Support multiple calendars
* Calculate summary of given period
** Durations [day, night, weekend, total] in hours
** Distances
* Calculate wages
* calculate taxes
* Download as CSV/TXT (not fully implemented)
* table view, which can be grouped by year/month/week or day

(*)
It woulf be best if you create separate calendar for tracking purpose, where all events are supposed to be like "working events". There is also several mobile applications, which can collect usage events to the remote google calendar.....

# Installation:

1. copy files to web server 
2. create your own config.json (example in config.example.json)
3. Open page.

# License
See LICENSE file
