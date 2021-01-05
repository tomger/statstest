import urllib2
import io
import math
import pandas as pd
import datetime
import sys

WRITE_FILES = True

CSV_PATH = "data/{}.csv"
END_DATE = (datetime.datetime.now() - pd.to_timedelta("1day")).date()
START_DATE = END_DATE - pd.to_timedelta("30day")

def get_url_as_dataframe(url):
    request = urllib2.urlopen(url)
    csv_data = request.read()
    data = pd.read_csv(io.StringIO(csv_data.decode('utf-8')))
    return pd.DataFrame(data)

def get_change(df):
    start = df.head(1)['rolling_cases'].mean()
    end = df.tail(1)['rolling_cases'].mean()
    change = (end - start) / start
    if math.isnan(change):
        return 0
    return round(change * 100)

def get_ecdc():
    output_array = []
    df = get_url_as_dataframe('https://opendata.ecdc.europa.eu/covid19/casedistribution/csv/')

    for state in df['countriesAndTerritories'].unique():
        # select fields
        state_df = df.loc[df['countriesAndTerritories'] == state].filter(['dateRep', 'cases_weekly'])
        # find population
        population = df.loc[df['countriesAndTerritories'] == state].tail(1)['popData2019'].item()

        # skip small countries
        if population < 350000:
            continue

        # rename fields
        state_df = state_df.rename(columns={"dateRep": "date", "cases_weekly": "cases"})
        
        # format date
        state_df["date"] = state_df["date"].apply(lambda x: datetime.datetime.strptime(x, '%d/%m/%Y').date())
        state_df.sort_values(by='date', inplace=True, ascending=True) 
        # XXX FIX data source only provides weekly numbers since 12/2020
        state_df['rolling_cases'] = state_df['cases'].fillna(0).astype(int) 
        total_cases = state_df['cases'].sum().astype(int)

        path = "world-{}".format(state).replace(" ", "-").lower()

        window_df = state_df.loc[(state_df['date'] > START_DATE) & (state_df['date'] <= END_DATE)]
        if WRITE_FILES:
            window_df.to_csv(CSV_PATH.format(path), index = False, header=True)

        # add to index
        output_array.append({
            'path': path,
            'name': state.replace("_", " "),
            'byline': '',
            'population': population,
            'change-cases': get_change(window_df),
            'last-updated': window_df.tail(1)['date'].to_string(index=False),
            'last-cases': round(window_df.tail(7)['cases'].mean()),
            'total-cases': total_cases,
        })
    return output_array

def get_counties():
    output_array = []
    population_counties = pd.read_csv('lib/co-est2019.csv')
    population_counties = population_counties

    # covid_counties = pd.read_csv('us-counties.csv')

    request = urllib2.urlopen('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv')
    csv_data = request.read()
    covid_counties = pd.read_csv(io.StringIO(csv_data.decode('utf-8')))

    # Test: .query("CTYNAME == 'New York City'")
    for index, row in population_counties.iterrows():
        state = row['STNAME']
        county = row['CTYNAME'].replace(" County", "")
        population = row['POPESTIMATE2019']

        # skip small counties
        if population < 100000:
            continue

        df = covid_counties.loc[
            (covid_counties['state'] == state) &
            (covid_counties['county'] == county)].filter(['date', 'cases'])

        total_cases = df.tail(1)['cases'].to_string(index=False)
        # cummulative to delta
        df['cases'] = df['cases'].diff().fillna(0).clip(lower=0).astype(int)
        df['rolling_cases'] = df['cases'].rolling(7).mean().fillna(0).astype(int)

        # format date
        df['date'] = pd.to_datetime(df['date']).dt.date
        df = df.loc[df['date'] > START_DATE]
        

        # rename fields
        # state_df = state_df.rename(columns={"date": "Date"})

        # no data found
        if len(df.index) < 10:
            continue

        path = "us-co-{}-{}".format(county, state).replace(" ", "-").lower()
        if WRITE_FILES:
            df.to_csv(CSV_PATH.format(path), index = False, header=True)

        if county == "New York City":
            name = county
        else:
            name = "{} County".format(county)

        # add to index
        output_array.append({
            'path': path,
            'name': name,
            'byline': "{}".format(state),
            'population': population,
            'change-cases': get_change(df),
            'last-updated': df.tail(1)['date'].to_string(index=False),
            'last-cases': round(df.tail(7)['cases'].clip(lower=0).mean()),
            'total-cases': total_cases,
        })
    return output_array


# States

def get_states():
    output_array = []
    population_states = pd.read_csv('lib/nst-est2019-alldata.csv')
    request = urllib2.urlopen('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv')
    csv_data = request.read()
    data = pd.read_csv(io.StringIO(csv_data.decode('utf-8')))
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date']).dt.date

    for state in df['state'].unique():
        # select fields
        state_df = df.loc[df['state'] == state].filter(['date', 'cases'])

        total_cases = state_df.tail(1)['cases'].to_string(index=False)
        # cummulative to delta
        state_df['cases'] = state_df['cases'].diff().fillna(0).clip(lower=0).astype(int)
        state_df['rolling_cases'] = state_df['cases'].rolling(7).mean().fillna(0).astype(int)
        
        state_df = state_df.loc[df['date'] > START_DATE]

        path = "us-st-{}".format(state).replace(" ", "-").lower()
        if WRITE_FILES:
            state_df.to_csv(CSV_PATH.format(path), index = False, header=True)

        # find population
        population_row = population_states.query("NAME == '{}'".format(state))
        population = population_row['POPESTIMATE2019'].to_string(index=False)

        # add to index
        output_array.append({
            'path': path,
            'name': state,
            'byline': 'United States',
            'population': population,
            'change-cases': get_change(state_df),
            'last-updated': state_df.tail(1)['date'].to_string(index=False),
            'last-cases': round(state_df.tail(7)['cases'].clip(lower=0).mean()),
            'total-cases': total_cases,
        })
    return output_array

def write_sitemap(path, array):
    sitemap_head = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">'
    sitemap_item = '<url><loc>https://covid.iterator.us/region/{}</loc></url>'
    sitemap_foot = '</urlset>'

    output = [sitemap_head]
    for region in array:
        output.append(sitemap_item.format(region['path']))
    output.append(sitemap_foot)

    file = open(path, "w")
    file.write(''.join(output))
    file.close()

def write_indexes(array):
    template_file = open('index.html', 'r')
    template = template_file.read()
    template_file.close()

    for region in array:
        file = open('region/{}'.format(region['path']), "w")
        file.write(template.replace('<title>COVID-19 Watchlist</title>', '<title>COVID-19 Watchlist {}</title>'.format(region['name'])))
        file.close()



region_index = []
region_index.extend(get_states())
region_index.extend(get_counties())
region_index.extend(get_ecdc())


if WRITE_FILES:
    pd.DataFrame(region_index).to_csv("data/regions.csv", index = False, header=True)
    write_indexes(region_index)
    write_sitemap('sitemap.xml', region_index)
else:
    pd.DataFrame(region_index).to_csv(sys.stdout)



