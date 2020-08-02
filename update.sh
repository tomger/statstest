# data newer that 5th month
curl "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv" | awk -F "-" 'NR==1 || $2 >= 5' > us-states.csv
curl 'https://opendata.ecdc.europa.eu/covid19/casedistribution/csv/' | awk -F "/" 'NR==1 || $2 >= 5' | grep -v Bonaire | cut -d, -f2-7,9-10 > eu-states.csv
curl 'https://covidtracking.com/api/v1/states/daily.csv' > us-testing.csv
curl 'https://www.cdc.gov/nhsn/pdfs/covid19/covid19-NatEst.csv' > us-hospital.csv
curl 'https://raw.githubusercontent.com/nychealth/coronavirus-data/master/case-hosp-death.csv' > nyc.csv
echo "date" > lastupdate
date >> lastupdate

# more data
# https://www.cdc.gov/nhsn/covid19/report-overview.html
# https://github.com/CSSEGISandData/COVID-19

# Counties data
# https://www2.census.gov/programs-surveys/popest/datasets/2010-2019/counties/totals/co-est2019-alldata.csv
# https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv
