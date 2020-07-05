curl "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv" > us-states.csv
curl 'https://opendata.ecdc.europa.eu/covid19/casedistribution/csv/' | awk -F "/" 'NR==1 || $2 >= 5' > eu-states.csv # data newer that 5th month
curl 'https://covidtracking.com/api/v1/states/daily.csv' > us-testing.csv
echo "date" > lastupdate
date >> lastupdate
